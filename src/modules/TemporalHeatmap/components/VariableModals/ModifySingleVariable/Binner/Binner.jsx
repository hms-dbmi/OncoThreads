import React from 'react';
import PropTypes from 'prop-types';
import { inject, observer } from 'mobx-react';
import { Checkbox, Form } from 'react-bootstrap';
import Histogram from './Histogram';
import Slider from './Slider';
import BinNames from './BinNames';

/**
 * Basic component for binning
 */
const Binner = inject('binningStore')(observer(class Binner extends React.Component {
    constructor(props) {
        super(props);
        this.coordX = 0; // current mouse position while dragging a slider
        this.margin = {
            top: 20, right: 75, bottom: 90, left: 50,
        };
        this.w = props.width + (this.margin.left + this.margin.right);
        this.h = props.height + (this.margin.top + this.margin.bottom);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
    }

    /**
     * creates checkbox for making binning binary
     * @return {Checkbox|null}
     */
    getBinaryCheckbox() {
        let checkbox = null;
        if (this.props.binningStore.x.length === 1) {
            checkbox = (
                <Checkbox
                    onChange={this.props.binningStore.toggleIsBinary}
                    checked={this.props.binningStore.isBinary}
                >
                    {' '}
                    make binary
                </Checkbox>
            );
        }
        return checkbox;
    }

    /**
     * selects the corresponding slider and saves current position, when mouse button is pressed
     * @param {event} e
     * @param {number} index
     */
    handleMouseDown(e, index) {
        this.coordX = e.pageX;
        this.props.binningStore.setSelectedIndex(index);
        this.props.binningStore.setDragging(true);
    }

    /**
     * resets current position and selected slider when mouse button is no longer pressed
     */
    handleMouseUp() {
        this.coordX = null;
        this.props.binningStore.setSelectedIndex(-1);
        this.props.binningStore.setDragging(false);
    }

    /**
     * updates dimensions of bins when slider is dragged by using
     * the saved initial mouse position (coordX) and the current mouse position
     * @param {event} e
     */
    handleMouseMove(e) {
        if (this.props.binningStore.dragging) {
            e.preventDefault();
            const xDiff = Math.round(this.coordX - e.pageX);
            this.coordX = e.pageX;
            this.props.binningStore.handleBinMove(xDiff);
        }
    }


    render() {
        const transform = `translate(${this.margin.left},${this.margin.top})`;
        return (
            <div>
                <svg
                    onMouseMove={e => this.handleMouseMove(e)}
                    onMouseUp={() => this.handleMouseUp()}
                    width={this.w}
                    height={this.h}
                >
                    <g transform={transform}>
                        <Histogram
                            bins={this.props.histBins}
                            xScale={this.props.binningStore.xScale}
                            yScale={this.props.yScale}
                            h={this.props.height}
                            w={this.props.width}
                            xLabel={this.props.xLabel}
                            numValues={this.props.data.length}
                        />
                        <Slider
                            yPos={this.props.height + 50}
                            width={this.props.width}
                            handleMouseDown={this.handleMouseDown}
                        />
                    </g>
                </svg>
                <Form inline>
                    <label>
                        Number of bins:
                        <input
                            onChange={e => this.props.binningStore
                                .handleNumberChange(e.target.value)}
                            type="number"
                            name="points"
                            value={this.props.binningStore.x.length + 1}
                            step="1"
                            min="2"
                        />
                    </label>
                    {this.getBinaryCheckbox()}
                </Form>
                <BinNames />
            </div>
        );
    }
}));
Binner.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    histBins: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
    yScale: PropTypes.func.isRequired,
    xLabel: PropTypes.string.isRequired,
    data: PropTypes.arrayOf(PropTypes.number).isRequired,
};
export default Binner;
