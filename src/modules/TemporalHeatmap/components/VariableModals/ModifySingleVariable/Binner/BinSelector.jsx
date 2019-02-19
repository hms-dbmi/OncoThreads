import React from 'react';
import {observer} from 'mobx-react';
import Histogram from './Histogram';
import Slider from './Slider';
import {Checkbox, Form} from "react-bootstrap";
import * as d3 from "d3";
import UtilityFunctions from "../../../../UtilityFunctions";

const BinSelector = observer(class BinSelector extends React.Component {
    constructor(props) {
        super(props);
        this.coordX = 0;
        this.margin = {top: 20, right: 20, bottom: 90, left: 50};
        this.w = props.width + (this.margin.left + this.margin.right);
        this.h = props.height + (this.margin.top + this.margin.bottom);
        this.inverseScale = d3.scaleLinear().range(props.xScale.domain()).domain(props.xScale.range());
        this.state = {
            dragging: false,
            x: props.bins.filter((d, i) => i !== 0 && i !== props.bins.length - 1).map(d => props.xScale(d)),
            textFieldTexts: props.bins.filter((d, i) => i !== 0 && i !== props.bins.length - 1).map(d=>UtilityFunctions.getScientificNotation(d)),
            currentBin: 0
        };
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleBinAddition = this.handleBinAddition.bind(this);
        this.handleBinRemoval = this.handleBinRemoval.bind(this);
        this.handleNumberChange = this.handleNumberChange.bind(this);
        this.handlePositionTextFieldChange = this.handlePositionTextFieldChange.bind(this);
    }

    /**
     * handles the addition of bins
     */
    handleBinAddition() {
        let xSorted = this.state.x.slice();
        xSorted = xSorted.sort((a, b) => a - b);
        let biggestGap = xSorted[0];
        let newPos = biggestGap / 2;
        if (xSorted.length === 1) {
            if (biggestGap < this.props.width - xSorted[0]) {
                biggestGap = this.props.width - xSorted[0];
                newPos = (this.props.width + xSorted[0]) / 2;
            }
        }
        for (let i = 1; i < xSorted.length; i++) {
            if (i === xSorted.length - 1 && biggestGap < (this.props.width - xSorted[i])) {
                biggestGap = this.props.width - xSorted[i];
                newPos = (this.props.width + xSorted[i]) / 2;
            }
            if (xSorted[i] - xSorted[i - 1] > biggestGap) {
                biggestGap = xSorted[i] - xSorted[i - 1];
                newPos = (xSorted[i] + xSorted[i - 1]) / 2;
            }
        }
        let newX = this.state.x.slice();
        let textFieldTexts = this.state.textFieldTexts.slice();
        newX.push(newPos);
        textFieldTexts.push(UtilityFunctions.getScientificNotation(this.inverseScale(newPos)));
        this.setState({x: newX, textFieldTexts: textFieldTexts});
        this.props.handleBinChange(this.getBins(newX));
    }

    handleBinRemoval() {
        let x = this.state.x.slice();
        let textFieldTexts = this.state.textFieldTexts.slice();
        x.pop();
        textFieldTexts.pop();
        this.setState({x: x, textFieldTexts: textFieldTexts});
        this.props.handleBinChange(this.getBins(x));
    }

    handleNumberChange(e) {
        if (e.target.value > this.state.x.length) {
            this.handleBinAddition();
        }
        else {
            this.handleBinRemoval();
        }
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
        x.slice().forEach(d => {
            binValues.push(this.inverseScale(d));
        });
        binValues.push(this.props.xScale.domain()[1]);
        return binValues.sort((a, b) => a - b);
    }

    handleMouseMove(e) {
        if (this.state.dragging) {
            e.preventDefault();
            const xDiff = Math.round(this.coordX - e.pageX);
            this.coordX = e.pageX;
            let x = this.state.x.slice();
            x[this.state.currentBin] = x[this.state.currentBin] - xDiff;
            let textFieldTexts = this.state.textFieldTexts.slice();
            textFieldTexts[this.state.currentBin] = UtilityFunctions.getScientificNotation(this.inverseScale(x[this.state.currentBin] - xDiff));
            if (x[this.state.currentBin] > 0 && x[this.state.currentBin] < this.props.width) {
                this.setState({x: x, textFieldTexts: textFieldTexts});
            }
        }
    }

    handlePositionTextFieldChange(value, index) {
        let x = this.state.x.slice();
        let textFieldTexts = this.state.textFieldTexts.slice();
        if (UtilityFunctions.isValidValue(value)) {
            textFieldTexts[index] = value;
            if (!isNaN(value) && value > this.props.bins[0] && value < this.props.bins[this.props.bins.length - 1]) {
                x[index] = this.props.xScale(value);
                this.props.handleBinChange(this.getBins(x));
            }
        }
        this.setState({x: x, textFieldTexts: textFieldTexts});
    }

    getBinaryCheckbox() {
        let checkbox = null;
        if (this.state.x.length === 1) {
            checkbox =
                <Checkbox onChange={this.props.toggleIsBinary} checked={this.props.isBinary}> make binary</Checkbox>

        }
        return checkbox;
    }


    render() {
        const transform = 'translate(' + this.margin.left + ',' + this.margin.top + ')';
        return (
            <div>
                <svg onMouseMove={(e) => this.handleMouseMove(e)}
                     onMouseUp={() => this.handleMouseUp(this.props.xScale)}
                     width={this.w}
                     height={this.h}>
                    <g transform={transform}>
                        <Histogram bins={this.props.histBins} xScale={this.props.xScale} yScale={this.props.yScale}
                                   h={this.props.height}
                                   w={this.props.width} xLabel={this.props.xLabel}
                                   numValues={this.props.data.length}/>
                        <Slider yPos={this.props.height + 50} width={this.props.width} x={this.state.x}
                                dragging={this.state.dragging}
                                textFieldTexts={this.state.textFieldTexts}
                                xScale={this.props.xScale}
                                handleMouseDown={this.handleMouseDown}
                                handlePositionTextFieldChange={this.handlePositionTextFieldChange}/>
                    </g>
                </svg>
                <Form inline>
                    <label>Number of bins: <input onChange={(e) => this.handleNumberChange(e)}
                                                  type="number"
                                                  name="points"
                                                  value={this.state.x.length + 1}
                                                  step="1" min="2"/></label>
                    {this.getBinaryCheckbox()}
                </Form>
            </div>
        )
    }
});

export default BinSelector;