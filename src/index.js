/**
 * Created by theresa on 30.01.18.
 */
import React from "react";
import ReactDOM from "react-dom";
import {observer} from 'mobx-react';
import cBioAPI from "./cBioAPI.jsx";
import RootStore from "./modules/RootStore.jsx";

import ChooseSankeyCategory from "./modules/Sankey/components/ChooseSankeyCategory.jsx";
import ChooseEvent from "./modules/Timeline/components/ChooseEvent.jsx";
import GetStudy from "./modules/GetStudy.jsx";

import SankeyDiagram from "./modules/Sankey/components/SankeyDiagram.jsx";
import FirstChart from "./modules/Timeline/components/FirstChart.jsx";
import MultipleHist from "./modules/Histogram/components/MultipleHist.jsx"
import Summary from "./modules/Summary/components/Summary.jsx";
import StackedBarChart from "./modules/StackedBar/components/StackedBarChart";



const cbioAPI = new cBioAPI();
const rootStore = new RootStore(cbioAPI);


const StudySelection = observer(class StudySelection extends React.Component {
    render() {
        return (
            <div>
                <h1> Test Visualizations</h1>
                <GetStudy rootStore={rootStore}/>
            </div>
        )
    }
});
const SummarizeData = observer(class SummarizeData extends React.Component {
    render() {
        if (rootStore.parsed) {
            return (
                <div>
                    <h3>Summary of the Data</h3>
                    <div className="bottom-right-svg">
                        <Summary data={rootStore.summaryStore}/>
                    </div>
                </div>
            )
        }
        else return null;

    }


});
const Sk = observer(class Sk extends React.Component {
    render() {
        if (rootStore.parsed) {
            return (
                <div>
                    <h3>Sankey diagram</h3>
                    <div className="bottom-right-svg">
                        <ChooseSankeyCategory sankeyStore={rootStore.sankeyStore}/>
                        <SankeyDiagram id="sankeyDiagram" data={rootStore.sankeyStore.currentSankeyData}/>
                    </div>
                </div>
            )
        }
        else return null;
    }

});
const Tl = observer(class Tl extends React.Component {
    render() {
        if (rootStore.parsed) {
            return (
                <div>
                    <h3>Timeline</h3>
                    <div className="bottom-right-svg">
                        <ChooseEvent eventStore={rootStore.eventStore}/>
                        <FirstChart eventStore={rootStore.eventStore} currentEvents={rootStore.eventStore.currentEvents}
                                    patientAttributes={rootStore.eventStore.patientAttributes}
                                    patientAttributeCategories={rootStore.eventStore.patientAttributeCategories}
                                    sampleEvents={rootStore.eventStore.sampleEvents}/>
                    </div>
                </div>
            )
        }
        else return (
            null
        )
    }
});
const Histograms = observer(class Histograms extends React.Component {
    render() {
        if (rootStore.parsed) {
            return (
                <div>
                    <h3>Histograms of Mutation Counts</h3>
                    <div className="bottom-right-svg">
                        <MultipleHist id="histograms"
                                      data={[rootStore.mutationCountStore.PriHistogramData, rootStore.mutationCountStore.RecHistogramData]}/>
                    </div>
                </div>
            )
        }
        else return null;
    }

});


const StackedBars = observer(class StackedBars extends React.Component {
    render() {
        if(rootStore.parsed) {
            return (
                <div>
                    <h3>Stacked bar charts</h3>
                    <div className="stacked-svg">
                        <StackedBarChart id="stacked-bar-chart"
                            singlestudydata={rootStore.stackedBarChartStore.patients}
                            patientdata={rootStore.stackedBarChartStore.clinicalEvents}
                            clinicalData={rootStore.stackedBarChartStore.clinicalPatientData}
                        />
                    </div>
                </div>
            )
        }
        else return null;
    }

});

ReactDOM.render(<StackedBars/>, document.getElementById("stacked-bar-chart"));
ReactDOM.render(<StudySelection/>, document.getElementById("choosedata"));
ReactDOM.render(<SummarizeData/>, document.getElementById("summary"));
ReactDOM.render(<Tl/>, document.getElementById("timeline"));
ReactDOM.render(<Sk/>, document.getElementById("top-line-chart"));
ReactDOM.render(<Histograms/>, document.getElementById("hist"));
