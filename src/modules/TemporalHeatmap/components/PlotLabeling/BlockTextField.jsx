import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import {getTextWidth} from '../../../UtilityClasses/UtilityFunctions';
import SingleTimepoint from '../../stores/SingleTimepoint';


/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed as arrows
 */
const BlockTextField = observer(class BlockTextField extends React.Component {
    /**
     * crops the text to a certain size
     * @param {string} text
     * @param {number} fontSize
     * @param {number} maxWidth
     * @returns {string}
     */
    static cropText(text, fontSize, maxWidth) {
        let returnText = text.toString();
        const width = getTextWidth(returnText, fontSize);
        if (width > maxWidth) {
            let prevText = returnText.substr(0, 0);
            for (let i = 1; i < returnText.length; i += 1) {
                const currText = returnText.substr(0, i);
                const prevWidth = getTextWidth(prevText, fontSize);
                const currWidth = getTextWidth(currText, fontSize);
                if (currWidth > maxWidth && prevWidth < maxWidth) {
                    returnText = prevText;
                    break;
                }
                prevText = currText;
            }
        }
        return returnText;
    }

    render() {
        const croppedText = BlockTextField.cropText(
            this.props.timepoint.name, (this.props.height - 2) / 2, this.props.width,
        );
        return (
            <g>
                <rect width={this.props.width - 2} height={this.props.height - 2} x={1} y={1} fill="white" stroke="darkgrey" />
                <text
                    width={this.props.width - 2}
                    height={this.props.height - 2}
                    y={20}
                    style={{ font: '14px Sans-Serif' }}
                    x={(this.props.width - getTextWidth(croppedText,
                        (this.props.height - 2) / 2)) / 2 + 1}
                >
                    {croppedText}
                </text>
                <foreignObject className="not_exported" style={{ width: this.props.width, height: this.props.height }}>
                    <input
                        style={{ textAlign: 'center', width: this.props.width, height: this.props.height }}
                        value={this.props.timepoint.name}
                        onChange={e => this.props.timepoint.setName(e.target.value)}
                        type="text"
                    />
                </foreignObject>
            </g>
        );
    }
});
BlockTextField.propTypes = {
    timepoint: PropTypes.instanceOf(SingleTimepoint).isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
};
export default BlockTextField;
