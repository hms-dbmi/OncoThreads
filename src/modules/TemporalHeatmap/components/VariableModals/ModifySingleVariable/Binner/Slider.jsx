import React from 'react';
import PropTypes from 'prop-types';
import { inject, observer } from 'mobx-react';

/**
 * Component for the sliders that display the bin boarders while binning
 */
const Slider = inject('binningStore')(observer(class Slider extends React.Component {
    /**
     * creats the slider dots and associated lines
     * @returns {g} - all sliders
     */
    getSliderEntries() {
        const sliderEntries = [];
        for (let i = 0; i < this.props.binningStore.x.length; i += 1) {
            sliderEntries.push(<line
                key={`line${i}`}
                x1={this.props.binningStore.x[i]}
                x2={this.props.binningStore.x[i]}
                y1={0}
                y2={this.props.yPos}
                stroke="black"
            />);
            sliderEntries.push(<circle
                key={`circle${i}`}
                fill="darkgrey"
                cx={this.props.binningStore.x[i]}
                cy={this.props.yPos}
                r={5}
                onMouseDown={e => this.props.handleMouseDown(e, i)}
            />);
        }
        return <g>{sliderEntries}</g>;
    }

    /**
     * creates little textfields for the slider entries to enable specifying values manually
     * @returns {[]}
     */
    getPositionTextfields() {
        const positionText = [];
        this.props.binningStore.x.forEach((d, i) => {
            positionText.push(
                <foreignObject key={i} x={d} width={75} height={26}>
                    <input
                        onChange={e => this.props.binningStore
                            .handlePositionTextFieldChange(e.target.value, i)}
                        type="text"
                        style={{
                            width: `${75}px`,
                        }}
                        value={this.props.binningStore.textFieldTexts[i]}
                    />
                </foreignObject>,
            );
        });
        return positionText;
    }

    /**
     * creates the labels for the bins
     * @returns {g} labels for bins
     */
    getBinLabels() {
        const x = this.props.binningStore.x.slice();
        x.sort((a, b) => a - b);
        const yPos = this.props.yPos + 10;
        const textFields = [];
        textFields.push(
            <rect
                key="rect1"
                x={0}
                y={yPos}
                width={x[0]}
                height={12}
                stroke="black"
                strokeWidth={1}
                fill="white"
            />,
        );
        textFields.push(
            <text
                key="text1"
                fontSize="10"
                x={x[0] / 2}
                y={yPos + 10}
            >
                1
            </text>,
        );
        x.forEach((d, i) => {
            if (i + 1 !== x.length) {
                textFields.push(
                    <rect
                        key={`rect${i + 2}`}
                        x={x[i]}
                        y={yPos}
                        width={x[i + 1] - x[i]}
                        height={12}
                        stroke="black"
                        strokeWidth={1}
                        fill="white"
                    />,
                );
                textFields.push(
                    <text
                        key={`text${i + 2}`}
                        fontSize="10"
                        x={(x[i] + x[i + 1]) / 2}
                        y={yPos + 10}
                    >
                        {(i + 2)}
                    </text>,
                );
            }
        });
        textFields.push(
            <rect
                key={`rect${x.length + 1}`}
                x={x[x.length - 1]}
                y={yPos}
                width={this.props.width - x[x.length - 1]}
                height={12}
                stroke="black"
                strokeWidth={1}
                fill="white"
            />,
        );
        textFields.push(
            <text
                key={`text${x.length + 1}`}
                fontSize="10"
                x={(this.props.width + x[x.length - 1]) / 2}
                y={yPos + 10}
            >
                {(x.length + 1)}
            </text>,
        );
        return <g>{textFields}</g>;
    }

    /**
     * creates the slider line
     * @returns {line} slider line
     */
    getSliderLine() {
        return (
            <line
                x1={0}
                x2={this.props.width}
                y1={this.props.yPos}
                y2={this.props.yPos}
                stroke="black"
                strokeWidth={3}
            />
        );
    }

    render() {
        const sliderLine = this.getSliderLine();
        const sliderEntries = this.getSliderEntries();
        const binLabels = this.getBinLabels();
        const positionTextFields = this.getPositionTextfields();
        return (
            <g>
                {sliderLine}
                {sliderEntries}
                {binLabels}
                {positionTextFields}
            </g>
        );
    }
}));
Slider.propTypes = {
    yPos: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    handleMouseDown: PropTypes.func.isRequired,
};

export default Slider;
