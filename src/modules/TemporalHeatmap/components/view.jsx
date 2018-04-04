import React from 'react';
import {observer} from 'mobx-react';
import Timepoints from "./Timepoints"
import Transitions from "./Transitions"
import RowOperators from "./RowOperators"
import ReactMixins from "../../../utils/ReactMixins.js";
import * as d3 from "d3";

const view = observer(class view extends React.Component {
    constructor(){
        super();
        this.state={
            width:0
        };
                ReactMixins.call(this);

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
        const groupScale=this.createGroupScale(this.props.width)
        return (
                <div className="view">
                    <svg width={svgWidth} height={svgHeight}>
                        <g transform={transform}>
                            <Timepoints timepointData={this.props.timepointData} yPositions={this.props.timepointY}
                                        primaryHeight={this.props.rectWidth} secondaryHeight={this.props.secondaryHeight} gap={this.props.gap}
                                        rectWidth={this.props.rectWidth} width={this.state.width / 2}
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
        )
    }
});
view.defaultProps = {
    width: 750,
};
export default view;