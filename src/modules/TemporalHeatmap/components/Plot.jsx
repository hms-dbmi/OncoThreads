import React from 'react';
import {observer} from 'mobx-react';
import Timepoints from "./Timepoints/Timepoints"
import Transitions from "./Transitions/Transitions"
import * as d3 from "d3";
/*
creates the plot with timepoints and transitions
 */
const Plot = observer(class Plot extends React.Component {
    /**
     * Creates scales ecoding the positions for the different patients in the heatmap (one scale per timepoint)
     * @param w: width of the plot
     * @param rectWidth: width of a heatmap cell
     * @returns heatmap scales
     */
    createSampleHeatMapScales(w, rectWidth) {
        return this.props.timepoints.map(function (d, i) {
            return d3.scalePoint()
                .domain(d.heatmapOrder)
                .range([0, w - rectWidth]);
        })
    }



    /**
     * creates scales for computing the length of the partitions in grouped timepoints
     * @param w: width of the plot
     */
    createGroupScale(w) {
        return (d3.scaleLinear().domain([0, this.props.store.numberOfPatients]).range([0, w]));

    }

    render() {
        const sampleHeatmapScales = this.createSampleHeatMapScales(this.props.heatmapWidth, this.props.visMap.sampleRectWidth);
        const groupScale = this.createGroupScale(this.props.viewWidth);
        const translateGroupX=(this.props.heatmapWidth-this.props.viewWidth)/2;
        let transform = "translate(0," + 20 + ")";
        return (
            <div className="view">
                <svg width={this.props.width} height={this.props.height} viewBox={"0 0 "+this.props.width+" "+this.props.height}>
                    <g transform={transform}>
                        <Timepoints {...this.props}
                                    yPositions={this.props.timepointY}
                                    groupScale={groupScale}
                                    heatmapScales={sampleHeatmapScales}
                                    translateGroupX={translateGroupX}/>
                        <Transitions {...this.props} transitionData={this.props.transitionStore.transitionData}
                                     timepointData={this.props.store.timepoints}
                                     realTime={this.props.store.rootStore.realTime}
                                     yPositions={this.props.transY}
                                     groupScale={groupScale}
                                     heatmapScales={sampleHeatmapScales}
                                     height={this.props.transitionSpace}
                                     translateGroupX={translateGroupX}/>
                    </g>
                </svg>
            </div>
        )
    }
});
export default Plot;