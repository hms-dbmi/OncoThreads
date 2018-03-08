import React from 'react';
import {observer} from "mobx-react"
import * as d3 from 'd3';
import TimelineToolTip from "./TimelineToolTip.jsx";
import Axis from '../../Axis.jsx';


const Timeline = observer(class Timeline extends React.Component {
    constructor() {
        super();
        this.state = {
            tooltip: {display: false, data: []},
        };
        this.showToolTip = this.showToolTip.bind(this);
        this.hideToolTip = this.hideToolTip.bind(this);
    }

    showToolTip(e, data, type) {
        let pos = {};
        if (type === "rect") {
            pos = {
                x: (Number(e.target.getAttribute("x"))+Number(e.target.getAttribute("width"))/2),
                y: Number(e.target.getAttribute("y"))+5
            }
        }
        else {
            pos = {
                x: e.target.getAttribute("cx"),
                y: e.target.getAttribute("cy")
            }
        }
        this.setState({
            tooltip: {
                display: true,
                data: data.attributes,
                pos: pos
            }
        });
    }

    hideToolTip(e) {
        this.setState({tooltip: {display: false, data: []}});

    }

    getLastTimepointInCategory(events) {
        let lastTimepoint = 0;
        events.forEach(function (d) {
            if (d.events.length !== 0) {
                const lastEntry = d.events[d.events.length - 1];
                if ("endNumberOfDaysSinceDiagnosis" in lastEntry) {
                    if (lastEntry["endNumberOfDaysSinceDiagnosis"] > lastTimepoint) {
                        lastTimepoint = lastEntry["endNumberOfDaysSinceDiagnosis"];
                    }
                }
                else {
                    if (lastEntry["startNumberOfDaysSinceDiagnosis"] > lastTimepoint) {
                        lastTimepoint = lastEntry["startNumberOfDaysSinceDiagnosis"];
                    }
                }
            }
        });
        return lastTimepoint;
    }

    getLastTimepoint() {
        const _self = this;
        let lastTimepoint = 0;
        lastTimepoint = this.getLastTimepointInCategory(this.props.sampleEvents.events);
        this.props.currEvents.forEach(function (d, i) {
            const timepoint = _self.getLastTimepointInCategory(d.events);
            if (lastTimepoint < timepoint) {
                lastTimepoint = timepoint
            }
        });
        return (lastTimepoint)
    }

    createLines(x, y) {
        let lines = [];
        let lastTimepoint = this.getLastTimepoint();
        this.props.sampleEvents.events.forEach(function (d) {
            lines.push(
                <line key={d.patient} x1={0} x2={x(lastTimepoint)} y1={y(d.patient)} y2={y(d.patient)}
                      stroke="lightgray">
                </line>
            )
        });
        return lines
    }

    createDots(x, y, data, opacity) {
        let dates = [];
        const _self = this;
        data.events.forEach(function (d) {
            d.events.forEach(function (f, i) {
                if ("endNumberOfDaysSinceDiagnosis" in f) {
                    dates.push(
                        <rect opacity={opacity} key={data.type + d.patient + "" + i}
                              x={x(f.startNumberOfDaysSinceDiagnosis)} y={y(d.patient) - 5}
                              height="10" width={x(f.endNumberOfDaysSinceDiagnosis - f.startNumberOfDaysSinceDiagnosis)}
                              fill={data.color} onMouseEnter={(e) => {
                            _self.showToolTip(e, f, "rect")
                        }} onMouseLeave={_self.hideToolTip}/>
                    )
                }
                else {
                    dates.push(
                        <circle opacity={opacity} key={data.type + d.patient + "" + i}
                                cx={x(f.startNumberOfDaysSinceDiagnosis)} cy={y(d.patient)} r="5"
                                fill={data.color} onMouseEnter={(e) => _self.showToolTip(e, f, "circle")}
                                onMouseLeave={_self.hideToolTip}/>
                    )
                }
            })
        });
        return dates;

    }

    createAllDots(x, y) {
        const _self = this;
        let dots = [];
        this.props.currEvents.forEach(function (d) {
            dots = dots.concat(_self.createDots(x, y, d, 0.7))
        });
        return dots;
    }

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
        const x = d3.scaleLinear()
            .domain([0, this.getLastTimepoint()])
            .range([0, this.props.width]);
        const xAxis = d3.axisBottom()
            .scale(x);
        const yAxis = d3.axisLeft()
            .scale(this.props.y);
        return (
            <g transform={this.props.transform}>
                <Axis h={this.props.height} axis={yAxis} axisType="y"/>
                <Axis h={this.props.height} axis={xAxis} axisType="x"/>
                {this.createLines(x, this.props.y)}
                {this.createDots(x, this.props.y, this.props.sampleEvents, 1)}
                {this.createAllDots(x, this.props.y)}
                <TimelineToolTip tooltip={this.state.tooltip}/>
            </g>

        )
    }
});


export default Timeline;