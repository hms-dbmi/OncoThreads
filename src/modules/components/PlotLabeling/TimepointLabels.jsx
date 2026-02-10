import React from 'react';
import { inject, observer } from 'mobx-react';
import BlockTextField from './BlockTextField';

const TEXT_FIELD_HEIGHT = 30;

/*
 * BlockView: Timepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers
 */
const TimepointLabels = inject(
	'dataStore',
	'visStore',
	'uiStore'
)(
	observer(({ dataStore, visStore, uiStore, width, padding }) => {
		const svgWidth = Math.max(50, width || 100);
		const labels = dataStore.timepoints.map((d, i) => {
			let pos =
				padding +
				visStore.timepointPositions.timepoint[i] +
				(visStore.getTPHeight(d) - TEXT_FIELD_HEIGHT) / 2;
			if (uiStore.selectedTab === 'myblock') {
				pos =
					padding +
					visStore.newTimepointPositions.timepoint[i] +
					(visStore.getTPHeight(d) - TEXT_FIELD_HEIGHT) / 2;
			}
			let textfield = null;
			if (d.type === 'sample') {
				textfield = <BlockTextField width={svgWidth} height={TEXT_FIELD_HEIGHT} timepoint={d} />;
			}
			return (
				<g key={d.globalIndex} transform={`translate(0,${pos})`}>
					{textfield}
				</g>
			);
		});

		let firstPos =
			padding +
			visStore.timepointPositions.timepoint[0] +
			visStore.getTPHeight(dataStore.timepoints[0]) / 2;
		let lastPos =
			padding +
			visStore.timepointPositions.timepoint[visStore.timepointPositions.timepoint.length - 1] +
			visStore.getTPHeight(dataStore.timepoints[dataStore.timepoints.length - 1]) / 2;

		if (uiStore.selectedTab === 'myblock') {
			firstPos =
				padding +
				visStore.newTimepointPositions.timepoint[0] +
				visStore.getTPHeight(dataStore.timepoints[0]) / 2;
			lastPos =
				padding +
				visStore.newTimepointPositions.timepoint[visStore.timepointPositions.timepoint.length - 1] +
				visStore.getTPHeight(dataStore.timepoints[dataStore.timepoints.length - 1]) / 2;
		}

		return (
			<div>
				<svg width={svgWidth} height={visStore.svgHeight}>
					<line x1={svgWidth / 2 - 10} x2={svgWidth / 2} y1={firstPos} y2={firstPos} stroke="lightgray" />
					<line x1={svgWidth / 2} x2={svgWidth / 2} y1={firstPos} y2={lastPos} stroke="lightgray" />
					<line x1={svgWidth / 2 - 10} x2={svgWidth / 2} y1={lastPos} y2={lastPos} stroke="lightgray" />
					<text y={padding - 5} x={0}>
						Timepoint
					</text>
					{labels}
				</svg>
			</div>
		);
	})
);
export default TimepointLabels;
