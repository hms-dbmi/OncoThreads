import React from 'react';
import {observer} from 'mobx-react';
import Timepoint from "./timepoints/Timepoint"

const TransitionTimepoints = observer(class TransitionTimepoints extends React.Component {


    getTimepoints() {
        const _self = this;
        return (this.props.store.timepointData.map(function (d, i) {
            const transform = "translate(0," + _self.props.yPositions[i] + ")";
            return (<g key={i + "timepoint"} transform={transform}><Timepoint timepoint={d} index={i}
                                                                              transitionVariables={_self.props.transitionVariables}
                                                                              height={_self.props.height}
                                                                              groupOrder={_self.props.groupOrder[i]}
                                                                              secondaryHeight={_self.props.secondaryHeight}
                                                                              rectWidth={_self.props.rectWidth}
                                                                              gap={_self.props.gap}
                                                                              width={_self.props.width}
                                                                              store={_self.props.store}
                                                                              visMap={_self.props.visMap}
                                                                              groupScale={_self.props.groupScale}
                                                                              heatmapScale={_self.props.heatmapScales[i]}/>
            </g>);
        }))
    }

    render() {
        return (
            this.getTimepoints()
        )
    }
});
export default TransitionTimepoints;