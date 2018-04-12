import React from 'react';
import {observer} from 'mobx-react';
import Transition from './transitions/Transition'

const Transitions = observer(class Transitions extends React.Component {
    getTransitions() {
        const _self = this;
        console.log(this.props.transitionData);
        return (_self.props.transitionData.map(function (d, i) {
            const transform = "translate(0," + _self.props.yPositions[i] + ")";
            return (<g key={i + "transition"} transform={transform}><Transition transition={d}
                                                                                index={i}
                                                                                firstTimepoint={_self.props.timepointData[i]}
                                                                                secondTimepoint={_self.props.timepointData[i + 1]}
                                                                                firstPrimary={_self.props.primaryVariables[i]}
                                                                                secondPrimary={_self.props.primaryVariables[i + 1]}
                                                                                height={_self.props.visMap.transitionSpace}
                                                                                rectWidth={_self.props.visMap.sampleRectWidth}
                                                                                gap={_self.props.visMap.gap}
                                                                                groupScale={_self.props.groupScale}
                                                                                firstHeatmapScale={_self.props.heatmapScales[i]}
                                                                                secondHeatmapScale={_self.props.heatmapScales[i + 1]}
                                                                                visMap={_self.props.visMap}/>
            </g>);
        }))
    }

    render() {
        return (
            this.getTransitions()
        )
    }
});
export default Transitions;