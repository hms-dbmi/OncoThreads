import React from 'react';
import {observer} from 'mobx-react';
import Timepoint from "./timepoints/Timepoint"
/*
creates the timepoints (either sampleTimepoints or betweenTimepoints)
 */
const Timepoints = observer(class Timepoints extends React.Component {

    getTimepoints() {
        const _self = this;
        let timepoints = [];
        this.props.store.timepointData.forEach(function (d, i) {
            let currentVariables = [];
            let rectWidth;
            //check the type of the timepoint to get the correct list of currentVariables and the correct width of the heatmap rectangles
            if (_self.props.store.timepointData[i].type === "between") {
                currentVariables = _self.props.currentBetweenVariables;
                rectWidth = _self.props.visMap.betweenRectWidth;


            }
            else {
                currentVariables = _self.props.currentSampleVariables;
                rectWidth = _self.props.visMap.sampleRectWidth;
            }
            const transform = "translate(0," + _self.props.yPositions[i] + ")";
            if (d.heatmap.length > 0) {
                timepoints.push(<g key={i + "timepoint"} transform={transform}><Timepoint timepoint={d} index={i}
                                                                                          currentVariables={currentVariables}
                                                                                          primaryHeight={_self.props.visMap.primaryHeight}
                                                                                          groupOrder={_self.props.groupOrder[i]}
                                                                                          secondaryHeight={_self.props.visMap.secondaryHeight}
                                                                                          rectWidth={rectWidth}
                                                                                          gap={_self.props.visMap.gap}
                                                                                          width={_self.props.heatmapWidth}
                                                                                          store={_self.props.store}
                                                                                          visMap={_self.props.visMap}
                                                                                          groupScale={_self.props.groupScale}
                                                                                          heatmapScale={_self.props.heatmapScales[i]}
                                                                                          onDrag={_self.props.onDrag}
                                                                                          selectedPatients={_self.props.selectedPatients}/>
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