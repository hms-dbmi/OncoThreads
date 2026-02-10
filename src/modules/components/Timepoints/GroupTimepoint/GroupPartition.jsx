import React from 'react';
import { inject, observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';

import PropTypes from 'prop-types';
import CategoricalRowO3 from './CategoricalRow_o3';
import ContinuousRowO3 from './ContinuousRow_o3';
import CategoricalRow from './CategoricalRow';
import ContinuousRow from './ContinuousRow';
import DerivedVariable from '../../../stores/DerivedVariable';
import { isNumeric } from 'modules/UtilityClasses';
import OriginalVariable from '../../../stores/OriginalVariable';

import { getColorByName } from 'modules/UtilityClasses';

import './GroupPartition.css';

/**
 * Component for a partition in a grouped timepoint
 */
const GroupPartition = inject(
	'dataStore',
	'visStore',
	'uiStore'
)(
	observer(
		class GroupPartition extends React.Component {
			hasBackground = true;

			constructor(props) {
				super(props);
				makeObservable(this, {
					hasBackground: observable,
				});
				this.changeLabel = this.changeLabel.bind(this);
			}
			createPartition() {
				let previousYposition = 0;
				const stateKey = this.props.partition.partition || '';
				const rows = [];
				let totalH = 0;

				this.props.partition.rows.forEach((d, i) => {
					// Find the corresponding variable and heatmap entry by variable ID, not by index
					const currentVariable = this.props.currentVariables.find((v) => v.id === d.variable);
					const heatmapEntry = this.props.heatmap.find((h) => h.variable === d.variable);

					if (!currentVariable || !heatmapEntry) {
						return; // Skip if variable or heatmap entry not found
					}

					if (
						!heatmapEntry.isUndef ||
						this.props.uiStore.showUndefined ||
						d.variable === this.props.primaryVariableId
					) {
						const color = currentVariable.colorScale;
						let height, opacity, stroke;
						if (this.props.usePrimaryHeight && this.props.primaryVariableId === d.variable) {
							height = this.props.visStore.primaryHeight;
							opacity = 1;
							stroke = this.props.stroke;
						} else {
							height = this.props.visStore.secondaryHeight;
							opacity = 0.5;
							stroke = 'none';
						}
						let shiftOffset = 0;
						if (i % 2 !== 0) {
							shiftOffset = this.props.uiStore.rowOffset;
						}
						const transform = `translate(${shiftOffset},${previousYposition})`;

						totalH += height + this.props.uiStore.horizontalGap;

						// create different types of rows depending on the variables datatype
						if (isNumeric(currentVariable.datatype)) {
							if (this.props.type === 'sample') {
								rows.push(
									<g key={d.variable} transform={transform}>
										<ContinuousRowO3
											variable={d.variable}
											row={d.counts}
											height={height}
											opacity={opacity}
											stateColor={getColorByName(stateKey)}
											variableDomain={currentVariable.domain}
										/>
									</g>
								);
							} else {
								rows.push(
									<g key={d.variable} transform={transform}>
										<ContinuousRow
											variable={d.variable}
											row={d.counts}
											height={height}
											opacity={opacity}
											color={color}
											stroke={stroke}
											variableDomain={currentVariable.domain}
											{...this.props.tooltipFunctions}
										/>
									</g>
								);
							}
						} else {
							if (this.props.type === 'sample') {
								rows.push(
									<g key={d.variable} transform={transform}>
										<CategoricalRowO3
											variable={d.variable}
											row={d.counts}
											height={height}
											opacity={opacity}
											stateColor={getColorByName(stateKey)}
											variableDomain={currentVariable.domain}
										/>
									</g>
								);
							} else {
								rows.push(
									<g key={d.variable} transform={transform}>
										<CategoricalRow
											variable={d.variable}
											row={d.counts}
											patients={this.props.partition.patients}
											height={height}
											opacity={opacity}
											color={color}
											stroke={stroke}
											isEven={i % 2 === 0}
											variableDomain={currentVariable.domain}
											{...this.props.tooltipFunctions}
										/>
									</g>
								);
							}
						}
						previousYposition += height + this.props.uiStore.horizontalGap;
					}
				});

				const totalW = this.props.visStore.groupScale(this.props.partition.patients.length) || 0;
				return { totalH, totalW, rows };
			}

			changeLabel(e) {
				this.props.dataStore.setStateLabel(this.props.partition.partition, e.target.value);
			}

			render() {
				let stateInputLabel,
					stateKey = this.props.partition.partition || '',
					stateBackground;

				const { rows, totalH, totalW } = this.createPartition();

				// add changable state label if this is a sample timepoint
				if (this.props.type === 'sample') {
					const fontWeight = 700,
						stateName = (this.props.stateLabels || {})[stateKey] || stateKey,
						labelHeight = this.props.visStore.primaryHeight;

					stateInputLabel = (
						<foreignObject width={totalW} height={labelHeight}>
							<input
								value={stateName}
								style={{ fontWeight: fontWeight, border: 'none', backgroundColor: 'transparent' }}
								type="text"
								className="stateLabel"
								onChange={this.changeLabel}
							/>
						</foreignObject>
					);

					stateBackground = (
						<g className="stateBackground">
							<rect
								className="stateBackground"
								opacity={0.6}
								width={this.props.hasBackground ? totalW : 0}
								height={totalH}
								fill="white"
							/>
							<rect
								className="stateBackground"
								opacity={0.4}
								width={this.props.hasBackground ? totalW : 0}
								height={totalH}
								fill={getColorByName(stateKey)}
							/>
						</g>
					);
				}

				return (
					<g className={`partitions ${stateKey}`} ref={this.ref}>
						{rows}
						{stateBackground}
						{stateInputLabel}
					</g>
				);
			}
		}
	)
);
GroupPartition.propTypes = {
	partition: PropTypes.shape({
		partition: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
		rows: PropTypes.array,
		patients: PropTypes.array,
	}),
	heatmap: PropTypes.arrayOf(PropTypes.object).isRequired,
	currentVariables: PropTypes.arrayOf(
		PropTypes.oneOfType([PropTypes.instanceOf(DerivedVariable), PropTypes.instanceOf(OriginalVariable)])
	).isRequired,
	stroke: PropTypes.string,
	tooltipFunctions: PropTypes.objectOf(PropTypes.func),
	primaryVariableId: PropTypes.string,
	stateLabels: PropTypes.object,
	hasBackground: PropTypes.bool,
	usePrimaryHeight: PropTypes.bool,
	type: PropTypes.string,
};
GroupPartition.defaultProps = {
	usePrimaryHeight: false,
	hasBackground: false,
	stateLabels: {},
	type: undefined,
	stroke: 'none',
	primaryVariableId: undefined,
};
export default GroupPartition;
