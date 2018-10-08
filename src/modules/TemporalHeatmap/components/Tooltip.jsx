import React from 'react';
import {observer} from 'mobx-react';
/*
tooltip for hovering over Sankey Transition
 */
const Tooltip = observer(class SankeyTransitionTooltip extends React.Component {
    /**
     * computes the width of a text. Returns 30 if the text width would be shorter than 30
     * @param text
     * @param fontSize
     * @returns {number}
     */
    static getTextWidth(text, fontSize) {
        const context = document.createElement("canvas").getContext("2d");
        context.font = fontSize + "px Arial";
        return context.measureText(text).width;
    }

    render() {
        const line1Width = Tooltip.getTextWidth(this.props.line1, 14);
        const line2Width = Tooltip.getTextWidth(this.props.line2, 14);
        const rectHeight = this.props.line2!==undefined ? 35 : 20;
        const textWidth = line1Width > line2Width ? line1Width: line2Width;
        let transformText = "translate(5,15)";
        return (
            <div className="customTooltip" style={{
                visibility: this.props.visibility,
                position: "absolute",
                top: this.props.y - (this.props.line2===undefined ? 30: 45),
                zIndex: 100,
                //top: this.props.y - 30,
                left: this.props.x - textWidth / 2
            }}>
                <svg width={textWidth + 10} height={rectHeight+5}>
                    <polygon
                        points={(((textWidth + 10) / 2) - 5) + ","+rectHeight +" "+ (((textWidth + 10) / 2) + 5) + "," + rectHeight+" "+ ((textWidth + 10) / 2) + ","+(rectHeight+5)}
                        fill="gray"/>
                    <rect width={textWidth + 10} height={rectHeight} style={{fill:"gray"}}/>
                    <text  width={textWidth} height={rectHeight+5} style={{fill:"white"}}
                          transform={transformText}>
                        <tspan x="0" y="0">{this.props.line1}</tspan>
                        <tspan x="0" y="14">{this.props.line2}</tspan>
                    </text>
                </svg>
            </div>
        )
    }
});
export default Tooltip;