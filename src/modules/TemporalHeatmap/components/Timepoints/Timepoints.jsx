import React from 'react';
import {observer} from 'mobx-react';
import Timepoint from "./Timepoint"
/*
creates the timepoints (either sampleTimepoints or betweenTimepoints)
 */
const Timepoints = observer(class Timepoints extends React.Component {

    getTimepoints() {
        const _self = this;
        let timepoints = [];
        this.props.timepoints.forEach(function (d, i) {
            let rectWidth;
            //check the type of the timepoint to get the correct list of currentVariables and the correct width of the heatmap rectangles
            if (_self.props.timepoints[i].type === "between") {
                rectWidth = _self.props.visMap.betweenRectWidth;
            }
            else {
                rectWidth = _self.props.visMap.sampleRectWidth;
            }
            const transform = "translate(0," + _self.props.yPositions[i] + ")";
            if (d.heatmap.length > 0) {
                timepoints.push(<g key={i + "timepoint"} transform={transform}><Timepoint timepoint={d} index={i}
                                                                                          currentVariables={_self.props.store.currentVariables[d.type]}
                                                                                          rectWidth={rectWidth}
                                                                                          width={_self.props.heatmapWidth}
                                                                                          store={_self.props.store}
                                                                                          visMap={_self.props.visMap}
                                                                                          groupScale={_self.props.groupScale}
                                                                                          heatmapScale={_self.props.heatmapScales[i]}
                                                                                          onDrag={_self.props.onDrag}
                                                                                          selectPartition={_self.props.selectPartition}
                                                                                          selectedPatients={_self.props.selectedPatients}
                                                                                          translateGroupX={_self.props.translateGroupX}/>
                </g>);
            }
        });
        return timepoints;
    }

    render() {
        return (
            this.getTimepoints()
        )
    }
});
export default Timepoints;