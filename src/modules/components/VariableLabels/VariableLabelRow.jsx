import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import SingleTimepoint from '../../stores/SingleTimepoint';

/**
 * Component for variable labels of one timepoint
 */
const VariableLabelRow = inject(
	'rootStore',
	'uiStore'
)(
	observer(
		class VariableLabelRow extends React.Component {
			constructor(props) {
				super(props);
				this.handleRowEnter = this.handleRowEnter.bind(this);
				this.handleRowLeave = this.handleRowLeave.bind(this);
				this.promote = this.promote.bind(this);
			}

			/**
			 * promotes a variable to be the primary variable
			 * @param {SingleTimepoint} timepoint
			 * @param {(DerivedVariable|OriginalVariable)} variable
			 */
			promote(timepoint, variable) {
				timepoint.setPrimaryVariable(variable.id);
				this.props.rootStore.undoRedoStore.saveTimepointHistory();
			}

			/**
			 * handles highlighting a variable row when mouse enters
			 * @param {string} variableId
			 */
			handleRowEnter(variableId) {
				this.props.highlightVariable(variableId);
			}

			/**
			 * handles un-highlighting a variable row when mouse leaves
			 */
			handleRowLeave() {
				this.props.unhighlightVariable();
			}

			/**
			 * gets the label for a row in a timepoint
			 * @param {SingleTimepoint} timepoint
			 * @param {(DerivedVariable|OriginalVariable)} variable
			 * @param {number} xPos
			 * @param {number} yPos
			 * @param {*} fontWeight
			 * @param {number} fontSize
			 * @return {g}
			 */
			getRowLabel(timepoint, variable, xPos, yPos, fontWeight, fontSize) {
				return (
					<g
						transform={`translate(${xPos},${yPos})`}
						onMouseEnter={(e) =>
							this.props.showTooltip(e, `Promote variable ${variable.name}`, variable.description)
						}
						onMouseLeave={this.props.hideTooltip}
					>
						<text
							style={{ fontWeight, fontSize, cursor: 'pointer' }}
							onContextMenu={(e) =>
								this.props.showContextMenu(e, timepoint.globalIndex, variable.id, 'PROMOTE')
							}
							onClick={() => this.promote(timepoint, variable)}
						>
							{variable.name}
						</text>
					</g>
				);
			}

			/**
			 * gets grey rectangle for highlighting a row
			 * @param {number} height
			 * @return {rect}
			 */
			getHighlightRect(height) {
				return <rect height={height} width={this.props.width || 0} fill="#e8e8e8" />;
			}

			/**
			 * Creates the variable labels for a timepoint
			 */
			getVariableLabels() {
				let pos = 0;
				const labelRows = [];
				this.props.rootStore.dataStore.variableStores[this.props.timepoint.type].fullCurrentVariables.forEach(
					(d) => {
						// Find the corresponding heatmap entry by variable ID, not by index
						const heatmapEntry = this.props.timepoint.heatmap.find((h) => h.variable === d.id);
						if (
							heatmapEntry &&
							(!heatmapEntry.isUndef ||
								this.props.uiStore.showUndefined ||
								d.id === this.props.timepoint.primaryVariableId)
						) {
							let lineHeight = this.props.rootStore.visStore.secondaryHeight;
							let fontWeight = 'normal';
							if (d.id === this.props.timepoint.primaryVariableId) {
								lineHeight = this.props.rootStore.visStore.primaryHeight;
								fontWeight = 'bold';
							}
							const transform = `translate(0,${pos})`;
							pos += lineHeight + this.props.rootStore.uiStore.horizontalGap;
							let fontSize = 12;
							if (lineHeight < fontSize) {
								fontSize = Math.round(lineHeight);
							}

							let highlightRect = null;
							if (d.id === this.props.highlightedVariable) {
								highlightRect = this.getHighlightRect(lineHeight);
							}

							labelRows.push(
								<g
									key={d.id}
									className="clickable"
									onMouseEnter={() => this.handleRowEnter(d.id)}
									onMouseLeave={this.handleRowLeave}
									transform={transform}
								>
									{highlightRect}
									{this.getRowLabel(
										this.props.timepoint,
										d,
										5,
										(lineHeight + fontSize / 2) / 2,
										fontWeight,
										fontSize
									)}
								</g>
							);
						}
					}
				);
				return labelRows;
			}

			render() {
				return <g transform={this.props.transform}>{this.getVariableLabels()}</g>;
			}
		}
	)
);

VariableLabelRow.propTypes = {
	timepoint: PropTypes.instanceOf(SingleTimepoint).isRequired,
	transform: PropTypes.string.isRequired,
	width: PropTypes.number.isRequired,
	showTooltip: PropTypes.func.isRequired,
	hideTooltip: PropTypes.func.isRequired,
	showContextMenu: PropTypes.func.isRequired,
	highlightVariable: PropTypes.func.isRequired,
	unhighlightVariable: PropTypes.func.isRequired,
	highlightedVariable: PropTypes.string,
};

VariableLabelRow.defaultProps = {
	highlightedVariable: undefined,
};

export default VariableLabelRow;
