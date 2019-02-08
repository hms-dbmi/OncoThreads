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
        this.updateDimensions = this.updateDimensions.bind(this);
    }

    /**
     * Add event listener
     */
    componentDidMount() {
        this.updateDimensions();
        this.props.visMap.setPlotY(this.refs.plot.parentNode.getBoundingClientRect().top + 50);
        window.addEventListener("resize", this.updateDimensions);
    }

    /**
     * Remove event listener
     */
    componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions);
    }

    updateDimensions() {
        this.props.setPlotWidth(this.refs.plot.parentNode.getBoundingClientRect().width);
    }

    /**
     * Creates scales ecoding the positions for the different patients in the heatmap (one scale per timepoint)
     * @param w: width of the plot
     * @param rectWidth: width of a heatmap cell
     * @returns any[] scales
     */
    createSampleHeatMapScales(w, rectWidth) {
        return this.props.store.timepoints.map(function (d) {
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

    static createTimeScale(height, min, max) {
        return (d3.scaleLinear().domain([min, max]).rangeRound([0, height]));
    }

    render() {
        const sampleHeatmapScales = this.createSampleHeatMapScales(this.props.visMap.heatmapWidth, this.props.visMap.sampleRectWidth);
        const groupScale = this.createGroupScale(this.props.width - this.props.visMap.partitionGap * (this.props.store.maxPartitions - 1));
        let transform = "translate(0," + 20 + ")";
        const timeScale = Plot.createTimeScale(this.props.visMap.svgHeight - this.props.visMap.primaryHeight * 2, 0, this.props.store.rootStore.maxTimeInDays);
        return (
            <div ref="plot" className="scrollableX">
                <svg width={this.props.visMap.svgWidth} height={this.props.visMap.svgHeight}>
                    <g transform={transform}>
                        <Transitions groupScale={groupScale}
                                     heatmapScales={sampleHeatmapScales}
                                     timeScale={timeScale}
                                     tooltipFunctions={this.props.tooltipFunctions}
                                     visMap={this.props.visMap}
                                     store={this.props.store}
                                     transitionStore={this.props.transitionStore}/>
                        <Timepoints visMap={this.props.visMap}
                                    store={this.props.store}
                                    showContextMenuHeatmapRow={this.props.showContextMenuHeatmapRow}
                                    tooltipFunctions={this.props.tooltipFunctions}
                                    groupScale={groupScale}
                                    timeScale={timeScale}
                                    heatmapScales={sampleHeatmapScales}/>

                    </g>
                </svg>
            </div>
        )
    }

});
export default Plot;