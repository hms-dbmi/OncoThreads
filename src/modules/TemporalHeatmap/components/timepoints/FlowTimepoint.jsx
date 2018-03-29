import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';

import GroupRowOperators from './GroupRowOperators'

const FlowTimepoint = observer(class FlowTimepoint extends React.Component {
    constructor() {
        super();
    }

    createRow(row, height, opacity,color) {
        let rects = [];
        let currCounts = 0;
        const _self = this;
        row.forEach(function (f, j) {
            rects.push(<rect key={f.key + j} width={_self.props.groupScale(f.value)} x={_self.props.groupScale(currCounts)} height={height}
                             fill={color(f.key)} opacity={opacity}/>);
            currCounts += f.value
        });
        return rects
    }

    createPartition(partition, partitionIndex) {
        const _self = this;
        let previousYposition = 0;
        let rows = [];
        partition.rows.forEach(function (d, i) {
            const color=_self.props.visMap.getColorScale(d.variable);
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
            if (partitionIndex === 0) {
                let label = <text key={"label" + d.variable} y={height / 2 + _self.props.gap}
                                  fontSize={8}
                                  x={-200}>{d.variable}</text>;
                rows.push(<g key={d.variable}
                    transform={transform}>
                    {label}
                    <GroupRowOperators key={"operators" + d.variable} y={height / 2 + _self.props.gap} x={-20} timepoint={_self.props.index} variable={d.variable} store={_self.props.store}/>
                    {_self.createRow(d.counts, height, opacity,color)}
                    </g>);
                previousYposition += height + _self.props.gap;
            }
            else {
                rows.push(<g key={d.variable}
                    transform={transform}>{_self.createRow(d.counts, height, opacity,color)}</g>);
                previousYposition += height + _self.props.gap;
            }

        });
        return rows;
    }

    render() {
        const _self = this;
        let previousXPosition = 0;
        const partitions = [];
        this.props.timepoint.forEach(function (d, i) {
            const transform = "translate(" + previousXPosition + ",0)";
            partitions.push(<g key={d.partition} transform={transform}>{_self.createPartition(d, i)}</g>);
            for (let j = 0; j < d.rows.length; j++) {
                if (d.rows[j].variable === _self.props.primaryVariable) {
                    previousXPosition += _self.props.groupScale(d.rows[j].counts[0].value) + 10;
                }
            }
        });
        return (
            <g>
                {partitions}
            </g>
        )
    }
});
export default FlowTimepoint;