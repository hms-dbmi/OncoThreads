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
        this.props.timepoints.forEach(function (d, i) {
            let rectWidth;
            //check the type of the timepoint to get the correct list of currentVariables and the correct width of the heatmap rectangles
            if (_self.props.timepoints[i].type === "between") {
                rectWidth = _self.props.visMap.sampleRectWidth/2;
            }
            else {
                rectWidth = _self.props.visMap.sampleRectWidth;
            }

            const transform = "translate(0," + _self.props.yPositions[i] + ")";
            if (d.heatmap.length > 0) {
                if (d.isGrouped) {
                    timepoints.push(<g key={i + "timepoint"} transform={transform}><GroupTimepoint
                        timepoint={d.grouped}
                        index={i}
                        currentVariables={_self.props.store.variableStore[d.type].currentVariables}
                        rectWidth={rectWidth}
                        width={_self.props.heatmapWidth}
                        store={_self.props.store}
                        visMap={_self.props.visMap}
                        groupScale={_self.props.groupScale}
                        selectPartition={_self.props.selectPartition}
                        selectedPatients={_self.props.selectedPatients}
                        advancedSelection={_self.props.store.advancedSelection}
                        showTooltip={_self.props.showTooltip}
                        hideTooltip={_self.props.hideTooltip}
                        primaryVariableId={d.primaryVariableId}/></g>)
                }
                else {
                    timepoints.push(<g key={i + "timepoint"} transform={transform}>
                        <HeatmapTimepoint
                            timepoint={d.heatmap}
                            index={i}
                            currentVariables={_self.props.store.variableStore[d.type].currentVariables}
                            rectWidth={rectWidth}
                            width={_self.props.heatmapWidth}
                            store={_self.props.store}
                            visMap={_self.props.visMap}
                            heatmapScale={_self.props.heatmapScales[i]}
                            onDrag={_self.props.onDrag}
                            selectedPatients={_self.props.selectedPatients}
                            showTooltip={_self.props.showTooltip}
                            hideTooltip={_self.props.hideTooltip}
                            primaryVariableId={d.primaryVariableId}
                            showContextMenuHeatmapRow={_self.props.showContextMenuHeatmapRow}
                        /></g>)

                }
            }


        });
        return timepoints;
    }


    getGlobalTimepoints() {
        const _self = this;
        let timepoints = [];


        let a = _self.props.store.rootStore.eventDetails;

        let b = a.filter(d => d.eventDate);
        let c = b.map(d => d.eventDate);


        let max1 = Math.max(...c);


        let max2 = _self.props.allYPositions
            .map(yPositions => yPositions.reduce((next, max) => next > max ? next : max, 0))
            .reduce((next, max) => next > max ? next : max, 0);

        const max = Math.max(max1, max2);

        _self.props.store.rootStore.maxTimeInDays = max;

        let globalIndex = 0;

        this.props.timepoints.forEach(function (d, i) {
            let rectWidth;
            //check the type of the timepoint to get the correct list of currentVariables and the correct width of the heatmap rectangles
            if (_self.props.timepoints[i].type === "between") {
                rectWidth = _self.props.visMap.sampleRectWidth/2;
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


            let yp = _self.props.allYPositions[i]; //.map(x=>x.timeGapBetweenSample);

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
                    currentVariables={_self.props.store.currentVariables[d.type]}
                    rectWidth={rectWidth}
                    selectPatient={_self.props.onDrag}
                    width={_self.props.heatmapWidth}
                    store={_self.props.store}
                    visMap={_self.props.visMap}
                    heatmapScale={_self.props.heatmapScales[0]}
                    selectedPatients={_self.props.selectedPatients}
                    showTooltip={_self.props.showTooltip}
                    hideTooltip={_self.props.hideTooltip}
                    primaryVariableId={d.primaryVariableId}
                    />
                </g>);
                globalIndex++;
            }


        });
        return timepoints;
    }

    comparePatientOrder(order, p, q) {
        return order.indexOf(p.patientId) < order.indexOf(q.patientId) ? -1 : 1;
    }

    getTreatmentTimepoints() {
        const _self = this;
        let timepoints = [];


        let a = _self.props.store.rootStore.eventDetails;

        let b = a.filter(d => d.eventEndDate);
        let c = b.map(d => d.eventEndDate);


        let max1 = Math.max(...c);


        let max2 = _self.props.allYPositions
            .map(yPositions => yPositions.reduce((next, max) => next > max ? next : max, 0))
            .reduce((next, max) => next > max ? next : max, 0);

        const max = Math.max(max1, max2);

        _self.props.store.rootStore.maxTimeInDays = max;

        let globalIndex = 0;

        this.props.timepoints.forEach(function (d, i) {
            let rectWidth;
            let yp, count, ht;

            let transform;

            let numEventsForEachPatient = [];

            //var sampleEventLengthForThisTimeLine=[];

            let p = _self.props.store.rootStore.patientOrderPerTimepoint;

            let flag = false;

            _self.props.timepoints.forEach(function (d) {
                if (d.type !== "between") flag = true;
            });


            let transFlag = false;

            //if(_self.props.timepoints[i].primaryVariable.datatype!=="NUMBER"){
            //check the type of the timepoint to get the correct list of currentVariables and the correct width of the heatmap rectangles
            if (_self.props.timepoints[i].type === "between") {

                transFlag = true;
                //  return timepoints;
                //}
                rectWidth = _self.props.visMap.sampleRectWidth/2;
                let k;
                if (flag) {
                    k = a.filter(d => d.time === Math.floor(i / 2));
                }
                else {
                    k = a.filter(d => d.time === Math.floor(i));
                }
                k.sort((p1, p2) => _self.comparePatientOrder(p, p1, p2));
                yp = k.map(d => d.eventDate);


                //console.log(yp);

                ht = k.map(d => d.eventEndDate - d.eventDate);

                //ht = k.map(d => (d.eventEndDate - d.eventDate) * 700 / max + _self.props.visMap.primaryHeight);

                transform = "translate(0, 0)";


                count = 0;
                k = Object.values(k);

                p.forEach(function (d1, j) {
                    k.forEach(function (l) {
                        //console.log(p);

                        if (l.patientId === p[j]) {
                            count++;
                        }
                    });

                    numEventsForEachPatient.push(count);

                    count = 0;

                });

                //arr;
            }


            else {
                transFlag = false;
                rectWidth = _self.props.visMap.sampleRectWidth;
                yp = _self.props.allYPositions[Math.floor(i / 2)];
                ht = yp.map(d => 0);
                //transform= "translate(0, 350)";
                transform = "translate(0, 0)";


                //p=_self.props.store.rootStore.patientOrderPerTimepoint;
                p.forEach(function (d1, j) {
                    count = 1;

                    numEventsForEachPatient.push(count);

                    //count=0;

                });


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
                            currentVariables={_self.props.store.currentVariables[heatmapd.type]}
                            rectWidth={rectWidth}
                            selectPatient={_self.props.onDrag}
                            width={_self.props.heatmapWidth}
                            store={_self.props.store}
                            visMap={_self.props.visMap}
                            heatmapScale={_self.props.heatmapScales[0]}
                            selectedPatients={_self.props.selectedPatients}
                            showTooltip={_self.props.showTooltip}
                            hideTooltip={_self.props.hideTooltip}/>
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
                            currentVariables={_self.props.store.currentVariables[heatmapd.type]}
                            rectWidth={rectWidth}
                            selectPatient={_self.props.onDrag}
                            width={_self.props.heatmapWidth}
                            store={_self.props.store}
                            visMap={_self.props.visMap}
                            heatmapScale={_self.props.heatmapScales[0]}
                            selectedPatients={_self.props.selectedPatients}
                            showTooltip={_self.props.showTooltip}
                            hideTooltip={_self.props.hideTooltip}/>
                    </g>);
                }


                globalIndex++;
            }


            //}
        });

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