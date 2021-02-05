import React from 'react';
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react';

import PropTypes from 'prop-types';
import CategoricalRow from './CategoricalRow';
import ContinuousRow from './ContinuousRow';
import DerivedVariable from '../../../stores/DerivedVariable';
import OriginalVariable from '../../../stores/OriginalVariable';





/**
 * Component for a partition in a grouped timepiint
 */
const GroupPartition = inject('dataStore', 'visStore', 'uiStore')(observer(class GroupPartition extends React.Component {
    
    createPartition() {
        let previousYposition = 0;
        const rows = [];
        this.props.partition.rows.forEach((d, i) => {
            if (!this.props.heatmap[i].isUndef
                || this.props.uiStore.showUndefined
                || d.variable === this.props.primaryVariableId) {
                const color = this.props.currentVariables[i].colorScale;
                let height = 0;
                let opacity = 1;
                let stroke = 'none';
                let shiftOffset = 0;
                if (i % 2 !== 0) {
                    shiftOffset = this.props.uiStore.rowOffset;
                }
                const transform = `translate(${shiftOffset},${previousYposition})`;
                if (this.props.primaryVariableId === d.variable) {
                    height = this.props.visStore.primaryHeight;
                    stroke = this.props.stroke;
                } else {
                    height = this.props.visStore.secondaryHeight;
                    opacity = 0.5;
                }
                // create different types of rows depending on the variables datatype
                if (this.props.currentVariables[i].datatype === 'NUMBER') {
                    rows.push(
                        <g key={d.variable} transform={transform}>
                            <ContinuousRow
                                row={d.counts}
                                height={height}
                                opacity={opacity}
                                color={color}
                                stroke={stroke}
                                variableDomain={this.props.currentVariables[i].domain}
                                {...this.props.tooltipFunctions}
                            />
                        </g>,
                    );
                } else {
                    rows.push(
                        <g key={d.variable} transform={transform}>
                            <CategoricalRow
                                row={d.counts}
                                patients={this.props.partition.patients}
                                height={height}
                                opacity={opacity}
                                color={color}
                                stroke={stroke}
                                isEven={i % 2 === 0}
                                {...this.props.tooltipFunctions}
                            />
                        </g>,
                    );
                }
                previousYposition += height + this.props.uiStore.horizontalGap;
            }
        });
        return rows;
    }

    render() {

        return  <g className={`partitions`}>
            {this.createPartition()}   
        </g>;
    }
}));
GroupPartition.propTypes = {
    partition: PropTypes.shape({
        partition: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
        rows: PropTypes.array,
        patients: PropTypes.array,
    }),
    heatmap: MobxPropTypes.observableArrayOf(PropTypes.object).isRequired,
    primaryVariableId: PropTypes.string.isRequired,
    currentVariables: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.instanceOf(DerivedVariable),
        PropTypes.instanceOf(OriginalVariable),
    ])).isRequired,
    stroke: PropTypes.string.isRequired,
    tooltipFunctions: PropTypes.objectOf(PropTypes.func)
};
export default GroupPartition;
