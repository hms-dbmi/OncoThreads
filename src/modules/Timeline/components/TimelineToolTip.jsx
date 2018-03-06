import React from 'react';
import {observer} from 'mobx-react';


const TimelineToolTip = observer(class TimelineToolTip extends React.Component {
    render() {
        let style = {};
        let text = [];
        let height=0;
        let width=0;
        let transform="translate(0,0)";
        if (this.props.tooltip.display) {
            height=60;
            width=250;
            transform="translate("+this.props.tooltip.pos.x+","+this.props.tooltip.pos.y+")";
            text = this.props.tooltip.data.map(function (d,i) {
                return <tspan key={d.key+"_"+d.value} x="0" dy="1.2em">{d.key + ": " + d.value}</tspan>
            });
        }
        else {
            style["display"] = "none";
        }
        return (
            <g transform={transform} pointerEvents="none">
                <rect width={width} height={height} fill={"white"} stroke={"black"}>
                </rect>
                <text>{text}</text>

            </g>
        );
    }
});
export default TimelineToolTip;