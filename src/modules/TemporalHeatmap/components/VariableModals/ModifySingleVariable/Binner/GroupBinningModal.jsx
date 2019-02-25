import React from 'react';
import {observer} from 'mobx-react';
import Binner from './Binner';
import * as d3 from 'd3';
import uuidv4 from 'uuid/v4';
import DerivedVariable from "../../../../DerivedVariable";
import DerivedMapperFunctions from "../../../../DeriveMapperFunctions";
import {Alert, Button, Modal} from "react-bootstrap";
import ColorScales from "../../../../ColorScales";
import UtilityFunctions from "../../../../UtilityFunctions";


const GroupBinningModal = observer(class GroupBinningModal extends React.Component {
        constructor(props) {
            super(props);
            this.data = Object.values(props.variable.mapper).filter(d => d !== undefined);
            this.state = this.setInitialState();
            this.handleBinChange = this.handleBinChange.bind(this);
            this.handleBinNameChange = this.handleBinNameChange.bind(this);
            this.handleApply = this.handleApply.bind(this);
            this.toggleIsBinary = this.toggleIsBinary.bind(this);
            this.close = this.close.bind(this);
        }

        setInitialState() {
            let bins, binNames;
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
            return {
                bins: bins,
                binNames: binNames,
                isBinary: false
            }
        }

        toggleIsBinary() {
            let binNames = this.state.binNames.slice();
            if (this.state.isBinary) {
                for (let i = 1; i < this.state.bins.length; i++) {
                    binNames[i - 1].name = UtilityFunctions.getScientificNotation(this.state.bins[i - 1]) + " to " + UtilityFunctions.getScientificNotation(this.state.bins[i]);
                    binNames[i - 1].modified = false;
                }
            }
            else {
                binNames[0] = {name: true, modified: true};
                binNames[1] = {name: false, modified: true};

            }
            this.setState({isBinary: !this.state.isBinary, binNames: binNames});
        }

        handleBinChange(bins) {
            let isBinary = this.state.isBinary;
            let binNames = this.state.binNames.slice();
            if (bins.length !== 3) {
                isBinary = false;
            }
            if (!isBinary) {
                if (bins.length === this.state.bins.length) {
                    for (let i = 1; i < bins.length; i++) {
                        if (!binNames[i - 1].modified) {
                            binNames[i - 1].name = UtilityFunctions.getScientificNotation(bins[i - 1]) + " to " + UtilityFunctions.getScientificNotation(bins[i]);
                        }
                    }
                }
                else {
                    binNames = [];
                    for (let i = 1; i < bins.length; i++) {
                        binNames.push({
                            name: UtilityFunctions.getScientificNotation(bins[i - 1]) + " to " + UtilityFunctions.getScientificNotation(bins[i]),
                            modified: false
                        });
                    }
                }
            }
            this.setState({bins: bins, binNames: binNames, isBinary: isBinary})
        }

        handleBinNameChange(e, index) {
            let binNames = this.state.binNames.slice();
            if (!this.state.isBinary) {
                binNames[index] = {name: e.target.value, modified: true};
            }
            else {
                binNames.forEach((d, i) => {
                    if (i === index) {
                        d.name = e.target.value === "true";
                        d.modified = true;
                    }
                    else {
                        d.name = e.target.value !== "true";
                        d.modified = true;
                    }
                })
            }
            this.setState({binNames: binNames});
        }


        close() {
            this.props.closeModal();
        }


        /**
         * applies binning to data and color scales
         */
        handleApply() {
            const newId = uuidv4();
            let derivedVariable;
            let modification = {
                type: "continuousTransform",
                logTransform: false,
                binning: {
                    bins: this.state.bins,
                    binNames: this.state.binNames
                }
            };
            if (!this.state.isBinary) {
                derivedVariable = new DerivedVariable(newId, this.props.variable.name + "_BINNED", "ORDINAL", this.props.variable.description + " (binned)",
                    [this.props.variable.id], modification, ColorScales.getBinnedRange(this.props.variable.colorScale, this.state.binNames, this.state.bins),
                    this.state.binNames.map(d => d.name), DerivedMapperFunctions.getModificationMapper(modification, [this.props.variable.mapper]),
                    this.props.variable.profile);
            }
            else {
                derivedVariable = new DerivedVariable(newId, this.props.variable.name + "_BINNED", "BINARY", this.props.variable.description + " (binned)",
                    [this.props.variable.id], modification, [], [], DerivedMapperFunctions.getModificationMapper(modification, [this.props.variable.mapper]),
                    this.props.variable.profile);

            }
            this.props.callback(derivedVariable);
            this.props.closeModal();
        }


        render() {
            const width = 350;
            const height = 200;
            const min = Math.min(...this.data);
            const max = Math.max(...this.data);
            let xScale = d3.scaleLinear().domain([min, max]).range([0, width]);
            const bins = d3.histogram()
                .domain([min, max])
                .thresholds(xScale.ticks(30))(this.data);
            const y = d3.scaleLinear()
                .domain([0, d3.max(bins, function (d) {
                    return d.length;
                })]).range([height, 0]);
            return (
                <Modal show={this.props.modalIsOpen}
                       onHide={this.close}>
                    <Modal.Header>
                        <Modal.Title>{"Bin " + this.props.variable.name}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Alert bsStyle="info">
                            <strong>Please bin the continuous variable before grouping</strong>
                        </Alert>
                        <Binner data={this.data}
                                variable={this.props.variable}
                                bins={this.state.bins}
                                binNames={this.state.binNames}
                                xScale={xScale}
                                yScale={y}
                                xLabel={this.props.variable.name}
                                width={width}
                                height={height}
                                histBins={bins}
                                isBinary={this.state.isBinary}
                                handleBinChange={this.handleBinChange}
                                handleBinNameChange={this.handleBinNameChange}
                                toggleIsBinary={this.toggleIsBinary}/>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.close}>
                            Cancel
                        </Button>
                        <Button onClick={this.handleApply}>
                            Apply
                        </Button>
                    </Modal.Footer>
                </Modal>
            )
        }
    }
    )
;
export default GroupBinningModal;