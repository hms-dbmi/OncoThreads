import React from 'react';
import {observer} from 'mobx-react';
import Binner from './Binner/Binner';
import * as d3 from 'd3';
import {Button, ControlLabel, FormControl, FormGroup, Modal, OverlayTrigger, Popover, Radio} from "react-bootstrap";
import FontAwesome from 'react-fontawesome';
import Histogram from "./Binner/Histogram";
import DerivedVariable from "../../DerivedVariable";
import uuidv4 from "uuid/v4";
import MapperCombine from "../../MapperCombineFunctions";
import ColorScales from "../../ColorScales";


const ModifyContinuous = observer(class ModifyContinuous extends React.Component {
    constructor(props) {
        super(props);
        this.data = this.getInitialData();
        this.state = this.setInitialState();
        this.changeTransformation = this.changeTransformation.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleBinChange = this.handleBinChange.bind(this);
        this.toggleBinningActive = this.toggleBinningActive.bind(this);
        this.handleBinNameChange = this.handleBinNameChange.bind(this);
        this.handleApply = this.handleApply.bind(this);
        this.close = this.close.bind(this);
    }

    /**
     * sets the initial state depending on the existance of an already derived variable
     * @returns {{bins: *, binNames: *, bin: boolean, colorRange: *, isXLog: boolean, name: string}}
     */
    setInitialState() {
        let bins, binNames, bin;
        if (this.props.derivedVariable === null || !this.props.derivedVariable.modification.binning) {
            let min = d3.min(this.data);
            let max = d3.max(this.data);
            let med = (max + min) / 2;
            if (min < 0) {
                med = 0;
            }
            bins = [min, med, max];
            binNames = [{name: min + " to " + med, modified: false}, {name: med + " to " + max, modified: false}];
            bin = false;
        }
        else {
            bins = this.props.derivedVariable.modification.binning.bins;
            binNames = this.props.derivedVariable.modification.binning.binNames;
            bin = true;
        }
        return {
            bins: bins,
            binNames: binNames,
            bin: bin,
            colorRange: this.props.derivedVariable === null ? this.props.variable.range : this.props.derivedVariable.range,
            isXLog: !(this.props.derivedVariable === null || !this.props.derivedVariable.modification.logTransform),
            name: this.props.derivedVariable !== null ? this.props.derivedVariable.name : this.props.variable.name
        }
    }

    /**
     * handles the name change
     * @param event
     */
    handleNameChange(event) {
        this.setState({name: event.target.value});
    }

    /**
     * handles the change of bins
     * @param bins
     */
    handleBinChange(bins) {
        if (bins.length === this.state.bins.length) {
            let binNames = this.state.binNames.slice();
            for (let i = 1; i < bins.length; i++) {
                if (!binNames[i - 1].modified) {
                    binNames[i - 1].name = Math.round(bins[i - 1] * 100) / 100 + " to " + Math.round(bins[i] * 100) / 100;
                }
            }
            this.setState({bins: bins, binNames: binNames})
        }
        else {
            let binNames = [];
            for (let i = 1; i < bins.length; i++) {
                binNames.push({
                    name: Math.round(bins[i - 1] * 100) / 100 + " to " + Math.round(bins[i] * 100) / 100,
                    modified: false
                });
            }
            this.setState({bins: bins, binNames: binNames})
        }

    }

    /**
     * handles the change of a bin name
     * @param e
     * @param index
     */
    handleBinNameChange(e, index) {
        let binNames = this.state.binNames.slice();
        binNames[index] = {name: e.target.value, modified: true};
        this.setState({binNames: binNames});
    }

    /**
     * gets the initial data depending on the existence and modification type of a derived variable
     * @returns {any[]}
     */
    getInitialData() {
        if (this.props.derivedVariable === null || !this.props.derivedVariable.modification.logTransform) {
            return Object.values(this.props.variable.mapper).filter(d=>d!==undefined);
        }
        else {
            return Object.values(this.props.variable.mapper).filter(d=>d!==undefined).map(d => this.props.derivedVariable.modification.logTransform(d));

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
            this.data = Object.values(this.props.variable.mapper).filter(d=>d!==undefined);
        }
        else {
            isLog = true;
            this.data = Object.values(this.props.variable.mapper).filter(d=>d!==undefined).map(d => Math.log10(d));
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
                name: Math.round(min * 100) / 100 + " to " + Math.round(med * 100) / 100,
                modified: false
            }, {name: Math.round(med * 100) / 100 + " to " + Math.round(max * 100) / 100, modified: false}]
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
            logTransform: this.state.isXLog ? Math.log10 : false, binning: this.state.bin ? {
                bins: this.state.bins,
                binNames: this.state.binNames
            } : false
        };
        let returnVariable;
        if (this.state.bin) {
            let binnedRange=ColorScales.getBinnedRange(d3.scaleLinear().domain(this.props.variable.domain).range(this.state.colorRange),this.state.binNames,this.state.bins);
            returnVariable = new DerivedVariable(newId, this.state.name, "ORDINAL", this.props.variable.description + " (binned)", [this.props.variable.id], "continuousTransform", modification, binnedRange, this.state.binNames.map(d => d.name), MapperCombine.getModificationMapper("continuousTransform", modification, [this.props.variable.mapper]),this.props.variable.profile);
        }
        else if(this.state.isXLog){
            returnVariable = new DerivedVariable(newId, this.state.name, "NUMBER", this.props.variable.description, [this.props.variable.id], "continuousTransform", modification, this.state.colorRange, [], MapperCombine.getModificationMapper("continuousTransform", modification, [this.props.variable.mapper]),this.props.variable.profile);
        }
        else{
            returnVariable = this.props.variable;
            returnVariable.range=this.state.colorRange;
        }
        this.props.callback(returnVariable);
        this.props.closeModal();
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
            <Radio defaultChecked onClick={this.changeTransformation} disabled={disabled} value={'linear'} name="XradioGroup"
                   inline>
                None
            </Radio>{' '}
            <Radio onClick={this.changeTransformation} value={'log'} disabled={disabled} name="XradioGroup" inline>
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
            return <Binner data={this.data}
                           variable={this.props.variable}
                           bins={this.state.bins}
                           binNames={this.state.binNames}
                           xScale={xScale}
                           yScale={yScale}
                           xLabel={this.state.name}
                           width={width}
                           height={height}
                           histBins={bins}
                           handleBinChange={this.handleBinChange}
                           handleBinNameChange={this.handleBinNameChange}/>
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

    /**
     * toggles the bin state
     */
    toggleBinningActive() {
        this.setState({bin: !this.state.bin});
    }

    /**
     * gets the button for binning
     * @returns {*}
     */
    getBinButton() {
        if (this.state.bin) {
            return <Button onClick={this.toggleBinningActive} bsStyle="primary">{"<< Cancel Binning"}</Button>
        }
        else {
            return <Button onClick={this.toggleBinningActive} bsStyle="primary">{"Bin >>"}</Button>

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
            linearColorRange = [
                ['#0571b0', '#f7f7f7', '#ca0020'],
                ['#08ff00', '#000000', '#ff0000']
            ]
        }
        else {
            linearColorRange = [
                ['rgb(214, 230, 244)', 'rgb(8, 48, 107)'],
                ['rgb(218, 241, 213)', 'rgb(0, 68, 27)'],
                ['rgb(232, 232, 232)', 'rgb(0, 0, 0)'],
                ['rgb(254, 222, 191)', 'rgb(127, 39, 4)'],
                ['rgb(232, 230, 242)', 'rgb(63, 0, 125)'],
                ['rgb(253, 211, 193)', 'rgb(103, 0, 13)'],
            ]

        }
        return <form>
            <FormGroup>
                {linearColorRange.map((d, i) => <Radio key={i} onChange={() => this.handleColorScaleChange(d)}
                                                       name="ColorScaleGroup">
                    {ModifyContinuous.getGradient(d, width, height)}
                </Radio>)}
            </FormGroup>
        </form>
    }

    /**
     * handles the change of the color scale
     * @param scale
     */
    handleColorScaleChange(scale,) {
        this.setState({colorRange: scale});
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
                            onChange={this.handleNameChange}/>
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
                    {this.getBinButton()}
                    <Button onClick={() => this.handleApply()}>
                        Apply

                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
});
export default ModifyContinuous;