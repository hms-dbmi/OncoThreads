import React from 'react';
import {observer, Provider} from 'mobx-react';
import Binner from './Binner';
import * as d3 from 'd3';
import uuidv4 from 'uuid/v4';
import DerivedVariable from "../../../../stores/DerivedVariable";
import DerivedMapperFunctions from "../../../../UtilityClasses/DeriveMapperFunctions";
import {Alert, Button, Modal} from "react-bootstrap";
import ColorScales from "../../../../UtilityClasses/ColorScales";
import UtilityFunctions from "../../../../UtilityClasses/UtilityFunctions";
import BinningStore from "./BinningStore";


const GroupBinningModal = observer(class GroupBinningModal extends React.Component {
        constructor(props) {
            super(props);
            this.data = Object.values(props.variable.mapper).filter(d => d !== undefined);
            this.binningStore = this.createBinningStore();
            this.handleApply = this.handleApply.bind(this);
            this.close = this.close.bind(this);
        }

        createBinningStore() {
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
            return new BinningStore(bins, binNames, false);
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
                    bins: this.binningStore.bins,
                    binNames: this.binningStore.binNames
                }
            };
            if (!this.binningStore.isBinary) {
                derivedVariable = new DerivedVariable(newId, this.props.variable.name + "_BINNED", "ORDINAL", this.props.variable.description + " (binned)",
                    [this.props.variable.id], modification, ColorScales.getBinnedRange(this.props.variable.colorScale, this.binningStore.binNames, this.binningStore.bins),
                    this.binningStore.binNames.map(d => d.name), DerivedMapperFunctions.getModificationMapper(modification, [this.props.variable.mapper]),
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
                        <Provider binningStore={this.binningStore}>
                            <Binner data={this.data}
                                    xScale={xScale}
                                    yScale={y}
                                    xLabel={this.props.variable.name}
                                    width={width}
                                    height={height}
                                    histBins={bins}/>
                        </Provider>
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
    });
export default GroupBinningModal;