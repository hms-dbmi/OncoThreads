import React from "react";
import {observer} from "mobx-react";
import ReactMixins from './../../../../utils/ReactMixins';


/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed al
 */
const TimepointLabels = observer(class TimepointLabels extends React.Component {
    constructor() {
        super();
        this.state = {width: 0};
        ReactMixins.call(this);
    }
     /**
     * computes the width of a text
     * @param text
     * @param fontSize
     * @returns {number}
     */
    static getTextWidth(text,fontSize) {
        const context = document.createElement("canvas").getContext("2d");
        context.font=fontSize+"px Arial";
        return context.measureText(text).width;
    }
    render() {
        let labels = [];
        const _self = this;
        let start;
        this.props.timepoints.forEach(function (d, i) {
            if (d.type === "sample") {
                let label = "";
                if (_self.props.betweenTPHeight === 0) {
                    label = i;
                }
                else {
                    label = (i - 1) / 2
                }
                let pos = _self.props.sampleTPHeight / 2 + _self.props.posY[i] + 30;
                start=pos+10;
                labels.push(<text key={i} y={pos} x={_self.state.width / 2-TimepointLabels.getTextWidth(label,14)/2}>{label}</text>)
            }
            else {
                let pos = _self.props.betweenTPHeight / 2 + _self.props.posY[i] + 15;
                start=pos+25;
                labels.push(<line key={i} x1={_self.state.width / 2} y1={pos - 10} x2={_self.state.width / 2} y2={pos + 10}
                                  stroke="darkgray"
                                  fill="darkgray"
                                  markerEnd="url(#arrow)" strokeWidth="2"/>)
            }
            if(i!==_self.props.timepoints.length-1){
                let height=_self.props.posY[i+1]-_self.props.posY[i]-30;
                labels.push(<line key={i+"vline"} x1={_self.state.width/2} x2={_self.state.width/2} y1={start} y2={start+height} stroke="lightgray"/>);
            }
        });
        return (
            <div>
                <svg width={this.state.width} height={this.props.height}>
                    <defs>
                        <marker fill="#f00" id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"
                                markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L9,3 z" fill="#f00"/>
                        </marker>
                    </defs>
                    <text y={15} x={this.state.width/2-TimepointLabels.getTextWidth("Timepoint",14)/2}>Timepoint</text>
                    {labels}
                </svg>
            </div>
        );
    }
});
export default TimepointLabels;
