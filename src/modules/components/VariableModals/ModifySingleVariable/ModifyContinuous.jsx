import React from 'react';
import { inject, observer, Provider } from 'mobx-react';
import * as d3 from 'd3';
import { Alert, Button, Form, Modal, OverlayTrigger, Popover } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import { v4 as uuidv4 } from 'uuid';
import { makeObservable, observable } from 'mobx';
import { PropTypes } from 'prop-types';
import { message } from 'antd';
import Binner from './Binner/Binner';
import Histogram from './Binner/Histogram';
import DerivedVariable from 'modules/stores/DerivedVariable';
import DerivedMapperFunctions from 'modules/UtilityClasses/DeriveMapperFunctions';
import ColorScales from 'modules/UtilityClasses/ColorScales';
import { getScientificNotation } from 'modules/UtilityClasses/UtilityFunctions';
import BinningStore from './Binner/BinningStore';
import OriginalVariable from 'modules/stores/OriginalVariable';

/**
 * Modification of a continuous variable
 */
const ModifyContinuous = inject(
	'variableManagerStore',
	'rootStore'
)(
	observer(
		class ModifyContinuous extends React.Component {
			constructor(props) {
				super(props);
				this.width = 700; // Increased width to better utilize lg modal size
				this.height = 200;
				this.allValues = this.getAllInitialValues();

				const initValues = this.initializeObservable();
				this.name = initValues.name;
				this.bin = initValues.bin;
				this.log = initValues.log;
				this.colorRange = initValues.colorRange;
				this.applyToAll = initValues.applyToAll;

				makeObservable(this, {
					name: observable,
					bin: observable,
					log: observable,
					colorRange: observable,
					applyToAll: observable,
				});
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
				if (this.props.derivedVariable === null || !this.props.derivedVariable.modification.transformFunction) {
					return Object.values(this.props.variable.mapper).filter(
						(d) => d !== undefined && typeof d === 'number' && !Number.isNaN(d)
					);
				}
				return Object.values(this.props.variable.mapper)
					.filter((d) => d !== undefined && typeof d === 'number' && !Number.isNaN(d))
					.map((d) => this.props.derivedVariable.modification.transformFunction(d));
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
						domain = modification.binning.binNames.map((d) => d.name);
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
				const mapper = DerivedMapperFunctions.getModificationMapper(modification, [this.props.variable.mapper]);
				const derivedProfile = uuidv4();
				return new DerivedVariable(
					newId,
					this.getName(),
					datatype,
					`${this.props.variable.description}_modified`,
					[this.props.variable.id],
					modification,
					range,
					domain,
					mapper,
					derivedProfile,
					this.props.variable.type
				);
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
						binNames[binNames.length - 1].name =
							`${getScientificNotation(bins[bins.length - 2])} to ${getScientificNotation(bins[bins.length - 1])}`;
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
					<Form.Group>
						<Form.Check
							type="radio"
							onChange={this.changeTransformation}
							checked={!this.isXLog}
							disabled={disabled}
							value="linear"
							name="XradioGroup"
							inline
							label="None"
						/>{' '}
						<Form.Check
							type="radio"
							onChange={this.changeTransformation}
							value="log"
							checked={this.isXLog}
							disabled={disabled}
							name="XradioGroup"
							inline
							label="Log"
						/>{' '}
					</Form.Group>
				);
			}

			/**
			 * gets a histogram or a Binner if in binning mode
			 * @returns {(Provider|svg)}
			 */
			getBinning() {
				// Filter to ensure we only have numeric values
				const numericValues = this.allValues.filter((d) => typeof d === 'number' && !Number.isNaN(d));

				// Safety check: if no numeric values, return null
				if (numericValues.length === 0) {
					return null;
				}

				const min = Math.min(...numericValues);
				const max = Math.max(...numericValues);

				// Safety check: ensure xScale exists and has ticks method
				const thresholds =
					this.binningStore.xScale && typeof this.binningStore.xScale.ticks === 'function'
						? this.binningStore.xScale.ticks(30)
						: [min, (min + max) / 2, max];

				const bins = d3.histogram().domain([min, max]).thresholds(thresholds)(numericValues);
				const yScale = d3
					.scaleLinear()
					.domain([0, d3.max(bins, (d) => d.length)])
					.range([this.height, 0]);
				if (this.bin) {
					return (
						<>
							<Alert variant="info" style={{ marginTop: '15px' }}>
								<div style={{ fontSize: '0.9em' }}>
									<strong>Binning mode:</strong> Undefined or missing values will automatically be
									placed in their own separate bin.
								</div>
							</Alert>
							<Provider binningStore={this.binningStore}>
								<Binner
									data={numericValues}
									yScale={yScale}
									xLabel={this.name}
									width={this.width}
									height={this.height}
									histBins={bins}
								/>
							</Provider>
						</>
					);
				}

				const margin = {
					top: 20,
					right: 20,
					bottom: 90,
					left: 50,
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
					intermediateStop = <stop offset="50%" style={{ stopColor: range[1] }} />;
				}
				const randomId = uuidv4();
				return (
					<svg width={width} height={height}>
						<g>
							<defs>
								<linearGradient id={randomId} x1="0%" y1="0%" x2="100%" y2="0%">
									<stop offset="0%" style={{ stopColor: range[0] }} />
									{intermediateStop}
									<stop offset="100%" style={{ stopColor: range[range.length - 1] }} />
								</linearGradient>
							</defs>
							<rect width={width} height={height} fill={`url(#${randomId})`} />
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
						<Form.Group>
							{linearColorRange.map((d, i) => (
								<Form.Check
									key={i}
									type="radio"
									onChange={() => {
										this.colorRange = d;
									}}
									name="ColorScaleGroup"
									label={ModifyContinuous.getGradient(d, width, height)}
								/>
							))}
						</Form.Group>
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
					.map((d) => d.molecularProfileId)
					.indexOf(this.props.variable.profile);
				if (profileIndex !== -1 || this.props.variable.profile === 'Variant allele frequency') {
					checkbox = (
						<Form.Check
							type="checkbox"
							checked={this.applyToAll}
							value={this.applyToAll}
							onChange={() => {
								this.applyToAll = !this.applyToAll;
							}}
							label="Apply action to all variables of this type"
						/>
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
					profileDomain = this.props.variableManagerStore.getProfileDomain(this.props.variable.profile);
				}
				const returnVariable = this.getReturnVariable(profileDomain);
				// if variable has been modified replace the variable with the new variable
				if (this.props.derivedVariable === null) {
					if (this.props.variableManagerStore.variableChanged(this.props.variable.id, returnVariable)) {
						this.props.variableManagerStore.replaceDisplayedVariable(
							this.props.variable.id,
							returnVariable
						);
					} else {
						this.props.variableManagerStore.changeVariableRange(
							this.props.variable.id,
							returnVariable.range,
							false
						);
						this.props.variableManagerStore.changeVariableName(this.props.variable.id, this.name);
					}
				} else if (!this.props.variableManagerStore.variableChanged(this.props.variable.id, returnVariable)) {
					this.props.variableManagerStore.changeVariableRange(
						this.props.variable.id,
						returnVariable.range,
						false
					);
					this.props.variableManagerStore.replaceDisplayedVariable(
						this.props.derivedVariable.id,
						this.props.variable
					);
				} else if (
					this.props.variableManagerStore.variableChanged(this.props.derivedVariable.id, returnVariable)
				) {
					this.props.variableManagerStore.replaceDisplayedVariable(
						this.props.derivedVariable.id,
						returnVariable
					);
					if (this.applyToAll) {
						if (this.isXLog && profileDomain[0] < 0) {
							message.warning({
								content: 'Log transformation cannot be applied to variables with negative values',
								duration: 8,
							});
						} else {
							this.props.variableManagerStore.applyToEntireProfile(
								returnVariable,
								this.props.derivedVariable.profile,
								this.getNameEnding()
							);
						}
					}
				} else {
					this.props.variableManagerStore.changeVariableRange(
						this.props.derivedVariable.id,
						returnVariable.range,
						this.applyToAll
					);
					this.props.variableManagerStore.changeVariableName(this.props.derivedVariable.id, this.name);
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
					this.allValues = Object.values(this.props.variable.mapper).filter(
						(d) => d !== undefined && typeof d === 'number' && !Number.isNaN(d)
					);
				} else {
					isLog = true;
					this.allValues = Object.values(this.props.variable.mapper)
						.filter((d) => d !== undefined && typeof d === 'number' && !Number.isNaN(d) && d > 0)
						.map((d) => Math.log10(d));
				}

				// Handle empty data case
				if (this.allValues.length === 0) {
					console.error('No valid numeric data for transformation');
					return;
				}

				const min = d3.min(this.allValues);
				const max = d3.max(this.allValues);

				// Handle case where min === max
				if (min === max) {
					const domain = [min - 1, max + 1];
					this.binningStore.setBins(
						[domain[0], min, domain[1]],
						d3.scaleLinear().domain(domain).range([0, this.width])
					);
				} else {
					let med = (max + min) / 2;
					if (min < 0 && max > 0) {
						med = 0;
					}
					this.binningStore.setBins(
						[min, med, max],
						d3.scaleLinear().domain([min, max]).range([0, this.width])
					);
				}

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
				let isBinary;

				// Filter to ensure we only have numeric values
				const numericValues = this.allValues.filter((d) => typeof d === 'number' && !Number.isNaN(d));

				if (this.props.derivedVariable === null || !this.props.derivedVariable.modification.binning) {
					// Handle case where there's no valid numeric data
					if (numericValues.length === 0) {
						console.error('No valid numeric data found for binning');
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

					const min = d3.min(numericValues);
					const max = d3.max(numericValues);

					// Handle case where min === max
					if (min === max) {
						const xScale = d3
							.scaleLinear()
							.domain([min - 1, max + 1])
							.range([0, this.width]);
						return new BinningStore(
							[min - 1, min, max + 1],
							[
								{
									name: `${getScientificNotation(min - 1)} to ${getScientificNotation(min)}`,
									modified: false,
								},
								{
									name: `${getScientificNotation(min)} to ${getScientificNotation(max + 1)}`,
									modified: false,
								},
							],
							false,
							xScale
						);
					}

					let med = (max + min) / 2;
					if (min < 0 && max > 0) {
						med = 0;
					}
					bins = [min, med, max];
					binNames = [
						{
							name: `${getScientificNotation(min)} to ${getScientificNotation(med)}`,
							modified: false,
						},
						{
							name: `${getScientificNotation(med)} to ${getScientificNotation(max)}`,
							modified: false,
						},
					];
					isBinary = false;
				} else {
					bins = this.props.derivedVariable.modification.binning.bins.slice();
					binNames = this.props.derivedVariable.modification.binning.binNames.map((d) => ({
						name: d.name,
						modified: d.modified,
					}));
					isBinary = this.props.derivedVariable.datatype === 'BINARY';
				}

				// Use numeric values for scale domain
				const min = Math.min(...numericValues);
				const max = Math.max(...numericValues);

				// Ensure valid domain
				const domain = min === max ? [min - 1, max + 1] : [min, max];
				const xScale = d3.scaleLinear().domain(domain).range([0, this.width]);
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
					isXLog:
						this.props.derivedVariable !== null &&
						this.props.derivedVariable.modification.transformFunction !== false, // is data log transformed
					name:
						this.props.derivedVariable !== null
							? this.props.derivedVariable.name
							: this.props.variable.name, // name of variable
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
					<Modal show={this.props.modalIsOpen} onHide={this.close} size="lg">
						<Modal.Header closeButton>
							<Modal.Title>Modify continuous variable</Modal.Title>
						</Modal.Header>
						<Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
							<form>
								<Form.Label>Variable name</Form.Label>
								<Form.Control
									type="text"
									value={this.name}
									onChange={(e) => {
										this.name = e.target.value;
									}}
								/>
								<Form.Label>Description</Form.Label>
								<p>{this.props.variable.description}</p>
								<Form.Label>
									Color Scale
									<OverlayTrigger
										rootClose
										trigger="click"
										placement="right"
										overlay={colorScalePopOver}
									>
										<FontAwesome name="paint-brush" />
									</OverlayTrigger>
								</Form.Label>
								<p>{ModifyContinuous.getGradient(this.colorRange, 100, 20)}</p>
								<Form.Label>Transform data</Form.Label>
								{this.getRadio()}
							</form>
							{this.getBinning()}
						</Modal.Body>
						<Modal.Footer>
							{this.getApplyToAll()}
							<Button variant="secondary" onClick={this.close}>
								Cancel
							</Button>
							<Button
								onClick={() => {
									this.bin = !this.bin;
								}}
								variant="info"
							>
								{this.bin ? '<< Cancel Binning' : 'Bin >>'}
							</Button>
							<Button variant="primary" onClick={() => this.handleApply()}>
								Apply
							</Button>
						</Modal.Footer>
					</Modal>
				);
			}
		}
	)
);
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
