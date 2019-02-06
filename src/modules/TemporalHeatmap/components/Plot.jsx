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

    componentDidUpdate(prevProps) {
        if (this.props.sidebarVisible !== prevProps.sidebarVisible) {
            this.updateDimensions();
        }
    }

    shouldComponentUpdate(nextProps) {
        //console.log("shouldComponentUpdate?",!nextProps.dataLoading);
        return !nextProps.dataLoading;
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
        return (d3.scaleLinear().domain([0, this.props.numberOfPatients]).range([0, w]));

    }

    static createTimeScale(height, min, max) {
        return (d3.scaleLinear().domain([min, max]).rangeRound([0, height]));
    }

    render() {
        const sampleHeatmapScales = this.createSampleHeatMapScales(this.props.heatmapWidth, this.props.sampleRectWidth);
        const groupScale = this.createGroupScale(this.props.width - this.props.partitionGap * (this.props.maxPartitions - 1));
        let transform = "translate(0," + 20 + ")";
        const max = this.props.actualTimeLine
            .map(yPositions => yPositions.reduce((next, max) => next > max ? next : max, 0))
            .reduce((next, max) => next > max ? next : max, 0);
        const timeScale = Plot.createTimeScale(this.props.height - this.props.primaryHeight * 2, 0, max);
        return (
            <div ref="plot" className="scrollableX">
                <svg width={this.props.svgWidth} height={this.props.height}>
                    <g transform={transform}>
                        <Transitions {...this.props}
                                     transitionData={this.props.transitions}
                                     timepointData={this.props.timepoints}
                                     yPositions={this.props.transY}
                                     allYPositions={this.props.actualTimeLine}
                                     groupScale={groupScale}
                                     heatmapScales={sampleHeatmapScales}
                                     timeScale={timeScale}
                                     height={this.props.transitionSpace}/>
                        <Timepoints {...this.props}
                                    allYPositions={this.props.actualTimeLine}
                                    yPositions={this.props.timepointY}
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