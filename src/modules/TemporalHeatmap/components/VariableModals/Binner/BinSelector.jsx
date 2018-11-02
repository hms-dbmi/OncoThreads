import React from 'react';
import {observer} from 'mobx-react';
import Histogram from './Histogram';
import Slider from './Slider';

const BinSelector = observer(class BinSelector extends React.Component {
    constructor(props) {
        super(props);
        this.coordX = 0;
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
        this.props.handleBinChange(this.getBins(this.state.x, this.props.xScale));
    }

    getBins(x) {
        let binValues = [];
        binValues.push(this.props.xScale.domain()[0]);
        x.forEach(d => {
            binValues.push(this.props.xScale.invert(d));

        });
        binValues.push(this.props.xScale.domain()[1]);
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
        x[index] = this.props.xScale(event.target.value);
        this.props.handleBinChange(this.getBins(x));
        this.setState({x: x});

    }


    render() {
        const margin = {top: 20, right: 20, bottom: 90, left: 50},
            w = this.props.width + (margin.left + margin.right),
            h = this.props.height + (margin.top + margin.bottom);
        const transform = 'translate(' + margin.left + ',' + margin.top + ')';
        let xLabel = this.props.variableName;
        if (this.props.isXLog) {
            xLabel = "log_" + this.props.variableName;
        }

        return (
            <div>
                <svg onMouseMove={(e) => this.handleMouseMove(e, w)}
                     onMouseUp={() => this.handleMouseUp(this.props.xScale)}
                     width={w}
                     height={h}>
                    <g transform={transform}>
                        <Histogram bins={this.props.histBins} xScale={this.props.xScale} yScale={this.props.yScale}
                                   h={this.props.height}
                                   w={this.props.width} xLabel={xLabel}
                                   numValues={this.props.data.length}/>
                        <Slider yPos={this.props.height + 50} width={this.props.width} x={this.state.x}
                                xScale={this.props.xScale}
                                handleMouseDown={this.handleMouseDown}
                                handlePositionTextFieldChange={this.handlePositionTextFieldChange}/>
                    </g>
                </svg>
                <label>Number of bins: <input onChange={(e) => this.handleBinAddition(e, w, this.props.xScale)}
                                              type="number"
                                              name="points"
                                              step="1" min="2" defaultValue="2"/></label>
            </div>
        )
    }
});

export default BinSelector;