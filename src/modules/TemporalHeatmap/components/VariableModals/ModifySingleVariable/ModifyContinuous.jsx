import React from 'react';
import { inject, observer, Provider } from 'mobx-react';
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
    Radio,
} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import uuidv4 from 'uuid/v4';
import { extendObservable } from 'mobx';
import { PropTypes } from 'prop-types';
import Binner from './Binner/Binner';
import Histogram from './Binner/Histogram';
import DerivedVariable from 'modules/TemporalHeatmap/stores/DerivedVariable';
import DerivedMapperFunctions from 'modules/TemporalHeatmap/UtilityClasses/DeriveMapperFunctions';
import ColorScales from 'modules/TemporalHeatmap/UtilityClasses/ColorScales';
import {getScientificNotation} from 'modules/TemporalHeatmap/UtilityClasses/UtilityFunctions';
import BinningStore from './Binner/BinningStore';
import OriginalVariable from 'modules/TemporalHeatmap/stores/OriginalVariable';

/**
 * Modification of a continuous variable
 */
const ModifyContinuous = inject('variableManagerStore', 'rootStore')(observer(class ModifyContinuous extends React.Component {
    constructor(props) {
        super(props);
        this.width = 350;
        this.height = 200;
        this.allValues = this.getAllInitialValues();
        extendObservable(this, this.initializeObservable());
        this.binningStore = this.createBinningStore();
        this.changeTransformation = this.changeTransformation.bind(this);
        this.handleApply = this.handleApply.bind(this);
        this.close = this.close.bind(this);
    }


    /**
     * gets all possible values that the variable can have.
     * If the variable is already log transformed, the values are transformed too
     * @returns {number[]}
     */
    getAllInitialValues() {
        if (this.props.derivedVariable === null
            || !this.props.derivedVariable.modification.transformFunction) {
            return Object.values(this.props.variable.mapper).filter(d => d !== undefined);
        }
        return Object.values(this.props.variable.mapper).filter(d => d !== undefined)
            .map(d => this.props.derivedVariable.modification.transformFunction(d));
    }


    /**
     * gets modified variable
     * @param {number[]} profileDomain
     * @return {DerivedVariable}
     */
    getReturnVariable(profileDomain) {
        const newId = uuidv4();
        let modification = {};
        let datatype = 'NUMBER';
        let range = this.colorRange;
        let domain = [];
        // case:  values have been binned
        if (this.bin) {
            modification = this.getBinnedModification(profileDomain);
            // case: values are converted to binary
            if (!this.binningStore.isBinary) {
                datatype = 'ORDINAL';
                domain = modification.binning.binNames.map(d => d.name);
                // case: values are converted to binary
            } else {
                datatype = 'BINARY';
                range = [];
            }
        } else {
            modification = {
                type: 'continuousTransform',
                transformFunction: this.isXLog ? Math.log10 : false,
                binning: false,
            };
        }
        const mapper = DerivedMapperFunctions
            .getModificationMapper(modification, [this.props.variable.mapper]);
        const derivedProfile = uuidv4();
        return new DerivedVariable(newId, this.getName(), datatype,
            `${this.props.variable.description}_modified`, [this.props.variable.id],
            modification, range, domain, mapper, derivedProfile, this.props.variable.type);
    }

    /**
     * creates a modification object for binning a variable
     * @return {{type: string, transformFunction: function|false,
     * binning: {bins: number[], binNames: Object[]}}}
     */
    getBinnedModification(profileDomain) {
        const bins = this.binningStore.bins.slice();
        const binNames = this.binningStore.binNames.slice();
        if (this.applyToAll) {
            let min = profileDomain[0];
            let max = profileDomain[1];
            if (min < 0 && max > 0) {
                if (-min > max) {
                    max = -min;
                } else {
                    min = -max;
                }
            }
            bins[0] = min;
            bins[bins.length - 1] = max;
            if (!binNames[0].modified) {
                binNames[0].name = `${getScientificNotation(bins[0])} to ${getScientificNotation(bins[1])}`;
            }
            if (!binNames[binNames.length - 1].modified) {
                binNames[binNames.length - 1].name = `${getScientificNotation(bins[bins.length - 2])} to ${getScientificNotation(bins[bins.length - 1])}`;
            }
        }
        return {
            type: 'continuousTransform',
            transformFunction: this.isXLog ? Math.log10 : false,
            binning: {
                bins,
                binNames,
            },
        };
    }

    /**
     * gets the name for the modified variable
     * @return {string}
     */
    getName() {
        if (this.name === this.props.variable.name && this.props.derivedVariable === null) {
            return this.name + this.getNameEnding();
        }

        return this.name;
    }

    /**
     * gets the fitting name ending for the modified variable
     * @return {string}
     */
    getNameEnding() {
        let nameEnding = '';
        if (this.bin) {
            nameEnding = '_BINNED';
        } else if (this.isXLog) {
            nameEnding = '_LOG';
        }
        return nameEnding;
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
        return (
            <FormGroup>
                <Radio
                    onChange={this.changeTransformation}
                    checked={!this.isXLog}
                    disabled={disabled}
                    value="linear"
                    name="XradioGroup"
                    inline
                >
                    None
                </Radio>
                {' '}
                <Radio
                    onChange={this.changeTransformation}
                    value="log"
                    checked={this.isXLog}
                    disabled={disabled}
                    name="XradioGroup"
                    inline
                >
                    Log
                </Radio>
                {' '}
            </FormGroup>
        );
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
            .domain([0, d3.max(bins, d => d.length)]).range([this.height, 0]);
        if (this.bin) {
            return (
                <Provider binningStore={this.binningStore}>
                    <Binner
                        data={this.allValues}
                        yScale={yScale}
                        xLabel={this.name}
                        width={this.width}
                        height={this.height}
                        histBins={bins}
                    />
                </Provider>
            );
        }

        const margin = {
            top: 20, right: 20, bottom: 90, left: 50,
        };


        const w = this.width + (margin.left + margin.right);


        const h = this.height + (margin.top + margin.bottom);
        const transform = `translate(${margin.left},${margin.top})`;
        return (
            <svg width={w} height={h}>
                <g transform={transform}>
                    <Histogram
                        bins={bins}
                        xScale={this.binningStore.xScale}
                        yScale={yScale}
                        h={this.height}
                        w={this.width}
                        xLabel={this.name}
                        numValues={this.allValues.length}
                    />
                </g>
            </svg>
        );
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
            intermediateStop = <stop offset="50%" style={{ stopColor: range[1] }}/>;
        }
        const randomId = uuidv4();
        return (
            <svg
                width={width}
                height={height}
            >
                <g>
                    <defs>
                        <linearGradient id={randomId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: range[0] }}/>
                            {intermediateStop}
                            <stop offset="100%" style={{ stopColor: range[range.length - 1] }}/>
                        </linearGradient>
                    </defs>
                    <rect width={width} height={height} fill={`url(#${randomId})`}/>
                </g>
            </svg>
        );
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
        } else {
            linearColorRange = ColorScales.continuousTwoColorRanges;
        }
        return (
            <form>
                <FormGroup>
                    {linearColorRange.map((d, i) => (
                        <Radio
                            key={i}
                            onChange={() => {
                                this.colorRange = d;
                            }}
                            name="ColorScaleGroup"
                        >
                            {ModifyContinuous.getGradient(d, width, height)}
                        </Radio>
                    ))}
                </FormGroup>
            </form>
        );
    }

    /**
     * returns a checkbox if variable that will be modified is part of a molecular profile.
     * Checking the checkbox results in the modification being applied to all variables of
     * that profile
     * @return {Checkbox|null}
     */
    getApplyToAll() {
        let checkbox = null;
        const profileIndex = this.props.rootStore.availableProfiles
            .map(d => d.molecularProfileId).indexOf(this.props.variable.profile);
        if (profileIndex !== -1 || this.props.variable.profile === 'Variant allele frequency') {
            checkbox = (
                <Checkbox
                    checked={this.applyToAll}
                    value={this.applyToAll}
                    onChange={() => {
                        this.applyToAll = !this.applyToAll;
                    }}
                >
                    {'Apply action to all variables of this type'}
                </Checkbox>
            );
        }
        return checkbox;
    }

    /**
     * applies binning to data and color scales
     * creates a new derived variable if the variable has been modified
     */
    handleApply() {
        let profileDomain = [];
        if (this.applyToAll) {
            profileDomain = this.props.variableManagerStore
                .getProfileDomain(this.props.variable.profile);
        }
        const returnVariable = this.getReturnVariable(profileDomain);
        // if variable has been modified replace the variable with the new variable
        if (this.props.derivedVariable === null) {
            if (this.props.variableManagerStore
                .variableChanged(this.props.variable.id, returnVariable)) {
                this.props.variableManagerStore
                    .replaceDisplayedVariable(this.props.variable.id, returnVariable);
            } else {
                this.props.variableManagerStore
                    .changeVariableRange(this.props.variable.id, returnVariable.range, false);
                this.props.variableManagerStore
                    .changeVariableName(this.props.variable.id, this.name);
            }
        } else if (!this.props.variableManagerStore
            .variableChanged(this.props.variable.id, returnVariable)) {
            this.props.variableManagerStore
                .changeVariableRange(this.props.variable.id, returnVariable.range, false);
            this.props.variableManagerStore
                .replaceDisplayedVariable(this.props.derivedVariable.id, this.props.variable);
        } else if (this.props.variableManagerStore
            .variableChanged(this.props.derivedVariable.id, returnVariable)) {
            this.props.variableManagerStore
                .replaceDisplayedVariable(this.props.derivedVariable.id, returnVariable);
            if (this.applyToAll) {
                if (this.isXLog && profileDomain[0] < 0) {
                    alert('Modification could not be applied to other variables, since variables with negative values cannot be log transformed');
                } else {
                    this.props.variableManagerStore.applyToEntireProfile(
                        returnVariable, this.props.derivedVariable.profile, this.getNameEnding(),
                    );
                }
            }
        } else {
            this.props.variableManagerStore.changeVariableRange(
                this.props.derivedVariable.id, returnVariable.range, this.applyToAll,
            );
            this.props.variableManagerStore.changeVariableName(
                this.props.derivedVariable.id, this.name,
            );
        }
        this.props.closeModal();
    }

    /**
     * closes modal
     */
    close() {
        this.props.closeModal();
    }


    /**
     * changes the transformation of the data, adapts all values
     * @param {Object} event
     */
    changeTransformation(event) {
        let isLog;
        if (event.target.value === 'linear') {
            isLog = false;
            this.allValues = Object.values(this.props.variable.mapper)
                .filter(d => d !== undefined);
        } else {
            isLog = true;
            this.allValues = Object.values(this.props.variable.mapper)
                .filter(d => d !== undefined).map(d => Math.log10(d));
        }
        const min = d3.min(this.allValues);
        const max = d3.max(this.allValues);
        let med = (max + min) / 2;
        if (min < 0 && max > 0) {
            med = 0;
        }
        this.binningStore.setBins([min, med, max], d3.scaleLinear()
            .domain([min, max]).range([0, this.width]));
        this.binningStore.resetBinNames();
        this.isXLog = isLog;
    }

    /**
     * creates a store that handles binning the variable
     * @return {BinningStore}
     */
    createBinningStore() {
        let bins;
        let binNames;
        let
            isBinary;
        if (this.props.derivedVariable === null
            || !this.props.derivedVariable.modification.binning) {
            const min = d3.min(this.allValues);
            const max = d3.max(this.allValues);
            let med = (max + min) / 2;
            if (min < 0) {
                med = 0;
            }
            bins = [min, med, max];
            binNames = [{
                name: `${getScientificNotation(min)} to ${getScientificNotation(med)}`,
                modified: false,
            }, {
                name: `${getScientificNotation(med)} to ${getScientificNotation(max)}`,
                modified: false,
            }];
            isBinary = false;
        } else {
            bins = this.props.derivedVariable.modification.binning.bins.slice();
            binNames = this.props.derivedVariable.modification.binning.binNames
                .map(d => ({ name: d.name, modified: d.modified }));
            isBinary = this.props.derivedVariable.datatype === 'BINARY';
        }
        const min = Math.min(...this.allValues);
        const max = Math.max(...this.allValues);
        const xScale = d3.scaleLinear().domain([min, max]).range([0, this.width]);
        return new BinningStore(bins, binNames, isBinary, xScale);
    }

    /**
     * sets the initial state depending on the existence of an already derived variable
     * @returns {{bins: Object, binNames: Object,
     * bin: boolean, colorRange: string[], isXLog:
     * boolean, name: string}}
     */
    initializeObservable() {
        let bin = true;
        let colorRange = this.props.variable.range;
        if (this.props.derivedVariable === null) {
            bin = false;
        } else if (!this.props.derivedVariable.modification.binning) {
            bin = false;
            colorRange = this.props.derivedVariable.range;
        }
        return {
            bin, // bin/don't bin variable
            colorRange, // currently selected color range
            isXLog: this.props.derivedVariable !== null
            && this.props.derivedVariable
                .modification.transformFunction !== false, // is data log transformed
            name: this.props.derivedVariable !== null
                ? this.props.derivedVariable.name : this.props.variable.name, // name of variable
            applyToAll: false, // apply modification to all variables in the profile
        };
    }

    render() {
        const colorScalePopOver = (
            <Popover id="popover-positioned-right" title="Choose color scale">
                {this.getColorScalePopover()}
            </Popover>
        );
        return (
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.close}
            >
                <Modal.Header>
                    <Modal.Title>Modify continuous variable</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        <ControlLabel>Variable name</ControlLabel>
                        <FormControl
                            type="text"
                            value={this.name}
                            onChange={(e) => {
                                this.name = e.target.value;
                            }}
                        />
                        <ControlLabel>Description</ControlLabel>
                        <p>{this.props.variable.description}</p>
                        <ControlLabel>
                            Color Scale
                            <OverlayTrigger
                                rootClose
                                trigger="click"
                                placement="right"
                                overlay={colorScalePopOver}
                            >
                                <FontAwesome
                                    name="paint-brush"
                                />
                            </OverlayTrigger>
                        </ControlLabel>
                        <p>{ModifyContinuous.getGradient(this.colorRange, 100, 20)}</p>
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
                    <Button
                        onClick={() => {
                            this.bin = !this.bin;
                        }}
                        bsStyle="primary"
                    >
                        {this.bin ? '<< Cancel Binning' : 'Bin >>'}
                    </Button>
                    <Button onClick={() => this.handleApply()}>
                        Apply
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}));
ModifyContinuous.propTypes = {
    variable: PropTypes.instanceOf(OriginalVariable).isRequired,
    derivedVariable: PropTypes.instanceOf(DerivedVariable),
    modalIsOpen: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
};
ModifyContinuous.defaultProps = {
    derivedVariable: null,
};
export default ModifyContinuous;
