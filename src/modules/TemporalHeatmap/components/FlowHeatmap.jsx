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
        this.props.visMap.computeYpositions(tpHeight, transitionSpace);
        this.props.visMap.resetxPositions();

        return (
            <div>
                <svg width={this.state.width} height={this.props.height}>
                    <g transform={transform}>
                        <Timepoints timepointData={this.props.timepointData} yPositions={this.props.visMap.timepointY}
                                    primaryHeight={primaryHeight} secondaryHeight={secondaryHeight} gap={gap}
                                    rectWidth={rectWidth} width={w} color={this.colorCategorical}
                                    store={this.props.store} visMap={this.props.visMap}/>
                        <Transitions transitionData={this.props.transitionData} yPositions={this.props.visMap.transY}
                                     xPositions={this.props.visMap.xPositions} height={this.props.visMap.transHeight}/>

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