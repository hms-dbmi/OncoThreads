/**
 * Created by theresa on 30.01.18.
 */
import React from "react";
import ReactDOM from "react-dom";
import cBioAPI from "./cBioAPI.jsx";
import studyAPI from "./studyAPI.jsx";

import App from "./modules/TemporalHeatmap/components/App.jsx";


const studyapi = new studyAPI();
const cbioAPI=new cBioAPI();

ReactDOM.render(<App studyapi={studyapi} cbioAPI={cbioAPI} parsed="false" firstload="false"/>, document.getElementById("app"));


