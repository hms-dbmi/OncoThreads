import React from 'react';
import { inject, observer } from 'mobx-react';
import VariableLabelRow from './VariableLabelRow';
import { getTextWidth } from '../../UtilityClasses/UtilityFunctions';

/**
 * Component for displaying variable labels for all timepoints
 */
const VariableLabels = inject('rootStore')(
	observer(({ rootStore, width, setHighlightedVariable, removeHighlightedVariable, highlightedVariable }) => {
		const calculateRequiredWidth = () => {
			let maxWidth = 0;
			const padding = 10;

			rootStore.dataStore.timepoints.forEach((timepoint) => {
				rootStore.dataStore.variableStores[timepoint.type].fullCurrentVariables.forEach((variable) => {
					const heatmapEntry = timepoint.heatmap.find((h) => h.variable === variable.id);
					if (
						heatmapEntry &&
						(!heatmapEntry.isUndef ||
							rootStore.uiStore.showUndefined ||
							variable.id === timepoint.primaryVariableId)
					) {
						const isPrimary = variable.id === timepoint.primaryVariableId;
						const fontWeight = isPrimary ? 700 : 400;
						const fontSize = 12;
						const textWidth = getTextWidth(variable.name, fontSize, fontWeight);
						maxWidth = Math.max(maxWidth, textWidth + padding);
					}
				});
			});

			return Math.max(maxWidth, 50);
		};

		const requiredWidth = calculateRequiredWidth();
		const svgWidth = Math.max(width || 150, requiredWidth);

		const labelRows = rootStore.dataStore.timepoints.map((d, i) => {
			const transform = `translate(0,${rootStore.visStore.timepointPositions.timepoint[i]})`;
			return (
				<VariableLabelRow
					key={d.globalIndex}
					transform={transform}
					timepoint={d}
					width={svgWidth}
					highlightVariable={setHighlightedVariable}
					unhighlightVariable={removeHighlightedVariable}
					highlightedVariable={highlightedVariable}
				/>
			);
		});

		return (
			<div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
				<svg width={svgWidth} height={rootStore.visStore.svgHeight}>
					{labelRows}
				</svg>
			</div>
		);
	})
);

export default VariableLabels;
