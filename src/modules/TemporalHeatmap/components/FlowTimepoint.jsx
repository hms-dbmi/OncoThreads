import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';

const FlowTimepoint = observer(class FlowTimepoint extends React.Component {
    constructor() {
        super();
    }

    createRow(row, xScale, height, opacity) {
        let rects = [];
        let currCounts = 0;
        const _self = this;
        row.forEach(function (f, j) {
            rects.push(<rect width={xScale(f.value)} x={xScale(currCounts)} height={height}
                             fill={_self.props.color(f.key)} opacity={opacity}/>);
            currCounts += f.value
        });
        return rects
    }

    createPartition(partition, xScale, partitionIndex) {
        const _self = this;
        let previousYposition = 0;
        let rows = [];
        partition.rows.forEach(function (d, i) {
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
                rows.push(<g
                    transform={transform}>{label}{_self.createRow(d.counts, xScale, height, opacity)}</g>);
                previousYposition += height + _self.props.gap;
            }
            else {
                rows.push(<g
                    transform={transform}>{_self.createRow(d.counts, xScale, height, opacity)}</g>);
                previousYposition += height + _self.props.gap;
            }

        });
        return rows;
    }

    render() {
        const xScale = d3.scaleLinear().domain([0, this.props.store.numberOfPatients]).range([0, this.props.width - +(this.props.timepoint.length - 1) * 10]);
        const _self = this;
        let previousXPosition = 0;
        const partitions = [];
        this.props.timepoint.forEach(function (d, i) {
            const transform = "translate(" + previousXPosition + ",0)";
            partitions.push(<g transform={transform}>{_self.createPartition(d, xScale, i)}</g>);
            for (let j = 0; j < d.rows.length; j++) {
                if (d.rows[j].variable === _self.props.primaryVariable) {
                    _self.props.visMap.setxPosition(_self.props.index, d.partition, previousXPosition, previousXPosition + xScale(d.rows[j].counts[0].value));
                    previousXPosition += xScale(d.rows[j].counts[0].value) + 10;
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