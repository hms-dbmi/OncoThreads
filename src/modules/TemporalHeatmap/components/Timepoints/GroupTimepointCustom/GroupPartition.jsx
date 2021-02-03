import React from 'react';
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react';
import { extendObservable } from 'mobx';
import { Input } from 'antd'

import PropTypes from 'prop-types';
import CategoricalRowO3 from './CategoricalRow_o3';
import ContinuousRowO3 from './ContinuousRow_o3';
import CategoricalRow from './CategoricalRow';
import ContinuousRow from './ContinuousRow';
import DerivedVariable from '../../../stores/DerivedVariable';
import OriginalVariable from '../../../stores/OriginalVariable';

import { getColorByName } from 'modules/TemporalHeatmap/UtilityClasses/'

import './GroupPartition.css'

/**
 * Component for a partition in a grouped timepiint
 */
const GroupPartition = inject('dataStore', 'visStore', 'uiStore')(observer(class GroupPartition extends React.Component {
    constructor(props) {
        super(props)
        this.changeLabel = this.changeLabel.bind(this)
        extendObservable(this, {
            hasBackground: true
        })

    }
    createPartition() {
        let previousYposition = 0;
        let stateKey = this.props.partition.partition || ''
        const rows = [];
        let totalH = 0

        this.props.partition.rows
            .forEach((d, i) => {

                // don't show patient features in v2
                if (!this.props.dataStore.variableStores[this.props.type].currentNonPatientVariables.includes(d.variable)) return


                if (!this.props.heatmap[i].isUndef
                    || this.props.uiStore.showUndefined
                    || d.variable === this.props.primaryVariableId) {
                    const color = this.props.currentVariables[i].colorScale;
                    // let height = 0;
                    // let opacity = 1;
                    let height = this.props.visStore.secondaryHeight;
                    let opacity = 0.5;
                    let stroke = 'none';
                    let shiftOffset = 0;
                    if (i % 2 !== 0) {
                        shiftOffset = this.props.uiStore.rowOffset;
                    }
                    const transform = `translate(${shiftOffset},${previousYposition})`;

                    totalH += height

                    // create different types of rows depending on the variables datatype
                    if (this.props.currentVariables[i].datatype === 'NUMBER') {
                        if (this.props.type === "sample") {
                            rows.push(
                                <g key={d.variable} transform={transform}>
                                    <ContinuousRowO3
                                        variable={d.variable}
                                        row={d.counts}
                                        height={height}
                                        opacity={opacity}
                                        // color={color}
                                        stateColor={getColorByName(stateKey)}
                                        variableDomain={this.props.currentVariables[i].domain}
                                    />
                                </g>,
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
                                        variableDomain={this.props.currentVariables[i].domain}
                                        {...this.props.tooltipFunctions}
                                    />
                                </g>,
                            );
                        }

                    } else {
                        if (this.props.type === "sample") {
                            rows.push(
                                <g key={d.variable} transform={transform}>
                                    <CategoricalRowO3
                                        variable={d.variable}
                                        row={d.counts}
                                        height={height}
                                        opacity={opacity}
                                        // color={color}
                                        stateColor={getColorByName(stateKey)}
                                        variableDomain={this.props.currentVariables[i].domain}
                                    />
                                </g>,
                            );
                        } else {
                            rows.push(
                                <g key={d.variable} transform={transform}>
                                    <CategoricalRow
                                        variable={d.variable}
                                        row={d.counts}
                                        height={height}
                                        opacity={opacity}
                                        color={color}
                                        variableDomain={this.props.currentVariables[i].domain}
                                        {...this.props.tooltipFunctions}
                                    />
                                </g>,
                            );
                        }

                    }
                    previousYposition += height;
                }
            });

        let totalW = this.props.visStore.groupScale(this.props.partition.patients.length)
        return { totalH, totalW, rows };
    }

    changeLabel(e) {
        this.props.dataStore
            .setStateLabel(this.props.partition.partition, e.target.value)
    }


    render() {
        let stateInputLabel, stateKey = this.props.partition.partition || '',
            stateBackground, strokeW = 5

        let { rows, totalH, totalW } = this.createPartition()

        // add changable state label if this is a sample timepoint
        if (this.props.type === 'sample') {
            const fontWeight = 700,
                stateName = this.props.stateLabels[stateKey] || stateKey,
                labelHeight = this.props.visStore.primaryHeight

            stateInputLabel = <foreignObject width={totalW} height={labelHeight}>
                <input value={stateName} style={{ fontWeight: fontWeight, border: "none", backgroundColor: "transparent" }}
                    type="text" className="stateLabel"
                    onChange={this.changeLabel} />
            </foreignObject>

            stateBackground = <g className='stateBackground'>
                <rect
                    className='stateBackground'
                    opacity={0.6}
                    width={this.props.hasBackground ? totalW : 0}
                    height={totalH}
                    fill="white" />
                <rect
                    className='stateBackground'
                    opacity={0.4}
                    width={this.props.hasBackground ? totalW : 0}
                    height={totalH}
                    fill={getColorByName(stateKey)} />
            </g>
        }

        return <g className={`partitions ${stateKey}`} ref={this.ref}>
            {rows}
            {stateBackground}
            {stateInputLabel}
        </g>;
    }
}));
GroupPartition.propTypes = {
    partition: PropTypes.shape({
        partition: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
        rows: PropTypes.array,
        patients: PropTypes.array,
    }),
    heatmap: PropTypes.arrayOf(PropTypes.object).isRequired,
    currentVariables: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.instanceOf(DerivedVariable),
        PropTypes.instanceOf(OriginalVariable),
    ])).isRequired,
    stroke: PropTypes.string.isRequired,
    tooltipFunctions: PropTypes.objectOf(PropTypes.func),
    stateLabels: PropTypes.object.isRequired,
    hasBackground: PropTypes.bool.isRequired
};
export default GroupPartition;
