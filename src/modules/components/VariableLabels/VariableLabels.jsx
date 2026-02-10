import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import VariableLabelRow from './VariableLabelRow';
import { getTextWidth } from '../../UtilityClasses/UtilityFunctions';

/**
 * Component for displaying variable labels for all timepoints
 */
const VariableLabels = inject('rootStore')(
	observer(
		class VariableLabels extends React.Component {
			/**
			 * Calculate the width needed to display all variable labels without truncation
			 * @returns {number}
			 */
			calculateRequiredWidth() {
				let maxWidth = 0;
				const padding = 10; // Left padding for text

				this.props.rootStore.dataStore.timepoints.forEach((timepoint) => {
					this.props.rootStore.dataStore.variableStores[timepoint.type].fullCurrentVariables.forEach(
						(variable) => {
							// Check if variable should be displayed
							const heatmapEntry = timepoint.heatmap.find((h) => h.variable === variable.id);
							if (
								heatmapEntry &&
								(!heatmapEntry.isUndef ||
									this.props.rootStore.uiStore.showUndefined ||
									variable.id === timepoint.primaryVariableId)
							) {
								// Determine font properties
								const isPrimary = variable.id === timepoint.primaryVariableId;
								const fontWeight = isPrimary ? 700 : 400; // bold : normal
								const fontSize = 12;

								// Calculate text width
								const textWidth = getTextWidth(variable.name, fontSize, fontWeight);
								maxWidth = Math.max(maxWidth, textWidth + padding);
							}
						}
					);
				});

				return Math.max(maxWidth, 50); // Minimum width of 50
			}

			render() {
				// Calculate required width for labels and use the larger of panel width or required width
				const requiredWidth = this.calculateRequiredWidth();
				const svgWidth = Math.max(this.props.width || 150, requiredWidth);

				const labelRows = [];
				this.props.rootStore.dataStore.timepoints.forEach((d, i) => {
					const transform = `translate(0,${this.props.rootStore.visStore.timepointPositions.timepoint[i]})`;
					labelRows.push(
						<VariableLabelRow
							key={d.globalIndex}
							transform={transform}
							timepoint={d}
							width={svgWidth}
							{...this.props.tooltipFunctions}
							showContextMenu={this.props.showContextMenu}
							highlightVariable={this.props.setHighlightedVariable}
							unhighlightVariable={this.props.removeHighlightedVariable}
							highlightedVariable={this.props.highlightedVariable}
						/>
					);
				});

				return (
					<div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
						<svg width={svgWidth} height={this.props.rootStore.visStore.svgHeight}>
							{labelRows}
						</svg>
					</div>
				);
			}
		}
	)
);

VariableLabels.propTypes = {
	width: PropTypes.number.isRequired,
	tooltipFunctions: PropTypes.objectOf(PropTypes.func).isRequired,
	showContextMenu: PropTypes.func.isRequired,
	setHighlightedVariable: PropTypes.func.isRequired,
	removeHighlightedVariable: PropTypes.func.isRequired,
	highlightedVariable: PropTypes.string,
};

VariableLabels.defaultProps = {
	highlightedVariable: undefined,
};

export default VariableLabels;
