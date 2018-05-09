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


const cbioAPI = new cBioAPI();
const studyapi=new studyAPI();
let rootStore = new RootStore(cbioAPI);
studyapi.getStudies();

const StudySelection = observer(class StudySelection extends React.Component {
    render() {
        return (
                <GetStudy rootStore={rootStore} cbioAPI={cbioAPI} studies={studyapi.studies}/>
        )
    }
});
const Main = observer(class Main extends React.Component {
    render() {
        if (rootStore.parsed) {
            return (
                    <Content rootStore={rootStore}/>
            )
        }
        else return null;
    }
});

ReactDOM.render(<StudySelection/>, document.getElementById("choosedata"));
ReactDOM.render(<Main/>, document.getElementById("content"));


