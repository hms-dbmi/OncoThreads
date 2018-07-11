import React from 'react';
import {observer} from 'mobx-react';

import PartitionRow from './PartitionRow'
/*
creates a partition in the grouped timepoint
 */
const GroupPartition = observer(class GroupPartition extends React.Component {
    createPartition() {
        const _self = this;
        let previousYposition = 0;
        let rows = [];
        this.props.partition.rows.forEach(function (d, i) {
            const color = _self.props.currentVariables[i].colorScale;
            let height = 0;
            let opacity = 1;
            let stroke = "none";
            const transform = "translate(0," + previousYposition + ")";
            if (_self.props.primaryVariableId === d.variable) {
                height = _self.props.visMap.primaryHeight;
                stroke = _self.props.stroke;
            }
            else {
                height = _self.props.visMap.secondaryHeight;
                opacity = 0.5;
            }
            rows.push(<g key={d.variable} transform={transform}><PartitionRow row={d.counts} height={height}
                                                                              variableType={_self.props.currentVariables[i].datatype}
                                                                              opacity={opacity} color={color}
                                                                              stroke={stroke}
                                                                              groupScale={_self.props.groupScale}
                                                                              showTooltip={_self.props.showTooltip}
                                                                              hideTooltip={_self.props.hideTooltip}/>
            </g>);
            previousYposition += height + _self.props.visMap.gap;

        });
        return rows;
    }

    render() {
        return (
            this.createPartition()
        )
    }
});
export default GroupPartition;