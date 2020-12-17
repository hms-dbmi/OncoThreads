import React from 'react';
import PropTypes from 'prop-types';
import { observer, Provider } from 'mobx-react';
import * as d3 from 'd3';
import uuidv4 from 'uuid/v4';
import { Alert, Button, Modal } from 'react-bootstrap';
import DerivedVariable from 'modules/TemporalHeatmap/stores/DerivedVariable';
import DerivedMapperFunctions from 'modules/TemporalHeatmap/UtilityClasses/DeriveMapperFunctions';
import {getScientificNotation} from 'modules/TemporalHeatmap/UtilityClasses/UtilityFunctions';
import BinningStore from './BinningStore';
import Binner from './Binner';
import OriginalVariable from '../../../../stores/OriginalVariable';

/**
 * Modal for binning while grouping
 */
const GroupBinningModal = observer(class GroupBinningModal extends React.Component {
    constructor(props) {
        super(props);
        this.width = 450;
        this.height = 200;
        this.data = Object.values(props.variable.mapper).filter(d => d !== undefined);
        this.binningStore = this.createBinningStore();
        this.handleApply = this.handleApply.bind(this);
        this.close = this.close.bind(this);
    }

    /**
     * creates store for binning
     * @return {BinningStore}
     */
    createBinningStore() {
        const min = d3.min(this.data);
        const max = d3.max(this.data);
        let med = (max + min) / 2;
        if (min < 0) {
            med = 0;
        }
        const bins = [min, med, max];
        const binNames = [{
            name: `${getScientificNotation(min)} to ${getScientificNotation(med)}`,
            modified: false,
        }, {
            name: `${getScientificNotation(med)} to ${getScientificNotation(max)}`,
            modified: false,
        }];
        const xScale = d3.scaleLinear().domain([min, max]).range([0, this.width]);
        return new BinningStore(bins, binNames, false, xScale);
    }

    /**
     * closes Modal
     */
    close() {
        this.props.closeModal();
    }


    /**
     * creates new variable based on binning
     */
    handleApply() {
        const newId = uuidv4();
        let derivedVariable;
        const modification = {
            type: 'continuousTransform',
            transformFunction: false,
            binning: {
                bins: this.binningStore.bins,
                binNames: this.binningStore.binNames,
            },
        };
        // case: variable is transformed to binary
        if (!this.binningStore.isBinary) {
            derivedVariable = new DerivedVariable(newId, `${this.props.variable.name}_BINNED`, 'ORDINAL', `${this.props.variable.description} (binned)`,
                [this.props.variable.id], modification, this.props.variable.range,
                this.binningStore.binNames.map(d => d.name), DerivedMapperFunctions
                    .getModificationMapper(modification, [this.props.variable.mapper]),
                uuidv4(), this.props.variable.type);
            // case: variable is not transformed to binary
        } else {
            derivedVariable = new DerivedVariable(newId, `${this.props.variable.name}_BINNED`, 'BINARY', `${this.props.variable.description} (binned)`,
                [this.props.variable.id], modification, [], [], DerivedMapperFunctions
                    .getModificationMapper(modification, [this.props.variable.mapper]),
                uuidv4(), this.props.variable.type);
        }
        this.props.callback(derivedVariable);
        this.props.closeModal();
    }


    render() {
        const bins = d3.histogram()
            .domain([Math.min(...this.data), Math.max(...this.data)])
            .thresholds(this.binningStore.xScale.ticks(30))(this.data);
        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)]).range([this.height, 0]);
        return (
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.close}
            >
                <Modal.Header>
                    <Modal.Title>{`Bin ${this.props.variable.name}`}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert bsStyle="info">
                        <strong>Please bin the continuous variable before grouping</strong>
                    </Alert>
                    <Provider binningStore={this.binningStore}>
                        <Binner
                            data={this.data}
                            yScale={y}
                            xLabel={this.props.variable.name}
                            width={this.width}
                            height={this.height}
                            histBins={bins}
                        />
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
        );
    }
});
GroupBinningModal.propTypes = {
    variable: PropTypes.instanceOf(OriginalVariable).isRequired,
    callback: PropTypes.func.isRequired,
    modalIsOpen: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
};
export default GroupBinningModal;
