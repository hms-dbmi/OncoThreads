import React from 'react';
import {observer} from 'mobx-react';
import Timepoint from "./timepoints/Timepoint"

const Timepoints = observer(class Timepoints extends React.Component {


    getTimepoints() {
        const _self = this;
        return (this.props.timepointData.map(function (d, i) {
            const transform = "translate(0," + _self.props.yPositions[i] + ")";
            return (<g key={i + "timepoint"} transform={transform}><Timepoint timepoint={d} index={i}
                                                                              primaryHeight={_self.props.primaryHeight}
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
export default Timepoints;