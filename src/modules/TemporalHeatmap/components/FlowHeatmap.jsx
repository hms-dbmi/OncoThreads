import React from 'react';
import {observer} from 'mobx-react';
import ReactMixins from "../../../utils/ReactMixins.js";
import Timepoints from "./Timepoints"
import Transitions from "./Transitions"
import * as d3 from "d3";

const FlowHeatmap = observer(class FlowHeatmap extends React.Component {
    constructor() {
        super();
        this.state = {
            width: 0,
        };
        this.colorCategorical = d3.scaleOrdinal().range(['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a']);

        ReactMixins.call(this);
    }

    createHeatMapScales(w, rectWidth){
        const _self = this;
        return this.props.patientOrderPerTimepoint.map(function (d, i) {
            return d3.scalePoint()
                .domain(d)
                .range([0, w - rectWidth]);
        })
    }

    createGroupScale(w) {
        return (d3.scaleLinear().domain([0, this.props.store.numberOfPatients]).range([0, w - 100]));

    }

    render() {
        const margin = {top: 10, right: 10, bottom: 10, left: 200},
            w = this.state.width - (margin.left + margin.right);
        const transform = 'translate(' + margin.left + ',' + margin.top + ')';
        const primaryHeight = 20;
        const secondaryHeight = 10;
        const rectWidth = 20;
        const gap = 2;
        const transitionSpace = 100;
        const tpHeight = primaryHeight + gap + (this.props.currentVariables.length - 1) * (secondaryHeight + gap);
        const groupScale = this.createGroupScale(w);
        const heatmapScales = this.createHeatMapScales(w, rectWidth);
        this.props.visMap.computeYpositions(tpHeight, transitionSpace);

        return (
            <div>
                <svg width={this.state.width} height={this.props.height}>
                    <g transform={transform}>
                        <Timepoints timepointData={this.props.timepointData} yPositions={this.props.visMap.timepointY}
                                    primaryHeight={primaryHeight} secondaryHeight={secondaryHeight} gap={gap}
                                    rectWidth={rectWidth} width={w}
                                    store={this.props.store} visMap={this.props.visMap}
                                    groupScale={groupScale} heatmapScales={heatmapScales}/>
                        <Transitions transitionData={this.props.transitionData} timepointData={this.props.timepointData}
                                     yPositions={this.props.visMap.transY}
                                     xPositions={this.props.visMap.xPositions}
                                     primaryVariables={this.props.primaryVariables}
                                     height={this.props.visMap.transHeight}
                                     rectWidth={rectWidth}
                                     visMap={this.props.visMap}
                                     groupScale={groupScale} heatmapScales={heatmapScales}/>

                    </g>
                </svg>
            </div>
        )
    }
});
FlowHeatmap.defaultProps = {
    width: 1000,
    height: 800,
};
export default FlowHeatmap;