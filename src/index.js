/**
 * Created by theresa on 30.01.18.
 */
import React from "react";
import ReactDOM from "react-dom";
import {observer} from 'mobx-react';
import cBioAPI from "./cBioAPI.jsx";
import studyAPI from "./studyAPI.jsx";
import RootStore from "./modules/RootStore.jsx";

import GetStudy from "./modules/GetStudy.jsx";
import Content from "./modules/TemporalHeatmap/components/Content"
import DefaultView from "./modules/TemporalHeatmap/components/DefaultView";


const cbioAPI = new cBioAPI();
const studyapi = new studyAPI();
let rootStore = new RootStore(cbioAPI, true);
studyapi.getStudies();

const StudySelection = observer(class StudySelection extends React.Component {
    render() {
        if (rootStore.parsed) {
            return (
                <GetStudy rootStore={rootStore} cbioAPI={cbioAPI} studies={studyapi.studies}/>
            )
        }
        else {
            return null;
        }
    }
});
const Main = observer(class Main extends React.Component {
    render() {
        if (rootStore.parsed) {
            return (
                <Content rootStore={rootStore}/>
            )
        }
        else {
            if (rootStore.firstLoad) {
                return (
                    <DefaultView rootStore={rootStore} cbioAPI={cbioAPI} studies={studyapi.studies}/>
                )
            }
            else {
                return (
                    <h1 className="defaultView">Loading study...</h1>
                )
            }
        }
    }
});

ReactDOM.render(<StudySelection/>, document.getElementById("choosedata"));
ReactDOM.render(<Main/>, document.getElementById("content"));


