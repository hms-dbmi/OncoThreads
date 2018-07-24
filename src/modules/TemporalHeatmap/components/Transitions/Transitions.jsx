import React from 'react';
import {observer} from 'mobx-react';
import Transition from './Transition'
import GlobalTransition from "./GlobalTransition";
/*
creates the transitions between timepoints
 */
const Transitions = observer(class Transitions extends React.Component {

    getFullPrimary(timepoint) {
        return this.props.store.variableStore[timepoint.type].getById(timepoint.primaryVariableId);
    }

    getBlockTransitions() {
        const _self = this;
        return (_self.props.transitionData.map(function (d, i) {
            const transform = "translate(0," + _self.props.yPositions[i] + ")";
            return (<g key={i + "transition"} transform={transform}><Transition transition={d}
                                                                                index={i}
                                                                                realTime={_self.props.realTime}
                                                                                firstTimepoint={_self.props.timepoints[i]}
                                                                                secondTimepoint={_self.props.timepoints[i + 1]}
                                                                                firstPrimary={_self.getFullPrimary(_self.props.timepoints[i])}
                                                                                secondPrimary={_self.getFullPrimary(_self.props.timepoints[i + 1])}
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

    getGlobalTransitions() {
        let transitions = [];
        let stepWidth = 1;
        let start = 1;
        if (this.props.transitionOn) {
            stepWidth = 2;
            start = 3;
        }
        let counter = 0;
        for (let i = start; i < this.props.timepoints.length; i += stepWidth) {
            let from = this.props.timepoints[i - stepWidth].patients;
            let to = this.props.timepoints[i].patients;
            transitions.push(
                <GlobalTransition
                                    key={i}
                                    from={from}
                                  to={to}
                                  timeScale={this.props.timeScale}
                                  patientScale={this.props.heatmapScales[0]}
                                  allYPositionsy1={this.props.allYPositions[counter]}
                                  allYPositionsy2={this.props.allYPositions[counter + 1]}
                                  max={this.props.max}
                                  selectedPatients={this.props.selectedPatients}
                                  showTooltip={this.props.showTooltip}
                                  hideTooltip={this.props.hideTooltip}
                                  visMap={this.props.visMap}/>
            );
            counter++;

        }
        return transitions;
    }


    render() {
        if (this.props.store.globalTime) {
            return (
                this.getGlobalTransitions()
            )
        } else {

            return (
                this.getBlockTransitions()
            )
        }


    }
});
export default Transitions;