import React from 'react';
import {observer} from 'mobx-react';
import Binner from './Binner';
import * as d3 from 'd3';
import uuidv4 from 'uuid/v4';
import DerivedVariable from "../../../DerivedVariable";
import MapperCombine from "../../../MapperCombineFunctions";
import {Alert, Button, Modal} from "react-bootstrap";
import ColorScales from "../../../ColorScales";


const GroupBinningModal = observer(class GroupBinningModal extends React.Component {
        constructor(props) {
            super(props);
            this.data = Object.values(props.variable.mapper).filter(d=>d!==undefined);
            this.state = this.setInitialState();
            this.handleBinChange = this.handleBinChange.bind(this);
            this.handleBinNameChange = this.handleBinNameChange.bind(this);
            this.handleApply = this.handleApply.bind(this);
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
                binNames = [{name: (Math.round(min*100)/100)+ " to " + med, modified: false}, {name: (Math.round(med*100)/100) + " to " + (Math.round(max*100)/100), modified: false}];
            return {
                bins: bins,
                binNames: binNames,
            }
        }

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

        handleBinNameChange(e, index) {
            let binNames = this.state.binNames.slice();
            binNames[index] = {name: e.target.value, modified: true};
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
            let derivedVariable = new DerivedVariable(newId, this.props.variable.name + "_BINNED", "ORDINAL", this.props.variable.description + " (binned)", [this.props.variable.id], "continuousTransform", {
                binning: {
                    bins: this.state.bins,
                    binNames: this.state.binNames
                }
            }, ColorScales.getBinnedRange(this.props.variable.colorScale,this.state.binNames,this.state.bins), this.state.binNames.map(d=>d.name), MapperCombine.createBinnedMapper(this.props.variable.mapper, this.state.bins, this.state.binNames),this.props.variable.profile);
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
                                handleBinChange={this.handleBinChange}
                                handleBinNameChange={this.handleBinNameChange}/>
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