import React from 'react';
import { inject, observer } from 'mobx-react';
import { withUICallbacks } from '../UICallbacksContext';

/**
 * Component for variable labels of one timepoint
 */
const VariableLabelRow = withUICallbacks(
	inject(
		'rootStore',
		'uiStore'
	)(
		observer(
			({
				rootStore,
				uiStore,
				timepoint,
				transform,
				width,
				highlightVariable,
				unhighlightVariable,
				highlightedVariable,
				tooltipFunctions,
				showContextMenu,
			}) => {
				const { showTooltip, hideTooltip } = tooltipFunctions;

				const promote = (tp, variable) => {
					tp.setPrimaryVariable(variable.id);
					rootStore.undoRedoStore.saveTimepointHistory();
				};

				const getRowLabel = (tp, variable, xPos, yPos, fontWeight, fontSize) => (
					<g
						transform={`translate(${xPos},${yPos})`}
						onMouseEnter={(e) => showTooltip(e, `Promote variable ${variable.name}`, variable.description)}
						onMouseLeave={hideTooltip}
					>
						<text
							style={{ fontWeight, fontSize, cursor: 'pointer' }}
							onContextMenu={(e) => showContextMenu(e, tp.globalIndex, variable.id, 'PROMOTE')}
							onClick={() => promote(tp, variable)}
						>
							{variable.name}
						</text>
					</g>
				);

				const getHighlightRect = (height) => (
					<rect height={height} width={width || 0} fill="#e8e8e8" />
				);

				let pos = 0;
				const labelRows = [];
				rootStore.dataStore.variableStores[timepoint.type].fullCurrentVariables.forEach((d) => {
					const heatmapEntry = timepoint.heatmap.find((h) => h.variable === d.id);
					if (
						heatmapEntry &&
						(!heatmapEntry.isUndef ||
							uiStore.showUndefined ||
							d.id === timepoint.primaryVariableId)
					) {
						let lineHeight = rootStore.visStore.secondaryHeight;
						let fontWeight = 'normal';
						if (d.id === timepoint.primaryVariableId) {
							lineHeight = rootStore.visStore.primaryHeight;
							fontWeight = 'bold';
						}
						const rowTransform = `translate(0,${pos})`;
						pos += lineHeight + rootStore.uiStore.horizontalGap;
						let fontSize = 12;
						if (lineHeight < fontSize) {
							fontSize = Math.round(lineHeight);
						}

						let highlightRect = null;
						if (d.id === highlightedVariable) {
							highlightRect = getHighlightRect(lineHeight);
						}

						labelRows.push(
							<g
								key={d.id}
								className="clickable"
								onMouseEnter={() => highlightVariable(d.id)}
								onMouseLeave={unhighlightVariable}
								transform={rowTransform}
							>
								{highlightRect}
								{getRowLabel(
									timepoint,
									d,
									5,
									(lineHeight + fontSize / 2) / 2,
									fontWeight,
									fontSize
								)}
							</g>
						);
					}
				});

				return <g transform={transform}>{labelRows}</g>;
			}
		)
	)
);

export default VariableLabelRow;
