import React from 'react';
import { observer } from 'mobx-react';
import {getTextWidth} from '../UtilityClasses/UtilityFunctions';

/**
 * Basic tooltip component
 */
const Tooltip = observer(class SankeyTransitionTooltip extends React.Component {
    constructor() {
        super();
        this.textHeight = 14;
        this.topOffset = 10;
        this.padding = 5;
    }

    render() {
        const line1Width = getTextWidth(this.props.line1, this.textHeight);
        const line2Width = getTextWidth(this.props.line2, this.textHeight);
        const rectHeight = this.props.line2 !== undefined
            ? this.textHeight * 2 + this.padding
            : this.textHeight + this.padding;
        const textWidth = line1Width > line2Width ? line1Width : line2Width;
        const transformText = 'translate(5,15)';
        let left = this.props.x - textWidth / 2;
        let polygonOffset = 0;
        if (left < 0) {
            left = 0;
            polygonOffset = this.props.x - textWidth / 2;
        }
        if (this.props.x + textWidth / 2 > window.innerWidth) {
            left = window.innerWidth - textWidth;
            polygonOffset = -window.innerWidth + this.props.x + textWidth / 2;
        }
        return (
            <div
                style={{
                    visibility: this.props.visibility,
                    position: 'absolute',
                    top: this.props.y - (this.props.line2 === undefined
                        ? this.textHeight + this.padding + this.topOffset
                        : this.textHeight * 2 + this.padding + this.topOffset),
                    left,
                }}
            >
                <svg width={textWidth + this.padding * 2} height={rectHeight + this.padding}>
                    <polygon
                        points={`${textWidth / 2 + polygonOffset},${rectHeight} ${textWidth / 2 + this.padding * 2 + polygonOffset}
                        ,${rectHeight} ${(textWidth + this.padding * 2) / 2 + polygonOffset}
                        ,${rectHeight + this.padding}`}
                        fill="gray"
                    />
                    <rect width={textWidth + this.padding * 2} height={rectHeight} style={{ fill: 'gray' }} />
                    <text
                        width={textWidth}
                        height={rectHeight + this.padding}
                        style={{ fill: 'white' }}
                        transform={transformText}
                    >
                        <tspan x="0" y="0">{this.props.line1}</tspan>
                        <tspan x="0" y={this.textHeight}>{this.props.line2}</tspan>
                    </text>
                </svg>
            </div>
        );
    }
});
export default Tooltip;
