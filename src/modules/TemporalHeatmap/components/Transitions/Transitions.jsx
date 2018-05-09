import React from 'react';
import {observer} from 'mobx-react';
import Transition from './Transition'
/*
creates the transitions between timepoints
 */
const Transitions = observer(class Transitions extends React.Component {
    getPrimaryWithType(timepointIndex){
        const _self=this;
        let primary;
            this.props.store.currentVariables[this.props.timepoints[timepointIndex].type].forEach(function (d) {
                if(d.variable===_self.props.timepoints[timepointIndex].primaryVariable){
                    primary=d
                }
            });
        return primary;
    }
    //TODO: find better solution to get the type of the primary variables
    getTransitions() {
        const _self = this;
        return (_self.props.transitionData.map(function (d, i) {
            const firstPrimary=_self.getPrimaryWithType(i);
            const secondPrimary=_self.getPrimaryWithType(i+1);
            const transform = "translate(0," + _self.props.yPositions[i] + ")";
            return (<g key={i + "transition"} transform={transform}><Transition transition={d}
                                                                                index={i}
                                                                                realTime={_self.props.realTime}
                                                                                firstTimepoint={_self.props.timepoints[i]}
                                                                                secondTimepoint={_self.props.timepoints[i + 1]}
                                                                                firstPrimary={firstPrimary}
                                                                                secondPrimary={secondPrimary}
                                                                                groupScale={_self.props.groupScale}
                                                                                firstHeatmapScale={_self.props.heatmapScales[i]}
                                                                                secondHeatmapScale={_self.props.heatmapScales[i + 1]}
                                                                                selectedPatients={_self.props.selectedPatients}
                                                                                showTooltip={_self.props.showTooltip}
                                                                                hideTooltip={_self.props.hideTooltip}
                                                                                visMap={_self.props.visMap}
                                                                                    translateGroupX={_self.props.translateGroupX}/>
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