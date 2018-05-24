import React from 'react';
import {observer} from 'mobx-react';
import Timepoints from "./Timepoints/Timepoints"
import Transitions from "./Transitions/Transitions"
import * as d3 from "d3";
//import ReactMixins from './../../../utils/ReactMixins';

/*
creates the plot with timepoints and transitions
 */
const Plot = observer(class Plot extends React.Component {
    constructor() {
        super();
        this.state = {width: 0};
        //ReactMixins.call(this);
    }

    /**
     * Creates scales ecoding the positions for the different patients in the heatmap (one scale per timepoint)
     * @param w: width of the plot
     * @param rectWidth: width of a heatmap cell
     * @returns any[] scales
     */
    createSampleHeatMapScales(w, rectWidth) {
        return this.props.timepoints.map(function (d) {
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
        const groupScale = this.createGroupScale(this.props.width - this.props.visMap.partitionGap * (this.props.store.maxPartitions - 1));
        let transform = "translate(0," + 20 + ")";

        const max = this.props.store.rootStore.actualTimeLine
            .map(yPositions => yPositions.reduce((next, max) => next>max? next: max, 0))
            .reduce((next, max) => next>max? next: max, 0);

        //if(!this.props.store.rootStore.globalTime) {

        if(this.props.store.rootStore.realTime) {
        return (
            <div className="view">
                <svg width={this.props.width} height={this.props.height}>
                    <g transform={transform}>
                        <Timepoints {...this.props}
                                    allYPositions={this.props.store.rootStore.timeGapStructure}
                                    yPositions={this.props.timepointY}
                                    groupScale={groupScale}
                                    heatmapScales={sampleHeatmapScales}
                                    onDrag={this.handlePatientSelection}
                                    selectedPatients={this.state.selectedPatients}/>


                        <Transitions {...this.props} transitionData={this.props.transitionStore.transitionData}
                                     timepointData={this.props.store.timepoints}
                                     realTime={this.props.store.rootStore.realTime}
                                     globalTime={this.props.store.rootStore.globalTime}
                                     transitionOn={this.props.store.rootStore.transitionOn}
                                     yPositions={this.props.transY}
                                     groupScale={groupScale}
                                     heatmapScales={sampleHeatmapScales}
                                     height={this.props.transitionSpace}
                                     selectedPatients={this.state.selectedPatients}
                                     showTooltip={this.showSankeyTooltip}
                                     hideTooltip={this.hideSankeyTooltip}/>

                    </g>
                </svg>
                <SankeyTransitionTooltip visibility={this.state.showTooltip} x={this.state.tooltipX}
                                         y={this.state.tooltipY} content={this.state.tooltipContent}/>
            </div>
        )

    }

    else{

        return (
            <div className="scrollableX">
                <svg width={this.props.svgWidth} height={this.props.height}>
                    <g transform={transform}>
                        <Timepoints {...this.props}
                                    allYPositions={this.props.store.rootStore.actualTimeLine}
                                    yPositions={this.props.timepointY}
                                    groupScale={groupScale}
                                    heatmapScales={sampleHeatmapScales}/>
                        <Transitions {...this.props} transitionData={this.props.transitionStore.transitionData}
                                     timepointData={this.props.store.timepoints}
                                     realTime={this.props.store.rootStore.realTime}
                                     globalTime={this.props.store.rootStore.globalTime}
                                     transitionOn={this.props.store.rootStore.transitionOn}
                                     yPositions={this.props.transY}
                                     allYPositions={this.props.store.rootStore.actualTimeLine}
                                     max={max}
                                     groupScale={groupScale}
                                     heatmapScales={sampleHeatmapScales}
                                     height={this.props.transitionSpace}/>
                    </g>
                </svg>
            </div>
        )

    }


    }
});
export default Plot;