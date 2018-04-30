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
let rootStore = new RootStore(cbioAPI);

const StudySelection = observer(class StudySelection extends React.Component {
    render() {
        return (
            <div>
                <h1>OncoThreads</h1>
                <GetStudy rootStore={rootStore} cbioAPI={cbioAPI}/>
            </div>
        )
    }
});
const HeatmapSelector = observer(class HeatmapSelector extends React.Component {
    render() {
        if (rootStore.parsed) {
            return (
                <div>
                    <div className="bottom-right-svg">
                        <SampleVariableSelector
                            clinicalSampleCategories={rootStore.clinicalSampleCategories}
                            mutationCount="Mutation count"
                            currentVariables={rootStore.timepointStore.currentVariables.sample}
                            store={rootStore.sampleTimepointStore}
                            visMap={rootStore.visStore}
                        />
                        <BetweenSampleVariableSelector
                            eventCategories={rootStore.eventCategories}
                            eventAttributes={rootStore.eventAttributes}
                            currentVariables={rootStore.timepointStore.currentVariables.between}
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
const Heatmap = observer(class Heatmap extends React.Component {
    render() {
        if (rootStore.parsed) {
            return (
                <div>
                    <div className="bottom-right-svg">
                        <MainView
                            currentVariables={rootStore.timepointStore.currentVariables}
                            timepoints={rootStore.timepointStore.timepoints}
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

