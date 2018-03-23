import React from 'react';
import {observer} from 'mobx-react';
import ReactMixins from "../../../utils/ReactMixins.js";
import Timepoint from "./Timepoint"

const FlowHeatmap = observer(class FlowHeatmap extends React.Component {
    constructor() {
        super();
        this.state = {
            width: 0,
        };

        ReactMixins.call(this);
    }

    drawTimepoints(width) {
        const primaryHeight = 20;
        const secondaryHeight = 10;
        const rectWidth = 20;
        const gap = 2;
        const transitionSpace = 100;

        let yTransform = 0;
        let timepoints = [];
        const _self = this;
        this.props.sampleData.forEach(function (d, i) {
            const transform = "translate(0," + yTransform + ")";
            timepoints.push(<g key={i} transform={transform}><Timepoint timepoint={d} index={i}
                                                                        primaryVariable={_self.props.primaryVariables[i]}
                                                                        isGrouped={_self.props.isGrouped[i]}
                                                                        patients={_self.props.patients}
                                                                        primaryHeight={primaryHeight}
                                                                        secondaryHeight={secondaryHeight}
                                                                        rectWidth={rectWidth} gap={gap} width={width}
                                                                        store={_self.props.store}/></g>);
            yTransform += primaryHeight + gap + (_self.props.currentVariables.length - 1) * (secondaryHeight + gap) + transitionSpace;
        });
        return (timepoints);
    }

    render() {
        const margin = {top: 10, right: 10, bottom: 10, left: 200},
            w = this.state.width - (margin.left + margin.right);
        const transform = 'translate(' + margin.left + ',' + margin.top + ')';

        return (
            <div>
                <svg width={this.state.width} height={this.props.height}>
                    <g transform={transform}>
                        {this.drawTimepoints(w)}
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