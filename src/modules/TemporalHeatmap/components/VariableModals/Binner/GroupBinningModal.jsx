import React from 'react';
import {observer} from 'mobx-react';
import Binner from './Binner';
import * as d3 from 'd3';
import uuidv4 from 'uuid/v4';
import DerivedVariable from "../../../DerivedVariable";
import MapperCombine from "../../../MapperCombineFunctions";
import {Alert, Button, Modal} from "react-bootstrap";


const GroupBinningModal = observer(class GroupBinningModal extends React.Component {
    constructor(props) {
        super(props);
        this.data = Object.values(props.variable.mapper);
        this.state = {
            bins: this.getInitialBins(),
            binNames: ["Bin 1", "Bin 2"],
        };
        this.handleBinChange = this.handleBinChange.bind(this);
        this.handleBinNameChange = this.handleBinNameChange.bind(this);
        this.handleApply = this.handleApply.bind(this);
        this.close = this.close.bind(this);
    }


    handleBinChange(bins) {
        this.setState({bins: bins});
    }

    handleBinNameChange(binNames) {
        this.setState({binNames: binNames});
    }

    getInitialBins() {
        let min = d3.min(this.data);
        let max = d3.max(this.data);
        let med = (d3.max(this.data) + d3.min(this.data)) / 2;
        if (min < 0) {
            med = 0;
        }
        return [min, med, max];
    }

    close() {
        this.props.closeModal();
    }


    /**
     * applies binning to data and color scales
     */
    handleApply() {
        const newId = uuidv4();
        let derivedVariable = new DerivedVariable(newId, this.props.variable.name + "_BINNED", "BINNED", this.props.variable.description + " (binned)", [this.props.variable.id], "binning", {
            binning: {
                bins: this.state.bins,
                binNames: this.state.binNames
            }
        }, [], this.state.binNames, MapperCombine.createBinnedMapper(this.props.variable.mapper, this.state.bins, this.state.binNames));
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
});
export default GroupBinningModal;