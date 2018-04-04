import React from 'react';
import {observer} from 'mobx-react';
import Timepoints from "./Timepoints"
import Transitions from "./Transitions"
import RowOperators from "./RowOperators"
import Legend from "./Legend"
import * as d3 from "d3";

const FlowHeatmap = observer(class FlowHeatmap extends React.Component {
    constructor() {
        super();


    }

    createHeatMapScales(w, rectWidth) {
        return this.props.patientOrderPerTimepoint.map(function (d, i) {
            return d3.scalePoint()
                .domain(d)
                .range([0, w - rectWidth]);
        })
    }

    createGroupScale(w) {
        return (d3.scaleLinear().domain([0, this.props.store.numberOfPatients]).range([0, w]));

    }

    getMaxPartitions() {
        let max = 0;
        const _self = this;
        this.props.isGrouped.forEach(function (d, i) {
            if (d) {
                console.log(_self.props.timepointData[i].group);
                if (_self.props.timepointData[i].group.length > max) {
                    max = _self.props.timepointData[i].group.length;
                }
            }
        });
        return max;
    }

    render() {
        let rectWidth = this.props.width / 50 - 1;
        if (this.props.numberOfPatients < 50) {
            rectWidth = this.props.width / this.props.numberOfPatients - 1;
        }
        let width = this.props.numberOfPatients * (rectWidth + 1);
        const secondaryHeight = rectWidth / 2;
        let gap=1;
        const partitionGap = 10;
        const transitionSpace = 100;
        const tpHeight = rectWidth + gap + (this.props.currentVariables.length - 1) * (secondaryHeight + gap);
        let timepointY = [];
        let transY = [];
        for (let i = 0; i < this.props.timepointData.length; i++) {
            timepointY.push(i * (tpHeight + transitionSpace));
            transY.push(tpHeight + i * (transitionSpace + tpHeight));
        }

        const groupScale = this.createGroupScale(width);
        const heatmapScales = this.createHeatMapScales(width, rectWidth);
        const svgWidth = width + (this.getMaxPartitions() - 1) * partitionGap + 0.5 * rectWidth;
        const svgHeight = this.props.store.numberOfTimepoints * (tpHeight + transitionSpace);

        let transform = "translate(0," + 20 + ")";


        return (
            <div className="heatmapContainer">
                <div className="rowOperators">
                    <svg width={200} height={svgHeight}>
                        <g transform={transform}>
                            <RowOperators isGrouped={this.props.isGrouped}
                                          currentVariables={this.props.currentVariables}
                                          primaryVariables={this.props.primaryVariables} store={this.props.store}
                                          secondaryHeight={secondaryHeight} primaryHeight={rectWidth} gap={gap}
                                          svgHeight={svgHeight} svgWidth={200}
                                          posY={timepointY}/>
                        </g>
                    </svg>
                </div>
                <div className="view">
                    <svg width={svgWidth} height={svgHeight}>
                        <g transform={transform}>
                            <Timepoints timepointData={this.props.timepointData} yPositions={timepointY}
                                        primaryHeight={rectWidth} secondaryHeight={secondaryHeight} gap={gap}
                                        rectWidth={rectWidth} width={this.props.width / 2}
                                        store={this.props.store} visMap={this.props.visMap}
                                        groupScale={groupScale} heatmapScales={heatmapScales}/>
                            <Transitions transitionData={this.props.transitionData}
                                         timepointData={this.props.timepointData}
                                         yPositions={transY}
                                         primaryVariables={this.props.primaryVariables}
                                         height={transitionSpace}
                                         rectWidth={rectWidth}
                                         gap={gap}
                                         visMap={this.props.visMap}
                                         groupScale={groupScale} heatmapScales={heatmapScales}/>

                        </g>
                    </svg>
                </div>
                <div className="legend">
                    <svg width={200} height={svgHeight}>
                        <g transform={transform}>
                            <Legend isGrouped={this.props.isGrouped}
                                    timepointData={this.props.timepointData}
                                    primaryVariables={this.props.primaryVariables} visMap={this.props.visMap}
                                    secondaryHeight={secondaryHeight} primaryHeight={rectWidth} gap={gap}
                                    svgHeight={svgHeight} svgWidth={600}
                                    posY={timepointY}/>
                        </g>
                    </svg>
                </div>
            </div>
        )
    }
});
FlowHeatmap.defaultProps = {
    width: 700,
};
export default FlowHeatmap;