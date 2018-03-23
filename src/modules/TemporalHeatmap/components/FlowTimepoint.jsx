import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';

const FlowTimepoint = observer(class FlowTimepoint extends React.Component {
    constructor() {
        super();
        this.colorPrimary = d3.scaleOrdinal().range(['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e']);
        this.colorSecondary = d3.scaleOrdinal().range(['#f7f7f7', '#cccccc', '#969696', '#636363', '#252525']);
    }

    createRow(row, xScale, height, color) {
        let rects = [];
        let currCounts = 0;
        row.forEach(function (f, j) {
            rects.push(<rect width={xScale(f.value)} x={xScale(currCounts)} height={height} fill={color(f.key)}/>);
            currCounts += f.value
        });
        return rects
    }

    createPartition(partition, xScale, partitionIndex) {
        const _self = this;
        let previousYposition = 0;
        let rows = [];
        partition.rows.forEach(function (d, i) {
            let height=0;
            let color;
            const transform = "translate(0," + previousYposition + ")";
            if (_self.props.primaryVariable === d.variable) {
                height=_self.props.primaryHeight;
                color=_self.colorPrimary;
            }
            else {
                height=_self.props.secondaryHeight;
                color=_self.colorSecondary
            }
            if(partitionIndex===0){
                let label = <text key={"label" + d.variable} y={height / 2 + _self.props.gap}
                                  fontSize={8}
                                  x={-200}>{d.variable}</text>;
                rows.push(<g
                    transform={transform}>{label}{_self.createRow(d.counts, xScale, height, color)}</g>);
                previousYposition += height + _self.props.gap;
            }
            else{
                rows.push(<g
                    transform={transform}>{_self.createRow(d.counts, xScale, height, color)}</g>);
                previousYposition += height + _self.props.gap;
            }

        });
        return rows;
    }

    render() {
        const xScale = d3.scaleLinear().domain([0, this.props.store.numberOfPatients + (this.props.timepoint.length - 1)]).range([0, this.props.width]);
        const _self = this;
        let previousXPosition = 0;
        const partitions = [];
        this.props.timepoint.forEach(function (d, i) {
            const transform = "translate(" + (xScale(previousXPosition)) + ",0)";
            partitions.push(<g transform={transform}>{_self.createPartition(d, xScale, i)}</g>);
            for (let j = 0; j < d.rows.length; j++) {
                if (d.rows[j].variable === _self.props.primaryVariable) {
                    previousXPosition += d.rows[j].counts[0].value + 1;
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