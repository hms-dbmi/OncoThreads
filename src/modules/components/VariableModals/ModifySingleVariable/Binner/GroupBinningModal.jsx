import React from 'react';
import PropTypes from 'prop-types';
import { observer, Provider } from 'mobx-react';
import * as d3 from 'd3';
import { v4 as uuidv4 } from 'uuid';
import { Alert, Button, Modal } from 'react-bootstrap';
import DerivedVariable from 'modules/stores/DerivedVariable';
import DerivedMapperFunctions from 'modules/UtilityClasses/DeriveMapperFunctions';
import { getScientificNotation, isValidNumber } from 'modules/UtilityClasses/UtilityFunctions';
import BinningStore from './BinningStore';
import Binner from './Binner';
import OriginalVariable from '../../../../stores/OriginalVariable';

/**
 * Modal for binning while grouping
 */
const GroupBinningModal = observer(
	class GroupBinningModal extends React.Component {
		constructor(props) {
			super(props);
			this.width = 700; // Increased width to better utilize lg modal size
			this.height = 200;
			this.data = Object.values(props.variable.mapper).filter((d) => d !== undefined);
			this.binningStore = this.createBinningStore();
			this.handleApply = this.handleApply.bind(this);
			this.close = this.close.bind(this);
		}

		/**
		 * creates store for binning
		 * @return {BinningStore}
		 */
		createBinningStore() {
			// Filter to ensure we only have numeric values
			const numericData = this.data.filter((d) => isValidNumber(d));

			// Handle case where there's no valid numeric data
			if (numericData.length === 0) {
				console.error('No valid numeric data found for binning');
				// Create a default scale with safe values
				const xScale = d3.scaleLinear().domain([0, 1]).range([0, this.width]);
				return new BinningStore(
					[0, 0.5, 1],
					[
						{ name: '0 to 0.5', modified: false },
						{ name: '0.5 to 1', modified: false },
					],
					false,
					xScale
				);
			}

			const min = d3.min(numericData);
			const max = d3.max(numericData);

			// Handle case where min === max (all values are the same)
			if (min === max) {
				const xScale = d3
					.scaleLinear()
					.domain([min - 1, max + 1])
					.range([0, this.width]);
				return new BinningStore(
					[min - 1, min, max + 1],
					[
						{ name: `${getScientificNotation(min - 1)} to ${getScientificNotation(min)}`, modified: false },
						{ name: `${getScientificNotation(min)} to ${getScientificNotation(max + 1)}`, modified: false },
					],
					false,
					xScale
				);
			}

			let med = (max + min) / 2;
			if (min < 0 && max > 0) {
				med = 0;
			}
			const bins = [min, med, max];
			const binNames = [
				{
					name: `${getScientificNotation(min)} to ${getScientificNotation(med)}`,
					modified: false,
				},
				{
					name: `${getScientificNotation(med)} to ${getScientificNotation(max)}`,
					modified: false,
				},
			];
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
				derivedVariable = new DerivedVariable(
					newId,
					`${this.props.variable.name}_BINNED`,
					'ORDINAL',
					`${this.props.variable.description} (binned)`,
					[this.props.variable.id],
					modification,
					this.props.variable.range,
					this.binningStore.binNames.map((d) => d.name),
					DerivedMapperFunctions.getModificationMapper(modification, [this.props.variable.mapper]),
					uuidv4(),
					this.props.variable.type
				);
				// case: variable is not transformed to binary
			} else {
				derivedVariable = new DerivedVariable(
					newId,
					`${this.props.variable.name}_BINNED`,
					'BINARY',
					`${this.props.variable.description} (binned)`,
					[this.props.variable.id],
					modification,
					[],
					[],
					DerivedMapperFunctions.getModificationMapper(modification, [this.props.variable.mapper]),
					uuidv4(),
					this.props.variable.type
				);
			}
			this.props.callback(derivedVariable);
			this.props.closeModal();
		}

		render() {
			// Filter to ensure we only have numeric values for histogram
			const numericData = this.data.filter((d) => isValidNumber(d));

			// Safety check: ensure xScale exists and has ticks method
			const thresholds =
				this.binningStore.xScale && typeof this.binningStore.xScale.ticks === 'function'
					? this.binningStore.xScale.ticks(30)
					: [0, 0.5, 1];

			// Handle empty data or get proper domain
			let domain;
			if (numericData.length === 0) {
				domain = [0, 1];
			} else {
				const min = Math.min(...numericData);
				const max = Math.max(...numericData);
				domain = min === max ? [min - 1, max + 1] : [min, max];
			}

			const bins = d3.histogram().domain(domain).thresholds(thresholds)(numericData);
			const y = d3
				.scaleLinear()
				.domain([
					0,
					Math.max(
						1,
						d3.max(bins, (d) => d.length)
					),
				])
				.range([this.height, 0]);
			return (
				<Modal show={this.props.modalIsOpen} onHide={this.close} size="lg">
					<Modal.Header closeButton>
						<Modal.Title>{`Bin ${this.props.variable.name}`}</Modal.Title>
					</Modal.Header>
					<Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>
						<Alert variant="info">
							<strong>Please bin the continuous variable before grouping</strong>
							<div style={{ marginTop: '8px', fontSize: '0.9em' }}>
								Note: Undefined or missing values will automatically be placed in their own separate
								bin.
							</div>
						</Alert>
						<Provider binningStore={this.binningStore}>
							<Binner
								data={numericData}
								yScale={y}
								xLabel={this.props.variable.name}
								width={this.width}
								height={this.height}
								histBins={bins}
							/>
						</Provider>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={this.close}>
							Cancel
						</Button>
						<Button variant="primary" onClick={this.handleApply}>
							Apply
						</Button>
					</Modal.Footer>
				</Modal>
			);
		}
	}
);
GroupBinningModal.propTypes = {
	variable: PropTypes.instanceOf(OriginalVariable).isRequired,
	callback: PropTypes.func.isRequired,
	modalIsOpen: PropTypes.bool.isRequired,
	closeModal: PropTypes.func.isRequired,
};
export default GroupBinningModal;
