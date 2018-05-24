import React from 'react';
import {observer} from 'mobx-react';
import Transition from './Transition'
/*
creates the transitions between timepoints
 */
const Transitions = observer(class Transitions extends React.Component {


    getTransitions() {
        const _self = this;
        return (_self.props.transitionData.map(function (d, i) {
            const transform = "translate(0," + _self.props.yPositions[i] + ")";
            return (<g key={i + "transition"} transform={transform}><Transition transition={d}
                                                                                index={i}
                                                                                realTime={_self.props.realTime}
                                                                                firstTimepoint={_self.props.timepoints[i]}
                                                                                secondTimepoint={_self.props.timepoints[i + 1]}
                                                                                firstPrimary={_self.props.timepoints[i].primaryVariable}
                                                                                secondPrimary={_self.props.timepoints[i+1].primaryVariable}
                                                                                groupScale={_self.props.groupScale}
                                                                                firstHeatmapScale={_self.props.heatmapScales[i]}
                                                                                secondHeatmapScale={_self.props.heatmapScales[i + 1]}
                                                                                selectedPatients={_self.props.selectedPatients}
                                                                                showTooltip={_self.props.showTooltip}
                                                                                hideTooltip={_self.props.hideTooltip}
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