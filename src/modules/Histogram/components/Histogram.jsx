import React from 'react';
import ReactDOM from 'react-dom'
import * as d3 from 'd3';
import ReactMixins from "../../../utils/ReactMixins.js";


class Axis extends React.Component {
    componentDidUpdate() {
        this.renderAxis();
    }

    componentDidMount() {
        this.renderAxis()
    }

    renderAxis() {
        const node = ReactDOM.findDOMNode(this);
        d3.select(node).call(this.props.axis);
    }

    render() {
        const translatex = "translate(0," + (this.props.h) + ")";
        const translatey = "translate(-10, 0)";
        return (
            <g className="axis" transform={this.props.axisType === 'x' ? translatex : translatey}>
            </g>
        );
    }

}

class Histogram extends React.Component {
    constructor() {
        super();
        ReactMixins.call(this);
    }

    render() {
        const margin = {top: 0, right: 20, bottom: 0, left: 20},
            w = this.props.width - (margin.left + margin.right),
            h = this.props.height - (margin.top + margin.bottom);
        const transform = 'translate(' + margin.left + ',' + margin.top + ')';

        const formatCount = d3.format(",.0f");
        const x = d3.scaleLinear()
            .domain(this.props.xDomain)
            .rangeRound([0, w]);

        const bins = d3.histogram()
            .domain([0,d3.max(this.props.data)])
            .thresholds(x.ticks(30))(this.props.data);

        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, function (d) {
                return d.length;
            })]).range([h, 0]);
        let bars = bins.map(function (d) {
            const transform = "translate(" + x(d.x0) + "," + y(d.length) + ")";
            const width = x(bins[0].x1) - x(bins[0].x0) - 1;
            const height = h - y(d.length);
            const textX = (x(bins[0].x1) - x(bins[0].x0)) / 2;
            let label="";
            if(d.length!==0){
                label=formatCount(d.length);
            }
            return (
                <g transform={transform} key={d.x0}>
                    <rect x="1" width={width} height={height} fill="steelblue">
                    </rect>
                    <text dy=".75em" y="6" x={textX} textAnchor="middle">
                        {label}
                    </text>
                </g>
            );
        });
        const xAxis = d3.axisBottom()
            .scale(x);
        const yAxis = d3.axisLeft()
            .scale(y);


        return (
            <g transform={transform}>
                <Axis h={this.props.height} axis={yAxis} axisType="y"/>
                <Axis h={this.props.height} axis={xAxis} axisType="x"/>
                {bars}
            </g>
        )
    }
}

export default Histogram;