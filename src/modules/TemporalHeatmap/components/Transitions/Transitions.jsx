import React from 'react';
import {observer} from 'mobx-react';
import Transition from './Transition'
import GlobalTransition from "./GlobalTransition";
/*
creates the transitions between timepoints
 */
const Transitions = observer(class Transitions extends React.Component {

    getFullPrimary(timepoint) {
        return this.props.store.variableStores[timepoint.type].getById(timepoint.primaryVariableId);
    }

    getBlockTransitions() {
        const _self = this;
        return (_self.props.transitionStore.transitionData.map(function (d, i) {
            const transform = "translate(0," + _self.props.visMap.timepointPositions.connection[i] + ")";
            return (<g key={i + "transition"} transform={transform}><Transition transition={d}
                                                                                index={i}
                                                                                firstTimepoint={_self.props.store.timepoints[i]}
                                                                                secondTimepoint={_self.props.store.timepoints[i + 1]}
                                                                                firstPrimary={_self.getFullPrimary(_self.props.store.timepoints[i])}
                                                                                secondPrimary={_self.getFullPrimary(_self.props.store.timepoints[i + 1])}
                                                                                groupScale={_self.props.groupScale}
                                                                                firstHeatmapScale={_self.props.heatmapScales[i]}
                                                                                secondHeatmapScale={_self.props.heatmapScales[i + 1]}
                                                                                {..._self.props.tooltipFunctions}
                                                                                visMap={_self.props.visMap}
                                                                                store={_self.props.store}/>
            </g>);

        }))
    }

    getGlobalTransitions() {
        let transitions = [];
        let stepWidth = 1;
        let start = 1;
        if (this.props.store.transitionOn) {
            stepWidth = 2;
            start = 3;
        }
        let counter = 0;
        for (let i = start; i < this.props.store.timepoints.length; i += stepWidth) {
            let from = this.props.store.timepoints[i - stepWidth].patients;
            let to = this.props.store.timepoints[i].patients;
            transitions.push(
                <GlobalTransition
                    key={i}
                    from={from}
                    to={to}
                    timeScale={this.props.timeScale}
                    patientScale={this.props.heatmapScales[0]}
                    allYPositionsy1={this.props.store.rootStore.actualTimeLine[counter]}
                    allYPositionsy2={this.props.store.rootStore.actualTimeLine[counter + 1]}
                    {...this.props.tooltipFunctions}
                    visMap={this.props.visMap}
                    store={this.props.store}/>
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