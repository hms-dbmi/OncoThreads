/**
 * Created by theresa on 30.01.18.
 */
import React from "react";
import ReactDOM from "react-dom";
import {observer} from 'mobx-react';
import cBioAPI from "./cBioAPI.jsx";
import RootStore from "./modules/RootStore.jsx";

import GetStudy from "./modules/GetStudy.jsx";

import SampleVariableSelector from "./modules/TemporalHeatmap/components/VariableSelector/SampleVariableSelector"
import BetweenSampleVariableSelector from "./modules/TemporalHeatmap/components/VariableSelector/BetweenSampleVariableSelector"

import MainView from "./modules/TemporalHeatmap/components/MainView"


const cbioAPI = new cBioAPI();
const rootStore = new RootStore(cbioAPI);


const StudySelection = observer(class StudySelection extends React.Component {
    render() {
        return (
            <div>
                <h1>OncoTracer</h1>
                <GetStudy rootStore={rootStore}/>
            </div>
        )
    }
});
const HeatmapSelector=observer(class HeatmapSelector extends React.Component{
    render() {
        if(rootStore.parsed) {
            return (
                <div>
                    <div className="bottom-right-svg">
                        <SampleVariableSelector
                            clinicalSampleCategories={rootStore.clinicalSampleCategories}
                            mutationCount="Mutation count"
                            currentVariables={rootStore.timepointStore.currentSampleVariables}
                            store={rootStore.sampleTimepointStore}
                            visMap={rootStore.visStore}
                        />
                        <BetweenSampleVariableSelector
                            eventCategories={rootStore.eventCategories}
                            eventAttributes={rootStore.eventAttributes}
                            currentVariables={rootStore.timepointStore.currentBetweenVariables}
                            store={rootStore.betweenTimepointStore}
                            visMap={rootStore.visStore}
                        />
                    </div>
                </div>
            )
        }
        else return null;
    }
});
const Heatmap=observer(class Heatmap extends React.Component{
    render() {
        if(rootStore.parsed) {
            return (
                <div>
                    <div className="bottom-right-svg">
                        <MainView
                            patientOrderPerTimepoint={rootStore.timepointStore.patientOrderPerTimepoint}
                            primaryVariables={rootStore.timepointStore.primaryVariables}
                            groupOrder={rootStore.timepointStore.groupOrder}
                            currentSampleVariables={rootStore.timepointStore.currentSampleVariables}
                            currentBetweenVariables={rootStore.timepointStore.currentBetweenVariables}
                            store={rootStore.timepointStore}
                            transitionStore={rootStore.transitionStore}
                            visMap={rootStore.visStore}
                        />
                    </div>
                </div>
            )
        }
        else return null;
    }
});

ReactDOM.render(<StudySelection/>, document.getElementById("choosedata"));
ReactDOM.render(<HeatmapSelector/>, document.getElementById("heatmapSelector"));
ReactDOM.render(<Heatmap/>, document.getElementById("heatmap"));

