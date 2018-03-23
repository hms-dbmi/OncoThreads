import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';
import RowOperators from './RowOperators'

const HeatmapTimepoint = observer(class HeatmapTimepoint extends React.Component {
    getRow(row, height, x, color) {
        let label = <text key={"label" + row.variable} y={height / 2 + this.props.gap} fontSize={8}
                          x={-200}>{row.variable}</text>;
        let operators = <RowOperators key={"operators" + row.variable} y={height / 2 + this.props.gap} x={-20}
                                      timepoint={this.props.index} variable={row.variable} store={this.props.store}/>;
        let rects = [];
        const _self = this;
        row.data.forEach(function (d, i) {
            rects.push(<rect key={d.patient} height={height} width={_self.props.rectWidth} x={x(d.patient)}
                             fill={color(d.value)}/>)
        });
        return [label, operators, rects];
    }

    getTimepontRectangles() {
        const _self = this;
        let primaryPatients = this.props.timepoint.filter(function (f) {
            return f.variable === _self.props.primaryVariable;
        });
        const x = d3.scalePoint()
            .domain(primaryPatients[0].data.map(function (d, i) {
                return d.patient;
            }))
            .range([0, this.props.width - this.props.rectWidth]);
        const colorPrimary = d3.scaleOrdinal().range(['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e']);
        const colorSecondary = d3.scaleOrdinal().range(['#f7f7f7', '#cccccc', '#969696', '#636363', '#252525']);

        let rows = [];
        let previousYposition = 0;
        this.props.timepoint.forEach(function (row, i) {
            const transform = "translate(0," + previousYposition + ")";
            if (row.variable === _self.props.primaryVariable) {
                rows.push(<g key={row.variable} transform={transform}>
                    {_self.getRow(row, _self.props.primaryHeight, x, colorPrimary)}
                </g>);
                previousYposition += _self.props.primaryHeight + _self.props.gap;
            }
            else {
                rows.push(<g key={row.variable} transform={transform}>
                    {_self.getRow(row, _self.props.secondaryHeight, x, colorSecondary)}
                </g>);
                previousYposition += _self.props.secondaryHeight + _self.props.gap;
            }
        });
        return (rows)
    }

    render() {
        return (
            <g>
                {this.getTimepontRectangles()}
            </g>
        )
    }
});
export default HeatmapTimepoint;