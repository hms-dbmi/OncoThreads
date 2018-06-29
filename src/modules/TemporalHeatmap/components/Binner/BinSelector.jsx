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
        this.xScale=d3.scaleLinear();
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
    handleBinAddition(e, width, xScale) {
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
        this.props.handleBinChange(this.getBins(this.state.x));
    }

    getBins(x) {
        let binValues = [];
        const _self=this;
        binValues.push(this.xScale.domain()[0]);
        x.forEach(function (d) {
            binValues.push(Math.round(_self.xScale.invert(d)));
        });
        binValues.push(this.xScale.domain()[1]);
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

    handlePositionTextFieldChange(event, index, xScale) {
        let x = this.state.x.slice();
        x[index] = xScale.invert(event.target.value);
        this.props.handleBinChange(this.getBins(x));
        this.setState({x: x});

    }



    render() {
        const margin = {top: 20, right: 20, bottom: 70, left: 50},
            w = this.props.width - (margin.left + margin.right),
            h = this.props.height - (margin.top + margin.bottom);
        const transform = 'translate(' + margin.left + ',' + margin.top + ')';

        this.xScale.domain([d3.min(this.props.data)-1, d3.max(this.props.data)]).rangeRound([0, w]);

        const reverseX = d3.scaleLinear().domain([0, w]).rangeRound([d3.min(this.props.data)-1, d3.max(this.props.data)]);
        const bins = d3.histogram()
            .domain([d3.min(this.props.data)-1, d3.max(this.props.data)])
            .thresholds(this.xScale.ticks(30))(this.props.data);

        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, function (d) {
                return d.length;
            })]).range([h, 0]);
        const xAxis = d3.axisBottom()
            .scale(this.xScale);
        const yAxis = d3.axisLeft()
            .scale(y);


        return (
            <div>
                <label>Number of bins: <input onChange={(e) => this.handleBinAddition(e, w, this.xScale)} type="number"
                                              name="points"
                                              step="1" min="2" defaultValue="2"/></label>
                <svg onMouseMove={(e) => this.handleMouseMove(e, w)} onMouseUp={() => this.handleMouseUp(this.xScale)}
                     width={this.props.width}
                     height={this.props.height}>
                    <g transform={transform}>
                        <Axis h={this.props.height} axis={yAxis} axisType="y"/>
                        <Axis h={h} axis={xAxis} axisType="x"/>
                        <Histogram data={this.props.data} bins={bins} xScale={this.xScale} yScale={y} height={h}/>
                        <Slider yPos={h+30} width={w} x={this.state.x} reverseScale={reverseX} handleMouseDown={this.handleMouseDown} handlePositionTextFieldChange={this.handlePositionTextFieldChange}/>
                    </g>
                </svg>
            </div>
        )
    }
});

export default BinSelector;