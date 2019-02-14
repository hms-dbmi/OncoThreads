import React from 'react';
import {observer} from 'mobx-react';
import TimelineTimepoint from "./GlobalTimeline/TimelineTimepoint";
import HeatmapTimepoint from "./Heatmap/HeatmapTimepoint";
import GroupTimepoint from "./Group/GroupTimepoint";

/*
creates the timepoints (either sampleTimepoints or betweenTimepoints)
 */
const Timepoints = observer(class Timepoints extends React.Component {

    getBlockTimepoints() {
        const _self = this;
        let timepoints = [];
        this.props.store.timepoints.forEach(function (d, i) {
            let rectWidth;
            //check the type of the timepoint to get the correct width of the heatmap rectangles
            if (d.type === "between") {
                rectWidth = _self.props.visMap.sampleRectWidth / 2;
            }
            else {
                rectWidth = _self.props.visMap.sampleRectWidth;
            }

            const transform = "translate(0," + _self.props.visMap.timepointPositions.timepoint[i] + ")";
            if (d.heatmap.length > 0) {
                if (d.isGrouped) {
                    timepoints.push(<g key={i + "timepoint"} transform={transform}><GroupTimepoint
                        visMap={_self.props.visMap}
                        store={_self.props.store}
                        timepoint={d.grouped}
                        heatmap={d.heatmap}
                        index={i}
                        currentVariables={_self.props.store.variableStores[d.type].fullCurrentVariables}
                        rectWidth={rectWidth}
                        groupScale={_self.props.groupScale}
                        tooltipFunctions={_self.props.tooltipFunctions}
                        primaryVariableId={d.primaryVariableId}/></g>)
                }
                else {
                    timepoints.push(<g key={i + "timepoint"} transform={transform}>
                        <HeatmapTimepoint
                            visMap={_self.props.visMap}
                            store={_self.props.store}
                            tooltipFunctions={_self.props.tooltipFunctions}
                            showContextMenuHeatmapRow={_self.props.showContextMenuHeatmapRow}
                            xOffset={(_self.props.visMap.sampleRectWidth - rectWidth) / 2}
                            rectWidth={rectWidth}
                            timepoint={d.heatmap}
                            index={i}
                            currentVariables={_self.props.store.variableStores[d.type].fullCurrentVariables}
                            heatmapScale={_self.props.heatmapScales[i]}
                            primaryVariableId={d.primaryVariableId}
                        /></g>)

                }
            }


        });
        return timepoints;
    }


    getGlobalTimepoints() {
        const _self = this;
        var timepoints = [];


        let globalIndex = 0;

        this.props.store.timepoints.forEach(function (d, i) {
            let rectWidth;
            //check the type of the timepoint to get the correct list of currentVariables and the correct width of the heatmap rectangles
            if (d.type === "between") {
                rectWidth = _self.props.visMap.sampleRectWidth / 2;
            }
            else {
                rectWidth = _self.props.visMap.sampleRectWidth;
            }


            let numEventsForEachPatient = [], count;
            let p = _self.props.store.rootStore.patientOrderPerTimepoint;

            p.forEach(function (d1) {
                count = 1;

                numEventsForEachPatient.push(count);

            });


            let yp = _self.props.store.rootStore.actualTimeLine[i]; //.map(x=>x.timeGapBetweenSample);

            let ht = yp.map(d => 0);

            if (d.heatmap.length > 0) {
                timepoints.push(<g key={i + "timepoint" + globalIndex}><TimelineTimepoint
                    timepoint={d.heatmap}
                    timepointType={d.type}
                    primaryVariable={d.primaryVariable}
                    index={i}
                    ypi={yp}
                    ht={ht}
                    timeScale={_self.props.timeScale}
                    numEventsForEachPatient={numEventsForEachPatient}
                    currentVariables={_self.props.store.variableStores[d.type].fullCurrentVariables}
                    rectWidth={rectWidth}
                    store={_self.props.store}
                    visMap={_self.props.visMap}
                    heatmapScale={_self.props.heatmapScales[0]}
                    {..._self.props.tooltipFunctions}
                    primaryVariableId={d.primaryVariableId}
                />
                </g>);
                globalIndex++;
            }


        });

        /*
        let rectWidth;
        //check the type of the timepoint to get the correct list of currentVariables and the correct width of the heatmap rectangles
        //if (_self.props.store.timepoints[i].type === "between") {
        //  rectWidth = _self.props.visMap.sampleRectWidth / 2;
        //}
        //else {
        rectWidth = _self.props.visMap.sampleRectWidth;
        //}


        let numEventsForEachPatient = [], count;
        let p = _self.props.store.rootStore.patientOrderPerTimepoint;

        p.forEach(function (d1) {
            count = 1;

            numEventsForEachPatient.push(count);

        });


        var tod = [];
        _self.props.store.rootStore.patientOrderPerTimepoint.forEach(function (d) {
            var k;
            //if(_self.props.store.rootStore.staticMappers["OS_STATUS"][d+"_Pri"] && _self.props.store.rootStore.staticMappers["OS_STATUS"][d+"_Pri"]==="DECEASED"){
            //if(_self.props.store.rootStore.staticMappers["OS_STATUS"][d+"_Pri"]){  
            if (_self.props.store.rootStore.staticMappers["OS_MONTHS"]) {
                k = _self.props.store.rootStore.staticMappers["OS_MONTHS"][d + "_Pri"] * 30;
                tod.push(k);
            }

            //}


        });

        //let yp = _self.props.allYPositions[0]; //.map(x=>x.timeGapBetweenSample);

        let ht = tod.map(d => 0);

        //let i=this.props.store.timepoints.length;

        //if (d.heatmap.length > 0) {
        timepoints.push(<g key={this.props.store.timepoints.length + "timepoint" + globalIndex}><TimelineTimepoint
            timepoint={this.props.store.timepoints[0].heatmap}
            timepointType={this.props.store.timepoints[0].type}
            primaryVariable={this.props.store.timepoints[0].primaryVariable}
            index={this.props.store.timepoints.length}
            ypi={tod}
            ht={ht}
            timeScale={_self.props.timeScale}
            numEventsForEachPatient={numEventsForEachPatient}
            currentVariables={_self.props.store.variableStores[this.props.store.timepoints[0].type].fullCurrentVariables}
            rectWidth={rectWidth}
            store={_self.props.store}
            visMap={_self.props.visMap}
            heatmapScale={_self.props.heatmapScales[0]}
            {..._self.props.tooltipFunctions}
            primaryVariableId={this.props.store.timepoints[0].primaryVariableId}
        />
        </g>);
        globalIndex++;
        //}
        */
        return timepoints;
    }


    getTreatmentTimepoints() {
        const _self = this;
        let timepoints = [];


        let globalIndex = 0;

        //var timepoint_sample, heatmapScale_sample, ind_sample;

        this.props.store.timepoints.forEach(function (d, i) {
            let rectWidth;
            let yp, count, ht;

            let transform;

            let numEventsForEachPatient = [];

            //var sampleEventLengthForThisTimeLine=[];

            let p = _self.props.store.rootStore.patientOrderPerTimepoint;


            let transFlag = false;

            //if(_self.props.store.timepoints[i].primaryVariable.datatype!=="NUMBER"){
            //check the type of the timepoint to get the correct list of currentVariables and the correct width of the heatmap rectangles
            if (_self.props.store.timepoints[i].type === "between") {

                transFlag = true;
                //  return timepoints;
                //}
                rectWidth = _self.props.visMap.sampleRectWidth / 2;


                //ht = k.map(d => (d.eventEndDate - d.eventDate) * 700 / max + _self.props.visMap.primaryHeight);

                transform = "translate(0, 0)";


                //arr;
            }


            else {
                transFlag = false;
                rectWidth = _self.props.visMap.sampleRectWidth;
                yp = _self.props.store.rootStore.actualTimeLine[Math.floor(i / 2)];
                ht = yp.map(d => 0);
                //transform= "translate(0, 350)";
                transform = "translate(0, 0)";


                //p=_self.props.store.rootStore.patientOrderPerTimepoint;
                p.forEach(function (d1, j) {
                    count = 1;

                    numEventsForEachPatient.push(count);

                    //count=0;

                });

                //timepoint_sample=d;
                //ind_sample=i;
                //heatmapScale_sample=_self.props.heatmapScales[i];
            }

            //var yp=_self.props.allYPositions[i].map(y => y*700.0/max); //.map(x=>x.timeGapBetweenSample);


            if (d.heatmap.length > 0) {

                let heatmapd = d;
                let heatmapi = i;

                if (!transFlag) {
                    timepoints.push(<g key={heatmapi + "timepoint" + globalIndex} transform={transform}>
                        <TimelineTimepoint
                            timepoint={d.heatmap}
                            timepointType={d.type}
                            primaryVariable={d.primaryVariable} index={heatmapi}
                            ypi={yp}
                            ht={ht}
                            timeScale={_self.props.timeScale}
                            numEventsForEachPatient={numEventsForEachPatient}
                            currentVariables={_self.props.store.variableStores[heatmapd.type].fullCurrentVariables}
                            rectWidth={rectWidth}
                            store={_self.props.store}
                            visMap={_self.props.visMap}
                            heatmapScale={_self.props.heatmapScales[0]}
                            {..._self.props.tooltipFunctions}/>
                    </g>);
                }
                else {
                    timepoints.unshift(<g key={heatmapi + "timepoint" + globalIndex} transform={transform}>
                        <TimelineTimepoint
                            timepoint={d.heatmap}
                            timepointType={d.type}
                            primaryVariable={d.primaryVariable} index={heatmapi}
                            ypi={yp}
                            ht={ht}
                            timeScale={_self.props.timeScale}
                            numEventsForEachPatient={numEventsForEachPatient}
                            currentVariables={_self.props.store.variableStores[heatmapd.type].fullCurrentVariables}
                            rectWidth={rectWidth}
                            width={_self.props.heatmapWidth}
                            store={_self.props.store}
                            visMap={_self.props.visMap}
                            heatmapScale={_self.props.heatmapScales[0]}
                            {..._self.props.tooltipFunctions}/>
                    </g>);
                }


                globalIndex++;
            }


            //}
        });


        //new code for time of death

        /*
        let rectWidth;
        let count, ht;

        let transform;

        let numEventsForEachPatient = [];

        //var sampleEventLengthForThisTimeLine=[];

        let p = _self.props.store.rootStore.patientOrderPerTimepoint;


        var tod = [];
        let transFlag = false;

        //if(_self.props.store.timepoints[i].primaryVariable.datatype!=="NUMBER"){
        //check the type of the timepoint to get the correct list of currentVariables and the correct width of the heatmap rectangles


        //else {
        transFlag = false;
        rectWidth = _self.props.visMap.sampleRectWidth;
        //yp = _self.props.allYPositions[Math.floor(i / 2)];
        //ht = yp.map(d => 0);
        //transform= "translate(0, 350)";
        transform = "translate(0, 0)";


        //p=_self.props.store.rootStore.patientOrderPerTimepoint;
        p.forEach(function (d1, j) {
            count = 1;

            numEventsForEachPatient.push(count);

            //count=0;

        });


        _self.props.store.rootStore.patientOrderPerTimepoint.forEach(function (d) {
            var k;
            //if(_self.props.store.rootStore.staticMappers["OS_STATUS"][d+"_Pri"] && _self.props.store.rootStore.staticMappers["OS_STATUS"][d+"_Pri"]==="DECEASED"){
            if (_self.props.store.rootStore.staticMappers["OS_STATUS"][d + "_Pri"]) {
                k = _self.props.store.rootStore.staticMappers["OS_MONTHS"][d + "_Pri"] * 30;
                tod.push(k);
            }
            else {
                k = -1;
                tod.push(k);
            }

        });

        //let yp = _self.props.allYPositions[0]; //.map(x=>x.timeGapBetweenSample);

        ht = tod.map(d => 0);


        let d = _self.props.store.timepoints[1];
        let i = this.props.store.timepoints.length;
        if (d.heatmap.length > 0) {

            let heatmapd = d;
            let heatmapi = i;

            if (!transFlag) {
                timepoints.push(<g key={heatmapi + "timepoint" + globalIndex} transform={transform}>
                    <TimelineTimepoint
                        timepoint={d.heatmap}
                        timepointType={d.type}
                        primaryVariable={d.primaryVariable}
                        index={_self.props.store.timepoints.length}
                        //index={heatmapi}
                        ypi={tod}
                        ht={ht}
                        timeScale={_self.props.timeScale}
                        numEventsForEachPatient={numEventsForEachPatient}
                        currentVariables={_self.props.store.variableStores[heatmapd.type].fullCurrentVariables}
                        rectWidth={rectWidth}
                        store={_self.props.store}
                        visMap={_self.props.visMap}
                        heatmapScale={_self.props.heatmapScales[0]}
                        {..._self.props.tooltipFunctions}/>
                </g>);
            }
            else {
                timepoints.unshift(<g key={heatmapi + "timepoint" + globalIndex} transform={transform}>
                    <TimelineTimepoint
                        timepoint={d.heatmap}
                        timepointType={d.type}
                        primaryVariable={d.primaryVariable} //index={heatmapi}
                        index={_self.props.store.timepoints.length}
                        ypi={tod}
                        ht={ht}
                        timeScale={_self.props.timeScale}
                        numEventsForEachPatient={numEventsForEachPatient}
                        currentVariables={_self.props.store.variableStores[heatmapd.type].fullCurrentVariables}
                        rectWidth={rectWidth}
                        store={_self.props.store}
                        visMap={_self.props.visMap}
                        heatmapScale={_self.props.heatmapScales[0]}
                        {..._self.props.tooltipFunctions}/>
                </g>);
            }


            globalIndex++;
        }
        */


        return timepoints;
    }


    render() {
        if (this.props.store.transitionOn && this.props.store.globalTime) {
            return (
                this.getTreatmentTimepoints()
            )
        }

        else if (this.props.store.globalTime) {
            return (
                this.getGlobalTimepoints()
            )
        }
        else {
            return (
                this.getBlockTimepoints()
            )
        }


    }
});
export default Timepoints;