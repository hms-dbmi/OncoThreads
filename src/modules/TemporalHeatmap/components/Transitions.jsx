import React from 'react';
import {observer} from 'mobx-react';
import Transition from './transitions/Transition'
/*
creates the transitions between timepoints
 */
const Transitions = observer(class Transitions extends React.Component {
    getPrimaryWithType(timepointIndex){
        const _self=this;
        let primary,currentVariables;
        if(this.props.timepointData[timepointIndex].type==="between"){
                currentVariables=this.props.currentBetweenVariables;
            }
            else{
                currentVariables=this.props.currentSampleVariables;
            }
            currentVariables.forEach(function (d) {
                if(d.variable===_self.props.primaryVariables[timepointIndex]){
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
                                                                                firstTimepoint={_self.props.timepointData[i]}
                                                                                secondTimepoint={_self.props.timepointData[i + 1]}
                                                                                firstPrimary={firstPrimary}
                                                                                secondPrimary={secondPrimary}
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