import React from "react";
import {observer} from "mobx-react";


/*
 * Patient axis pointing to the right
 */
const GlobalTimeAxis = observer(class GlobalTimeAxis extends React.Component {


    render() {

        /* return (
                 <svg width={this.props.width} height={this.props.height}>
                     <defs>
                         <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"
                                 markerUnits="strokeWidth">
                             <path d="M0,0 L0,6 L9,3 z" fill="darkgray"/>
                         </marker>
                     </defs>
                     <g>
                         <line x1="72" y1="90" x2="72" y2={this.props.height / 2 +10 } stroke="darkgray"
                               markerEnd="url(#arrow)" strokeWidth="2"/>
                         <text  textAnchor="end"
                                 x= "71"//{(this.props.width-150)/2}

                                 y={this.props.height / 2 - 140}>
                                 Time (days)
                         </text>
                     </g>

                     <g>
                         <line x1="130" y1="30" x2="130" y2={this.props.height -10} stroke="darkgray"
                              strokeWidth="2"/>

                          <text textAnchor="end" x= "125" y= "40">0</text>

                          <text textAnchor="end" x= "125" y= {(this.props.height -10 -40)/4}>{Math.floor(this.props.maxTimeInDays/4)}</text>

                          <text textAnchor="end" x= "125" y= {(this.props.height -10 -40) *2 /4}>{Math.floor(this.props.maxTimeInDays * 2 /4)}</text>

                          <text textAnchor="end" x= "125" y= {(this.props.height -10 -40) *3 /4}>{Math.floor(this.props.maxTimeInDays * 3 /4)}</text>

                          <text textAnchor="end" x= "125" y= {this.props.height -10 } >{this.props.maxTimeInDays}</text>

                     </g>

                 </svg>
         );*/

        /*return (
            <svg width={this.props.width} height={this.props.height}>
                <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"
                            markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill="darkgray"/>
                    </marker>
                </defs>
                <g>
                    
                    <text  textAnchor="end"
                            x= "71"//{(this.props.width-150)/2} 
                    
                            y={this.props.height / 2 - 140}>
                            Time (days) 
                    </text>
                
                    <line x1="120" y1="30" x2="115" y2={this.props.height -18} stroke="darkgray"
                          markerEnd="url(#arrow)" strokeWidth="2"/>

                     <text textAnchor="end" x= "110" y= "40">0</text>

                     <text textAnchor="end" x= "110" y= {(this.props.height -10 -40)/4}>{Math.floor(this.props.maxTimeInDays/4)}</text>

                     <text textAnchor="end" x= "110" y= {(this.props.height -10 -40) *2 /4}>{Math.floor(this.props.maxTimeInDays * 2 /4)}</text>

                     <text textAnchor="end" x= "110" y= {(this.props.height -10 -40) *3 /4}>{Math.floor(this.props.maxTimeInDays * 3 /4)}</text>

                     <text textAnchor="end" x= "110" y= {this.props.height -20 } >{this.props.maxTimeInDays}</text>   
                    
                </g>

            </svg>
    );*/


        return (
            <svg width={this.props.width / 3} height={this.props.height}>
                <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"
                            markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill="darkgray"/>
                    </marker>
                </defs>
                <g>

                    <text textAnchor="end"
                          x="37"

                          y={this.props.height / 2 - 140}
                          fontSize="13px"
                    >
                        <tspan x="37" dy="1em">Time</tspan>
                        <tspan x="37" dy="1em">(days)</tspan>
                    </text>

                    <line x1="43" y1="30" x2="43" y2={this.props.height - 18} stroke="darkgray"
                          markerEnd="url(#arrow)" strokeWidth="2"/>

                    <text textAnchor="end" x="32" y="40" fontSize="12px">0</text>

                    <text textAnchor="end" x="32" y={(this.props.height - 10 - 40) / 4}
                          fontSize="12px">{Math.floor(this.props.maxTimeInDays / 4)}</text>

                    <text textAnchor="end" x="32" y={(this.props.height - 10 - 40) * 2 / 4}
                          fontSize="12px">{Math.floor(this.props.maxTimeInDays * 2 / 4)}</text>

                    <text textAnchor="end" x="32" y={(this.props.height - 10 - 40) * 3 / 4}
                          fontSize="12px">{Math.floor(this.props.maxTimeInDays * 3 / 4)}</text>

                    <text textAnchor="end" x="32" y={this.props.height - 20}
                          fontSize="12px">{this.props.maxTimeInDays}</text>

                </g>

            </svg>
        );
    }
});
export default GlobalTimeAxis;