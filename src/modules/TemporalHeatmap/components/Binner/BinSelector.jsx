import React from 'react';
import {observer} from 'mobx-react';
import * as d3 from 'd3';
import Axis from './Axis';
import Histogram from './Histogram';
import Slider from './Slider';

const BinSelector = observer(class BinSelector extends React.Component {
    constructor(props) {
        super(props);
        this.coordX = 0;
        this.xScale = d3.scaleLinear();
        this.state = {
            dragging: false,
            x: [(props.width - 70) / 2],
            currentBin: 0
        };
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleBinAddition = this.handleBinAddition.bind(this);
        this.handlePositionTextFieldChange = this.handlePositionTextFieldChange.bind(this);
    }

    /**
     * handles the addition of bins
     * @param e
     * @param width
     * @param xScale
     */
    handleBinAddition(e, width) {
        const stepWidth = width / e.target.value;
        let currX = 0;
        let x = [];
        for (let i = 0; i < e.target.value - 1; i++) {
            currX += stepWidth;
            x.push(Math.round(currX))
        }
        this.setState({x: x});
        this.props.handleNumberOfBinsChange(e.target.value);
        this.props.handleBinChange(this.getBins(x));
    }

    handleMouseDown(e, index) {
        this.coordX = e.pageX;
        this.setState({currentBin: index, dragging: true})
    }

    handleMouseUp() {
        this.setState({currentBin: -1, dragging: false});
        this.coordX = null;
        this.props.handleBinChange(this.getBins(this.state.x, this.xScale));
    }

    getBins(x) {
        let binValues = [];
        const _self = this;
        if (_self.props.isXLog) {
            binValues.push(Math.pow(10, this.xScale.domain()[0]));
            x.forEach(function (d) {
                binValues.push(Math.pow(10, _self.xScale.invert(d)));

            });
            binValues.push(Math.pow(10, this.xScale.domain()[1]));
        }
        else {
            binValues.push(this.xScale.domain()[0]);
            x.forEach(function (d) {
                binValues.push(_self.xScale.invert(d));

            });
            binValues.push(this.xScale.domain()[1]);
        }
        binValues.sort(function (a, b) {
            return a - b
        });
        return binValues;
    }

    handleMouseMove(e, width) {
        if (this.state.dragging) {
            e.preventDefault();
            const xDiff = Math.round(this.coordX - e.pageX);
            this.coordX = e.pageX;
            let x = this.state.x.slice();
            x[this.state.currentBin] = x[this.state.currentBin] - xDiff;
            if (x[this.state.currentBin] > 0 && x[this.state.currentBin] < width) {
                this.setState({x: x});
            }
        }
    }

    handlePositionTextFieldChange(event, index) {
        let x = this.state.x.slice();
        x[index] = this.xScale(Math.round(event.target.value * 10) / 10);
        this.props.handleBinChange(this.getBins(x));
        this.setState({x: x});

    }


    render() {
        const margin = {top: 20, right: 20, bottom: 90, left: 50},
            w = this.props.width - (margin.left + margin.right),
            h = this.props.height - (margin.top + margin.bottom);
        const transform = 'translate(' + margin.left + ',' + margin.top + ')';
        let data = this.props.data.map(d => this.props.transformXFunction(d));
        let min = d3.min(data);
        this.xScale = d3.scaleLinear().domain([min, d3.max(data)]).range([0, w]);

        const bins = d3.histogram()
            .domain([min, d3.max(data)])
            .thresholds(this.xScale.ticks(30))(data);
        const y = this.props.yScale
            .domain([0, d3.max(bins, function (d) {
                return d.length;
            })]).range([h, 0]);
        const xAxis = d3.axisBottom()
            .scale(this.xScale);
        const yAxis = d3.axisLeft()
            .scale(y)
            .tickFormat(function (d) {
                return Math.round(d / data.length * 100)
            });
        let xLabel = this.props.variableName;
        if (this.props.isXLog) {
            xLabel = "log_" + this.props.variableName;
        }


        return (
            <div>
                <label>Number of bins: <input onChange={(e) => this.handleBinAddition(e, w, this.xScale)} type="number"
                                              name="points"
                                              step="1" min="2" defaultValue="2"/></label>
                <svg onMouseMove={(e) => this.handleMouseMove(e, w)} onMouseUp={() => this.handleMouseUp(this.xScale)}
                     width={this.props.width}
                     height={this.props.height}>
                    <g transform={transform}>
                        <Axis h={h} w={this.props.width} axis={yAxis} axisType="y" label="Percent"/>
                        <Axis h={h} w={this.props.width} axis={xAxis} axisType="x" label={xLabel}/>
                        <Histogram bins={bins} xScale={this.xScale} yScale={y} height={h}/>
                        <Slider yPos={h + 50} width={w} x={this.state.x} xScale={this.xScale}
                                handleMouseDown={this.handleMouseDown}
                                handlePositionTextFieldChange={this.handlePositionTextFieldChange}/>
                    </g>
                </svg>
            </div>
        )
    }
});

export default BinSelector;