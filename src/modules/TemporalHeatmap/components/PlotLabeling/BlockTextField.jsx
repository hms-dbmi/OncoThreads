import React from "react";
import {observer} from "mobx-react";


/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed as arrows
 */
const BlockTextField = observer(class BlockTextField extends React.Component {



    /**
     * computes the width of a text. Returns 30 if the text width would be shorter than 30
     * @param text
     * @param fontSize
     * @returns {number}
     */
    static getTextWidth(text, fontSize) {
        const context = document.createElement("canvas").getContext("2d");
        context.font = fontSize + "px Sans-Serif";
        return context.measureText(text).width;
    }

    /**
     * crops the text to a certain size
     * @param text
     * @param fontSize
     * @param maxWidth
     * @returns {string}
     */
    static cropText(text, fontSize, maxWidth) {
        let returnText=text.toString();
        const width = BlockTextField.getTextWidth(returnText, fontSize);
        if (width > maxWidth) {
            let prevText = returnText.substr(0, 0);
            for (let i = 1; i < returnText.length; i++) {
                let currText = returnText.substr(0, i);
                let prevWidth = BlockTextField.getTextWidth(prevText, fontSize);
                let currWidth = BlockTextField.getTextWidth(currText, fontSize);
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
        let croppedText = BlockTextField.cropText(this.props.timepoint.name, 14, this.props.width);
        return (
            <g>
                <rect width={this.props.width - 2} height={28} x={1} y={1} fill="white" stroke="darkgrey"/>
                <text width={this.props.width - 2} height={28} y={20} style={{font: "14px Sans-Serif"}}
                      x={(this.props.width - BlockTextField.getTextWidth(croppedText, 14)) / 2 + 1}>{croppedText}</text>
                <foreignObject><input
                    style={{textAlign: 'center', width: this.props.width, height: 30}} value={this.props.timepoint.name}
                    onChange={(e) => this.props.timepoint.setName(e.target.value)} type="text"/>
                </foreignObject>
            </g>
        );
    }
});
export default BlockTextField;
