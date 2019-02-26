import React from 'react';
import {observer, Provider} from 'mobx-react';
import Binner from './Binner/Binner';
import * as d3 from 'd3';
import {Button, ControlLabel, FormControl, FormGroup, Modal, OverlayTrigger, Popover, Radio} from "react-bootstrap";
import FontAwesome from 'react-fontawesome';
import Histogram from "./Binner/Histogram";
import DerivedVariable from "../../../stores/DerivedVariable";
import uuidv4 from "uuid/v4";
import DerivedMapperFunctions from "../../../UtilityClasses/DeriveMapperFunctions";
import ColorScales from "../../../UtilityClasses/ColorScales";
import UtilityFunctions from "../../../UtilityClasses/UtilityFunctions";
import BinningStore from "./Binner/BinningStore";

const ModifyContinuous = observer(class ModifyContinuous extends React.Component {
    constructor(props) {
        super(props);
        this.data = this.getInitialData();
        this.state = this.setInitialState();
        this.binningStore = this.createBinningStore();
        this.changeTransformation = this.changeTransformation.bind(this);
        this.handleApply = this.handleApply.bind(this);
        this.close = this.close.bind(this);
    }

    /**
     * sets the initial state depending on the existance of an already derived variable
     * @returns {{bins: *, binNames: *, bin: boolean, colorRange: *, isXLog: boolean, name: string}}
     */
    setInitialState() {
        let bin;
        if (this.props.derivedVariable === null || !this.props.derivedVariable.modification.binning) {
            bin = false;
        }
        return {
            bin: bin,
            colorRange: this.props.variable.range,
            isXLog: this.props.derivedVariable !== null && this.props.derivedVariable.modification.logTransform !== false,
            name: this.props.derivedVariable !== null ? this.props.derivedVariable.name : this.props.variable.name,
        }
    }

    createBinningStore() {
        let bins, binNames, isBinary;
        if (this.props.derivedVariable === null || !this.props.derivedVariable.modification.binning) {
            let min = d3.min(this.data);
            let max = d3.max(this.data);
            let med = (max + min) / 2;
            if (min < 0) {
                med = 0;
            }
            bins = [min, med, max];
            binNames = [{
                name: UtilityFunctions.getScientificNotation(min) + " to " + UtilityFunctions.getScientificNotation(med),
                modified: false
            }, {
                name: UtilityFunctions.getScientificNotation(med) + " to " + UtilityFunctions.getScientificNotation(max),
                modified: false
            }];
            isBinary = false;
        }
        else {
            bins = this.props.derivedVariable.modification.binning.bins.slice();
            binNames = this.props.derivedVariable.modification.binning.binNames.map(d => {
                return {name: d.name, modified: d.modified}
            });
            isBinary = this.props.derivedVariable.datatype === "BINARY";
        }
        return new BinningStore(bins, binNames, isBinary);
    }

    /**
     * gets the initial data depending on the existence and modification type of a derived variable
     * @returns {any[]}
     */
    getInitialData() {
        if (this.props.derivedVariable === null || !this.props.derivedVariable.modification.logTransform) {
            return Object.values(this.props.variable.mapper).filter(d => d !== undefined);
        }
        else {
            return Object.values(this.props.variable.mapper).filter(d => d !== undefined).map(d => this.props.derivedVariable.modification.logTransform(d));

        }
    }

    /**
     * changes the transformation of the data
     * @param event
     */
    changeTransformation(event) {
        let isLog;
        if (event.target.value === 'linear') {
            isLog = false;
            this.data = Object.values(this.props.variable.mapper).filter(d => d !== undefined);
        }
        else {
            isLog = true;
            this.data = Object.values(this.props.variable.mapper).filter(d => d !== undefined).map(d => Math.log10(d));
        }
        let min = d3.min(this.data);
        let max = d3.max(this.data);
        let med = (max + min) / 2;
        if (min < 0) {
            med = 0;
        }
        this.setState({
            isXLog: isLog,
            bins: [min, med, max],
            binNames: [{
                name: UtilityFunctions.getScientificNotation(min) + " to " + UtilityFunctions.getScientificNotation(med),
                modified: false
            }, {
                name: UtilityFunctions.getScientificNotation(med) + " to " + UtilityFunctions.getScientificNotation(max),
                modified: false
            }]
        });
    }


    close() {
        this.props.closeModal();
    }


    /**
     * applies binning to data and color scales
     */
    handleApply() {
        const newId = uuidv4();
        let modification = {
            type: "continuousTransform",
            logTransform: this.state.isXLog ? Math.log10 : false, binning: this.state.bin ? {
                bins: this.binningStore.bins,
                binNames: this.binningStore.binNames
            } : false
        };
        console.log(this.variableChanged());
        let returnVariable;
        if (this.state.bin) {
            if (!this.binningStore.isBinary) {
                let binnedRange = ColorScales.getBinnedRange(d3.scaleLinear().domain(this.props.variable.domain).range(this.state.colorRange), this.binningStore.binNames, this.binningStore.bins);
                returnVariable = new DerivedVariable(newId, this.state.name, "ORDINAL", this.props.variable.description + " (binned)", [this.props.variable.id], modification, binnedRange, this.binningStore.binNames.map(d => d.name), DerivedMapperFunctions.getModificationMapper(modification, [this.props.variable.mapper]));
            }
            else {
                returnVariable = new DerivedVariable(newId, this.state.name, "BINARY", this.props.variable.description + " (binned)", [this.props.variable.id], modification, [], [], DerivedMapperFunctions.getModificationMapper(modification, [this.props.variable.mapper]));
            }
            this.props.setColorRange(this.props.variable.id, this.state.colorRange);
        }
        else if (this.state.isXLog) {
            returnVariable = new DerivedVariable(newId, this.state.name, "NUMBER", this.props.variable.description, [this.props.variable.id], modification, this.state.colorRange, [], DerivedMapperFunctions.getModificationMapper(modification, [this.props.variable.mapper]));
        }
        else {
            returnVariable = this.props.variable;
            returnVariable.range = this.state.colorRange;
        }
        this.props.callback(returnVariable);
        this.props.closeModal();
    }

    variableChanged() {
        if (this.props.derivedVariable === null) {
            return !this.state.isXLog;
        }
        else {
            if (this.binningStore.isBinary !== (this.props.derivedVariable.datatype === "BINARY")) {
                return true;
            }
            if (this.state.bin) {
                if (!this.props.derivedVariable.modification.binning) {
                    return true;
                }
                else {
                    if (this.props.derivedVariable.modification.binning.bins.length !== this.binningStore.bins.length) {
                        return true;
                    }
                    else {
                        for (let i = 0; i < this.props.derivedVariable.modification.binning.binNames.length; i++) {
                            if (this.props.derivedVariable.modification.binning.binNames[i] !== this.binningStore.binNames[i]) {
                                return true;
                            }
                        }
                        for (let i = 0; i < this.props.derivedVariable.modification.binning.bins.length; i++) {
                            if (this.props.derivedVariable.modification.binning.bins[i] !== this.binningStore.bins[i]) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }
    }


    /**
     * gets the radio buttons for selecting the transformation
     * @returns {*}
     */
    getRadio() {
        let disabled = false;
        if (d3.min(Object.values(this.props.variable.mapper)) < 0) {
            disabled = true;
        }
        return (<FormGroup>
            <Radio onChange={this.changeTransformation} checked={!this.state.isXLog} disabled={disabled}
                   value={'linear'}
                   name="XradioGroup"
                   inline>
                None
            </Radio>{' '}
            <Radio onChange={this.changeTransformation} value={'log'} checked={this.state.isXLog} disabled={disabled}
                   name="XradioGroup" inline>
                Log
            </Radio>{' '}
        </FormGroup>);


    }

    /**
     * gets a histogram or a Binner if in binning mode
     * @returns {*}
     */
    getBinning() {
        const width = 350;
        const height = 200;
        const min = Math.min(...this.data);
        const max = Math.max(...this.data);
        let xScale = d3.scaleLinear().domain([min, max]).range([0, width]);
        const bins = d3.histogram()
            .domain([min, max])
            .thresholds(xScale.ticks(30))(this.data);
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(bins, function (d) {
                return d.length;
            })]).range([height, 0]);
        if (this.state.bin) {
            return <Provider binningStore={this.binningStore}>
                <Binner data={this.data}
                        xScale={xScale}
                        yScale={yScale}
                        xLabel={this.state.name}
                        width={width}
                        height={height}
                        histBins={bins}/>
            </Provider>
        }
        else {
            const margin = {top: 20, right: 20, bottom: 90, left: 50},
                w = width + (margin.left + margin.right),
                h = height + (margin.top + margin.bottom);
            const transform = 'translate(' + margin.left + ',' + margin.top + ')';
            return <svg width={w} height={h}>
                <g transform={transform}><Histogram bins={bins} xScale={xScale} yScale={yScale}
                                                    h={height}
                                                    w={width} xLabel={this.state.name}
                                                    numValues={this.data.length}/></g>
            </svg>
        }
    }


    static handleOverlayClick(event) {
        event.stopPropagation();
        document.body.click();
    }

    /**
     * gets the gradient of the color scale
     * @param range
     * @param width
     * @param height
     * @returns {*}
     */
    static getGradient(range, width, height) {
        let intermediateStop = null;
        if (range.length === 3) {
            intermediateStop = <stop offset="50%" style={{stopColor: range[1]}}/>;
        }
        let randomId = uuidv4();
        return <svg width={width}
                    height={height}>
            <g>
                <defs>
                    <linearGradient id={randomId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{stopColor: range[0]}}/>
                        {intermediateStop}
                        <stop offset="100%" style={{stopColor: range[range.length - 1]}}/>
                    </linearGradient>
                </defs>
                <rect width={width} height={height} fill={"url(#" + randomId + ")"}/>
            </g>
        </svg>;
    }

    /**
     * gets the popover for the selection of a color scale
     * @returns {*}
     */
    getColorScalePopover() {
        const width = 100;
        const height = 20;
        let linearColorRange = [];
        if (Math.min(...this.data) < 0) {
            linearColorRange = ColorScales.continuousThreeColorRanges;
        }
        else {
            linearColorRange = ColorScales.continuousTwoColorRanges;
        }
        return <form>
            <FormGroup>
                {linearColorRange.map((d, i) => <Radio key={i} onChange={() => this.setState({colorRange: d})}
                                                       name="ColorScaleGroup">
                    {ModifyContinuous.getGradient(d, width, height)}
                </Radio>)}
            </FormGroup>
        </form>
    }

    render() {
        const colorScalePopOver = <Popover id="popover-positioned-right" title="Choose color scale">
            {this.getColorScalePopover()}
        </Popover>;
        return (
            <Modal show={this.props.modalIsOpen}
                   onHide={this.close}>
                <Modal.Header>
                    <Modal.Title>Modify continuous variable</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        <ControlLabel>Variable name</ControlLabel>
                        <FormControl
                            type="text"
                            value={this.state.name}
                            onChange={(e) => this.setState({name: e.target.value})}/>
                        <ControlLabel>Description</ControlLabel>
                        <p>{this.props.variable.description}</p>
                        <ControlLabel>Color Scale <OverlayTrigger rootClose={true}
                                                                  onClick={(e) => ModifyContinuous.handleOverlayClick(e)}
                                                                  trigger="click"
                                                                  placement="right"
                                                                  overlay={colorScalePopOver}><FontAwesome
                            name="paint-brush"/></OverlayTrigger></ControlLabel>
                        <p>{ModifyContinuous.getGradient(this.state.colorRange, 100, 20)}</p>
                        <ControlLabel>Transform data</ControlLabel>
                        {this.getRadio()}
                    </form>
                    {this.getBinning()}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.close}>
                        Cancel
                    </Button>
                    <Button onClick={() => this.setState({bin: !this.state.bin})}
                            bsStyle="primary">{this.state.bin ? "<< Cancel Binning" : "Bin >>"}>}</Button>
                    <Button onClick={() => this.handleApply()}>
                        Apply

                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
});
export default ModifyContinuous;