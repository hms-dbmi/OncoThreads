import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';
import RowOperators from './HeatmapRowOperators'

const HeatmapTimepoint = observer(class HeatmapTimepoint extends React.Component {
    getRow(row, rowIndex, height, opacity, scale) {
        let label = <text key={"label" + row.variable} y={height / 2 + this.props.gap} fontSize={8}
                          x={-200}>{row.variable}</text>;
        let operators = <RowOperators key={"operators" + row.variable} y={height / 2 + this.props.gap} x={-20}
                                      timepoint={this.props.index} variable={row.variable} store={this.props.store}/>;
        let rects = [];
        const _self = this;
        row.data.forEach(function (d) {
            rects.push(<rect key={d.patient} height={height} width={_self.props.rectWidth} x={scale(d.patient)}
                             fill={_self.props.color(d.value)} opacity={opacity}/>);
            if (rowIndex === 0) {
                _self.props.visMap.setxPosition(_self.props.index, d.patient, scale(d.patient), scale(d.patient) + _self.props.rectWidth);
            }
        });
        return [label, operators, rects];
    }

    getTimepontRectangles() {
        const _self = this;
        let primaryPatients = this.props.timepoint.filter(function (f) {
            return f.variable === _self.props.primaryVariable;
        });
        const xScale = d3.scalePoint()
            .domain(_self.props.patientOrder)
            .range([0, _self.props.width - _self.props.rectWidth]);
        let rows = [];
        let previousYposition = 0;
        this.props.timepoint.forEach(function (row, i) {
            const transform = "translate(0," + previousYposition + ")";
            if (row.variable === _self.props.primaryVariable) {
                rows.push(<g key={row.variable} transform={transform}>
                    {_self.getRow(row, i, _self.props.primaryHeight, 1, xScale)}
                </g>);
                previousYposition += _self.props.primaryHeight + _self.props.gap;
            }
            else {
                rows.push(<g key={row.variable} transform={transform}>
                    {_self.getRow(row, i, _self.props.secondaryHeight, 0.5, xScale)}
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