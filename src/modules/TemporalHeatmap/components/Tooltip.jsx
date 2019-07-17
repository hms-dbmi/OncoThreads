import React from 'react';
import { observer } from 'mobx-react';
import UtilityFunctions from '../UtilityClasses/UtilityFunctions';

/**
 * Basic tooltip component
 */
const Tooltip = observer(class SankeyTransitionTooltip extends React.Component {
    render() {
        const line1Width = UtilityFunctions.getTextWidth(this.props.line1, 14);
        const line2Width = UtilityFunctions.getTextWidth(this.props.line2, 14);
        const rectHeight = this.props.line2 !== undefined ? 35 : 20;
        const textWidth = line1Width > line2Width ? line1Width : line2Width;
        const transformText = 'translate(5,15)';
        let left = this.props.x - textWidth / 2;
        let polygonOffset = 0;
        if (left < 0) {
            left = 0;
            polygonOffset = this.props.x - textWidth / 2;
        }
        return (
            <div
                className="customTooltip"
                style={{
                    visibility: this.props.visibility,
                    position: 'absolute',
                    top: this.props.y - (this.props.line2 === undefined ? 30 : 45),
                    zIndex: 100,
                    // top: this.props.y - 30,
                    left,
                }}
            >
                <svg width={textWidth + 10} height={rectHeight + 5}>
                    <polygon
                        points={`${((textWidth + 10) / 2) - 5 + polygonOffset},${rectHeight} ${((textWidth + 10) / 2) + 5 + polygonOffset},${rectHeight} ${(textWidth + 10) / 2 + polygonOffset},${rectHeight + 5}`}
                        fill="gray"
                    />
                    <rect width={textWidth + 10} height={rectHeight} style={{ fill: 'gray' }} />
                    <text
                        width={textWidth}
                        height={rectHeight + 5}
                        style={{ fill: 'white' }}
                        transform={transformText}
                    >
                        <tspan x="0" y="0">{this.props.line1}</tspan>
                        <tspan x="0" y="14">{this.props.line2}</tspan>
                    </text>
                </svg>
            </div>
        );
    }
});
export default Tooltip;
