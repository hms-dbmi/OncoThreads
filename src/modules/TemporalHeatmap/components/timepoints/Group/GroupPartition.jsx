import React from 'react';
import {observer} from 'mobx-react';

import PartitionRow from './PartitionRow'

const GroupPartition = observer(class GroupPartition extends React.Component {
    createPartition() {
        const _self = this;
        let previousYposition = 0;
        let rows = [];
        this.props.partition.rows.forEach(function (d, i) {
            const color = _self.props.visMap.getColorScale(d.variable);
            let height = 0;
            let opacity = 1;
            const transform = "translate(0," + previousYposition + ")";
            if (_self.props.primaryVariable === d.variable) {
                height = _self.props.primaryHeight;
            }
            else {
                height = _self.props.secondaryHeight;
                opacity = 0.5;
            }
            let row = <PartitionRow row={d.counts} height={height} opacity={opacity} color={color}
                                    groupScale={_self.props.groupScale}/>;
            rows.push(<g key={d.variable}
                         transform={transform}>{row}</g>);
            previousYposition += height + _self.props.gap;

        });
        return rows;
    }

    render() {
        return (
            <g>
                {this.createPartition()}
            </g>
        )
    }
});
export default GroupPartition;