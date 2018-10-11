import React from "react";
import {observer} from "mobx-react";
import ReactMixins from './../../../../utils/ReactMixins';
import BlockTextField from "./BlockTextField";


/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed al
 */
const TimepointLabels = observer(class TimepointLabels extends React.Component {
    constructor() {
        super();
        this.state = {
            width: 0,
            labels: []
        };
        ReactMixins.call(this);
    }

    /**
     * computes the width of a text
     * @param text
     * @param fontSize
     * @returns {number}
     */
    static getTextWidth(text, fontSize) {
        const context = document.createElement("canvas").getContext("2d");
        context.font = fontSize + "px Arial";
        return context.measureText(text).width;
    }

    setName(index, event) {
        this.props.timepoints[index].name(event.target.value)
    }

    render() {
        let labels = [];
        const _self = this;
        this.props.timepoints.forEach(function (d, i) {
            let pos;
            if(d.type==='sample'){
                pos = _self.props.sampleTPHeight / 2 + _self.props.posY[i] + 5;
            }
            else{
                pos = _self.props.betweenTPHeight / 2 + _self.props.posY[i] + 5;
            }
            labels.push(<g key={d.globalIndex} transform={"translate(0," + pos + ")"}><BlockTextField width={_self.state.width}
                                           timepoint={d}/></g>)
        });

        let offset;
        if (this.props.betweenTPHeight !== 0) {
            offset = this.props.betweenTPHeight / 2 + 30;
        }
        else {
            offset = this.props.sampleTPHeight / 2 + 30;
        }
        return (
            <div>
                <svg width={this.state.width} height={this.props.height}>
                    <line x1={this.state.width / 2} x2={this.state.width / 2} y1={this.props.posY[0] + offset}
                          y2={this.props.posY[this.props.posY.length - 1] + offset} stroke='lightgray'/>
                    <text y={15}
                          x={this.state.width / 2 - TimepointLabels.getTextWidth("Timepoint", 14) / 2}>Timepoint
                    </text>
                    {labels}
                </svg>
            </div>
        );
    }
});
export default TimepointLabels;
