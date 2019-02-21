import React from 'react';
import {observer} from 'mobx-react';
/*
implements a LineTransition
 */
const GlobalTransition = observer(class GlobalTransition extends React.Component {
    /**
     * Draws a line for the Line transition
     * @param x0: x pos on first timepoint
     * @param x1: x pos on second timepoint
     * @param y0: y pos
     * @param y1: y pos + height
     * @param key (unique)
     * @param strokeColor
     * @returns Line
     */


    static drawLine(x0, x1, y0, y1, key, strokeColor,strokeWidth) {
        let path = "M" + x0 + "," + y0
            + "L" + x1 + "," + y1;
        return (<path key={key} d={path} stroke={strokeColor} strokeWidth={strokeWidth} fill="none"/>)
    }


    drawLines() {
        let lines = [];
        this.props.patients.forEach(d => {
            let strokeColor = "lightgray";
            if (this.props.store.selectedPatients.includes(d)) {
                strokeColor = "black"
            }
            let finalValueColor="lightgray";
            let endHeight=1;
            let mouseProperties=[];
            if(this.props.minMax[d].value!==undefined){
                endHeight=3;
                mouseProperties={onMouseEnter:(e)=>this.props.showTooltip(e,this.props.minMax[d].value+": ",this.props.minMax[d].end+" days"),onMouseLeave:this.props.hideTooltip};
                if(this.props.minMax[d].value==="DECEASED"){
                    finalValueColor="black"
                }
            }
            lines.push(
                GlobalTransition.drawLine(this.props.heatmapScale(d) + this.props.visMap.sampleRectWidth / 4,
                    this.props.heatmapScale(d) + this.props.visMap.sampleRectWidth / 4,
                    this.props.timeScale(this.props.minMax[d].start),
                    this.props.timeScale(this.props.minMax[d].end),
                    d, strokeColor,1));
            lines.push(<rect key={d+"endpoint"}
                x={this.props.heatmapScale(d)}
                             y={this.props.timeScale(this.props.minMax[d].end)}
                             width={this.props.visMap.sampleRectWidth/2}
                                height={endHeight}
                             fill={finalValueColor}
                             {...mouseProperties}
                                />);
        });
        return lines;
    }

    static getMax(max, num) {
        return max > num ? max : num;
    }

    render() {
        return (
            this.drawLines()
        )
    }
});
export default GlobalTransition;