import React from 'react';
import {observer} from 'mobx-react';
import * as d3 from "d3";
import Transition from './transitions/Transition'

const Transitions = observer(class Transitions extends React.Component {
    constructor() {
        super();
    }

    getTransitions() {
        const _self = this;
        return (this.props.transitionData.map(function (d, i) {
            const transform = "translate(0," + _self.props.yPositions[i] + ")";
            return (<g key={i + "transition"} transform={transform}><Transition transition={d}
                                                                                index={i}
                                                                                firstPositions={_self.props.xPositions[i]}
                                                                                secondPositions={_self.props.xPositions[i + 1]}
                                                                                firstTimepoint={_self.props.timepointData[i]}
                                                                                secondTimepoint={_self.props.timepointData[i + 1]}
                                                                                firstPrimary={_self.props.primaryVariables[i]}
                                                                                secondPrimary={_self.props.primaryVariables[i + 1]}
                                                                                firstX={_self.props.xPositions[i]}
                                                                                secondX={_self.props.xPositions[i + 1]}
                                                                                height={_self.props.height}
                                                                                rectWidth={_self.props.rectWidth}
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