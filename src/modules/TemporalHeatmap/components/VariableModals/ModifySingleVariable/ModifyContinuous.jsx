import React from 'react';
import {inject, observer, Provider} from 'mobx-react';
import Binner from './Binner/Binner';
import * as d3 from 'd3';
import {
    Button,
    Checkbox,
    ControlLabel,
    FormControl,
    FormGroup,
    Modal,
    OverlayTrigger,
    Popover,
    Radio
} from "react-bootstrap";
import FontAwesome from 'react-fontawesome';
import Histogram from "./Binner/Histogram";
import DerivedVariable from "../../../stores/DerivedVariable";
import uuidv4 from "uuid/v4";
import DerivedMapperFunctions from "../../../UtilityClasses/DeriveMapperFunctions";
import ColorScales from "../../../UtilityClasses/ColorScales";
import UtilityFunctions from "../../../UtilityClasses/UtilityFunctions";
import BinningStore from "./Binner/BinningStore";
import VariableTable from "../VariableTable";

/**
 * Modification of a continuous variable
 */
const ModifyContinuous = inject("variableManagerStore", "rootStore")(observer(class ModifyContinuous extends React.Component {
    constructor(props) {
        super(props);
        this.width = 350;
        this.height = 200;
        this.allValues = this.getAllInitialValues();
        this.state = this.setInitialState();
        this.binningStore = this.createBinningStore();
        this.changeTransformation = this.changeTransformation.bind(this);
        this.handleApply = this.handleApply.bind(this);
        this.close = this.close.bind(this);
    }

    /**
     * sets the initial state depending on the existance of an already derived variable
     * @returns {{bins: Object, binNames: Object, bin: boolean, colorRange: string[], isXLog: boolean, name: string}}
     */
    setInitialState() {
        let bin = true;
        if (this.props.derivedVariable === null || !this.props.derivedVariable.modification.binning) {
            bin = false;
        }
        return {
            bin: bin, // bin/don't bin variable
            colorRange: this.props.variable.range, // currently selected color range
            isXLog: this.props.derivedVariable !== null && this.props.derivedVariable.modification.logTransform !== false, // is data log transformed
            name: this.props.derivedVariable !== null ? this.props.derivedVariable.name : this.props.variable.name, // name of variable
            applyToAll: false // apply modification to all variables in the profile
        }
    }

    /**
     * creates a store that handles binning the variable
     * @return {BinningStore}
     */
    createBinningStore() {
        let bins, binNames, isBinary;
        if (this.props.derivedVariable === null || !this.props.derivedVariable.modification.binning) {
            let min = d3.min(this.allValues);
            let max = d3.max(this.allValues);
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
        const min = Math.min(...this.allValues);
        const max = Math.max(...this.allValues);
        let xScale = d3.scaleLinear().domain([min, max]).range([0, this.width]);
        return new BinningStore(bins, binNames, isBinary, xScale);
    }

    /**
     * gets all possible values that the variable can have. If the variable is already log transformed, the values are transformed too
     * @returns {number[]}
     */
    getAllInitialValues() {
        if (this.props.derivedVariable === null || !this.props.derivedVariable.modification.logTransform) {
            return Object.values(this.props.variable.mapper).filter(d => d !== undefined);
        }
        else {
            return Object.values(this.props.variable.mapper).filter(d => d !== undefined).map(d => this.props.derivedVariable.modification.logTransform(d));

        }
    }

    /**
     * changes the transformation of the data, adapts all values
     * @param {event} event
     */
    changeTransformation(event) {
        let isLog;
        if (event.target.value === 'linear') {
            isLog = false;
            this.allValues = Object.values(this.props.variable.mapper).filter(d => d !== undefined);
        }
        else {
            isLog = true;
            this.allValues = Object.values(this.props.variable.mapper).filter(d => d !== undefined).map(d => Math.log10(d));
        }
        let min = d3.min(this.allValues);
        let max = d3.max(this.allValues);
        let med = (max + min) / 2;
        if (min < 0) {
            med = 0;
        }
        this.binningStore.setBins([min, med, max], d3.scaleLinear().domain([min, max]).range([0, this.width]));
        this.binningStore.resetBinNames();
        this.setState({
            isXLog: isLog,
        });
    }

    /**
     * closes modal
     */
    close() {
        this.props.closeModal();
    }


    /**
     * applies binning to data and color scales
     * creates a new derived variable if the variable has been modified
     */
    handleApply() {
        const newId = uuidv4();
        let modification = {};
        let datatype = "NUMBER";
        let range = this.state.colorRange;
        let domain = [];
        let profileDomain = [];
        const oldVariable = this.props.derivedVariable !== null ? this.props.derivedVariable : this.props.variable;
        if (this.state.applyToAll) {
            profileDomain = this.props.variableManagerStore.getProfileDomain(this.props.variable.profile);
        }
        //case:  values have been binned
        if (this.state.bin) {
            modification = this.getBinnedModification();
            //case: values are converted to binary
            if (!this.binningStore.isBinary) {
                datatype = "ORDINAL";
                domain = modification.binning.binNames.map(d => d.name);
                if (this.state.applyToAll) {
                    range = ColorScales.getBinnedRange(d3.scaleLinear().domain(profileDomain).range(this.state.colorRange), modification.binning.bins);
                }
                else {
                    range = ColorScales.getBinnedRange(d3.scaleLinear().domain(this.props.variable.domain).range(this.state.colorRange), modification.binning.bins);
                }
            }
            //case: values are converted to binary
            else {
                datatype = "BINARY";
            }
            oldVariable.changeRange(this.state.colorRange);
        }
        else {
            modification = {
                type: "continuousTransform",
                logTransform: this.state.isXLog ? Math.log10 : false, binning: false
            };
        }
        const mapper = DerivedMapperFunctions.getModificationMapper(modification, [this.props.variable.mapper]);
        let derivedProfile = uuidv4();
        const returnVariable = new DerivedVariable(newId, this.state.name, datatype, this.props.variable.description + "_modified", [this.props.variable.id], modification, range, domain, mapper, derivedProfile, this.props.variable.type);
        let profile = this.props.derivedVariable === null ? this.props.variable.profile : this.props.derivedVariable.profile;
        // if variable has been modified replace the variable with the new variable
        if (VariableTable.variableChanged(oldVariable, returnVariable)) {
            this.props.variableManagerStore.replaceDisplayedVariable(oldVariable.id, returnVariable);
            if (this.state.applyToAll) {
                if (this.state.isXLog && profileDomain[0] < 0) {
                    alert("Modification could not be applied to other variables, since variables with negative values cannot be log transformed");
                }
                else {
                    this.props.variableManagerStore.applyToEntireProfile(profile, derivedProfile, datatype, modification, domain, range)
                }
            }
        }
        // if variable has not been modified (except for the colors) only change color range
        else {
            if (this.state.applyToAll) {
                this.props.variableManagerStore.applyRangeToEntireProfile(profile, range);
            }
            else {
                oldVariable.changeRange(range);
            }
        }
        this.props.closeModal();
    }

    /**
     * creates a modification object for binning a variable
     * @return {{type: string, logTransform: function|false, binning: {bins: number[], binNames: Object[]}}}
     */
    getBinnedModification() {
        let bins = this.binningStore.bins.slice();
        let binNames = this.binningStore.binNames.slice();
        if (this.state.applyToAll) {
            bins[0] = this.props.variableManagerStore.getMinOfProfile(this.props.variable.profile);
            bins[bins.length - 1] = this.props.variableManagerStore.getMaxOfProfile(this.props.variable.profile);
            if (!binNames[0].modified) {
                binNames[0].name = UtilityFunctions.getScientificNotation(bins[0]) + " to " + UtilityFunctions.getScientificNotation(bins[1]);
            }
            if (!binNames[binNames.length - 1].modified) {
                binNames[binNames.length - 1].name = UtilityFunctions.getScientificNotation(bins[bins.length - 2]) + " to " + UtilityFunctions.getScientificNotation(bins[bins.length - 1]);
            }
        }
        return {
            type: "continuousTransform",
            logTransform: this.state.isXLog ? Math.log10 : false, binning: {
                bins: bins,
                binNames: binNames
            }
        };
    }


    /**
     * gets the radio buttons for selecting the transformation
     * @returns {FormGroup}
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
     * @returns {(Provider|svg)}
     */
    getBinning() {
        const min = Math.min(...this.allValues);
        const max = Math.max(...this.allValues);
        const bins = d3.histogram()
            .domain([min, max])
            .thresholds(this.binningStore.xScale.ticks(30))(this.allValues);
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(bins, function (d) {
                return d.length;
            })]).range([this.height, 0]);
        if (this.state.bin) {
            return <Provider binningStore={this.binningStore}>
                <Binner data={this.allValues}
                        yScale={yScale}
                        xLabel={this.state.name}
                        width={this.width}
                        height={this.height}
                        histBins={bins}/>
            </Provider>
        }
        else {
            const margin = {top: 20, right: 20, bottom: 90, left: 50},
                w = this.width + (margin.left + margin.right),
                h = this.height + (margin.top + margin.bottom);
            const transform = 'translate(' + margin.left + ',' + margin.top + ')';
            return <svg width={w} height={h}>
                <g transform={transform}><Histogram bins={bins} xScale={this.binningStore.xScale} yScale={yScale}
                                                    h={this.height}
                                                    w={this.width} xLabel={this.state.name}
                                                    numValues={this.allValues.length}/></g>
            </svg>
        }
    }

    /**
     * gets the gradient of the color scale
     * @param {string[]} range
     * @param {number} width
     * @param {number} height
     * @returns {svg} - gradient of colors in range
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
     * @returns {form}
     */
    getColorScalePopover() {
        const width = 100;
        const height = 20;
        let linearColorRange = [];
        if (Math.min(...this.allValues) < 0) {
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

    /**
     * returns a checkbox if variable that will be modified is part of a molecular profile.
     * Checking the checkbox results in the modification being applied to all variables of that profile
     * @return {Checkbox|null}
     */
    getApplyToAll() {
        let checkbox = null;
        let profileIndex = this.props.rootStore.availableProfiles.map(d => d.molecularProfileId).indexOf(this.props.variable.profile);
        if (profileIndex !== -1 || this.props.variable.profile === "Variant allele frequency") {
            checkbox =
                <Checkbox checked={this.state.applyToAll} value={this.state.applyToAll}
                          onChange={() => this.setState({applyToAll: !this.state.applyToAll})}>{"Apply action to all variables of this type"}</Checkbox>
        }
        return checkbox;

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
                    {this.getApplyToAll()}
                    <Button onClick={this.close}>
                        Cancel
                    </Button>
                    <Button onClick={() => this.setState({bin: !this.state.bin})}
                            bsStyle="primary">{this.state.bin ? "<< Cancel Binning" : "Bin >>"}</Button>
                    <Button onClick={() => this.handleApply()}>
                        Apply
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
}));
export default ModifyContinuous;