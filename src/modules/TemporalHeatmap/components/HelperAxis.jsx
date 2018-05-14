import React from "react";
import {observer} from "mobx-react";


/*
 * View if no study has been loaded
 */
const HelperAxis = observer(class HelperAxis extends React.Component {


    render() {
        let transform = "translate(40,0)";
        let length = this.props.width;
        let breadth = this.props.height
        if (this.props.orientation === "y") {
            transform = "translate(10,0)rotate(90)";
            length = this.props.height;
            breadth = this.props.width
        }
        return (
            <div className="helperAxis">
                <svg width={this.props.width} height={this.props.height}>
                    <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"
                                markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L9,3 z" fill="black"/>
                        </marker>
                    </defs>
                    <g transform={transform}>
                        <line x1="0" y1={breadth / 2} x2={length - 70} y2={breadth / 2} stroke="#000"
                              markerEnd="url(#arrow)"/>
                        <text x="0" y={breadth / 2}>{this.props.label}</text>
                    </g>
                </svg>
            </div>
        );
    }
});
export default HelperAxis;
