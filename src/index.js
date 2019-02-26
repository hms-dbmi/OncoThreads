/**
 * Created by theresa on 30.01.18.
 */
import React from "react";
import ReactDOM from "react-dom";
import studyAPI from "./studyAPI.jsx";

import App from "./modules/TemporalHeatmap/components/App.jsx";
import RootStore from "./modules/RootStore";
import {Provider} from "mobx-react";
import UIStore from "./modules/TemporalHeatmap/UIStore";
import UndoRedoStore from "./modules/TemporalHeatmap/UndoRedoStore";


const rootStore = new RootStore();
const uiStore = new UIStore();
const undoRedoStore = new UndoRedoStore(rootStore, uiStore);
const studyapi=new studyAPI();
studyapi.getStudies();
ReactDOM.render(<Provider rootStore={rootStore} uiStore={uiStore} undoRedoStore={undoRedoStore}><App
    studyapi={studyapi} parsed="false"
    firstload="false"/></Provider>, document.getElementById("app"));


