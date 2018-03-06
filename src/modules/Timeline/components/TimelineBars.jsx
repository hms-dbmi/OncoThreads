import React from 'react';
import {observer} from "mobx-react"
import * as d3 from 'd3';

import Axis from '../../Axis.jsx';

const TimelineBars = observer(class TimelineBars extends React.Component {

    getMax(attributes, type) {
        let max = 0;
        attributes.forEach(function (d, i) {
            if (max < d[type]) {
                max = d[type];
            }
        });
        return max;
    }

    render() {
        const _self = this;
        let x = d3.scaleLinear()
            .domain([0, this.getMax(this.props.patientAttributes, this.props.attribute)])
            .range([0, this.props.width]);
        const xAxis = d3.axisBottom()
            .scale(x);
        let bars = [];
        this.props.patientAttributes.forEach(function (d, i) {
            bars.push(<rect key={_self.props.attribute+"_"+d.patient} height={10} width={x(d[_self.props.attribute])} y={_self.props.y(d.patient) - 5}
                            fill="blue"/>)
        });
        return (
            <g transform={this.props.transform}>
                {bars}
            </g>
        )
    }
});
export default TimelineBars;