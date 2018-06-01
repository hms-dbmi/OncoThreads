import React from "react";
import {observer} from "mobx-react";


/*
 * Patient axis pointing to the right
 */
const GlobalTimeAxis = observer(class GlobalTimeAxis extends React.Component {


    render() {
        return (
                <svg width={this.props.width} height={this.props.height}>
                    <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"
                                markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L9,3 z" fill="darkgray"/>
                        </marker>
                    </defs>
                    <g>
                        <line x1="70" y1="30" x2="70" y2={this.props.height / 2 + 30} stroke="darkgray"
                              markerEnd="url(#arrow)" strokeWidth="2"/>
                        <text x={(this.props.width-100)/2} y={this.props.width / 2+30}>Time</text>
                    </g>
                </svg>
        );
    }
});
export default GlobalTimeAxis;