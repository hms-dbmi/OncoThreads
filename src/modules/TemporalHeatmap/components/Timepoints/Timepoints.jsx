import React from 'react';
import {observer} from 'mobx-react';
import Timepoint from "./Timepoint"
/*
creates the timepoints (either sampleTimepoints or betweenTimepoints)
 */
const Timepoints = observer(class Timepoints extends React.Component {

    getTimepoints() {
        const _self = this;
        let timepoints = [];
        this.props.timepoints.forEach(function (d, i) {
            let rectWidth;
            //check the type of the timepoint to get the correct list of currentVariables and the correct width of the heatmap rectangles
            if (_self.props.timepoints[i].type === "between") {
                rectWidth = _self.props.visMap.betweenRectWidth;
            }
            else {
                rectWidth = _self.props.visMap.sampleRectWidth;
            }

            const transform = "translate(0," + _self.props.yPositions[i] + ")";
            if (d.heatmap.length > 0) {
                timepoints.push(<g key={i + "timepoint"} transform={transform}><Timepoint timepoint={d} index={i}
                                                                                          currentVariables={_self.props.store.variableStore[d.type].currentVariables}
                                                                                          eventStartEnd={d.rootStore.betweenTimepointStore.sampleEventList}
                                                                                          rectWidth={rectWidth}
                                                                                          max={_self.props.max}
                                                                                          width={_self.props.heatmapWidth}
                                                                                          store={_self.props.store}
                                                                                          visMap={_self.props.visMap}
                                                                                          groupScale={_self.props.groupScale}
                                                                                          heatmapScale={_self.props.heatmapScales[i]}
                                                                                          onDrag={_self.props.onDrag}
                                                                                          selectPartition={_self.props.selectPartition}
                                                                                          selectedPatients={_self.props.selectedPatients}
                                                                                          translateGroupX={_self.props.translateGroupX}
                                                                                          showTooltip={_self.props.showTooltip}
                                                                                          hideTooltip={_self.props.hideTooltip}
                                                                                          showContextMenu={_self.props.showContextMenu}
                                                                                          hideContextMenu={_self.props.hideContextMenu}
                                                                                          showContextMenuHeatmapRow={_self.props.showContextMenuHeatmapRow}
                                                                                          />
                </g>);
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
                rectWidth = _self.props.visMap.betweenRectWidth;
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


            let yp = _self.props.allYPositions[i].map(y => y * 700.0 / max); //.map(x=>x.timeGapBetweenSample);

            let ht = yp.map(d => _self.props.visMap.primaryHeight);

            if (d.heatmap.length > 0) {

                let heatmapd = d;
                let heatmapi = i;

                timepoints.push(<g key={heatmapi + "timepoint" + globalIndex}><Timepoint timepoint={heatmapd}
                                                                                         index={heatmapi}
                                                                                         ypi={yp}
                                                                                         ht={ht}
                                                                                         max={_self.props.max}
                                                                                         numEventsForEachPatient={numEventsForEachPatient}
                                                                                         eventStartEnd={d.rootStore.betweenTimepointStore.sampleEventList}
                                                                                         currentVariables={_self.props.store.currentVariables[heatmapd.type]}
                                                                                         rectWidth={rectWidth}
                                                                                         width={_self.props.heatmapWidth}
                                                                                         store={_self.props.store}
                                                                                         visMap={_self.props.visMap}
                                                                                         groupScale={_self.props.groupScale}
                                                                                         heatmapScale={_self.props.heatmapScales[heatmapi]}
                                                                                         onDrag={_self.props.onDrag}
                                                                                         selectedPatients={_self.props.selectedPatients}
                                                                                         showTooltip={_self.props.showTooltip}
                                                                                         hideTooltip={_self.props.hideTooltip}/>
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


            let transFlag=false;

            //if(_self.props.timepoints[i].primaryVariable.datatype!=="NUMBER"){
            //check the type of the timepoint to get the correct list of currentVariables and the correct width of the heatmap rectangles
            if (_self.props.timepoints[i].type === "between") {

                transFlag=true;
                  //  return timepoints;
                //}
                    rectWidth = _self.props.visMap.betweenRectWidth;
                    let k;
                    if (flag) {
                        k = a.filter(d => d.time === Math.floor(i / 2));
                    }
                    else {
                        k = a.filter(d => d.time === Math.floor(i));
                    }
                    k.sort((p1, p2) => _self.comparePatientOrder(p, p1, p2));
                    yp = k.map(d => d.eventDate * 700.0 / max);


                    //console.log(yp);

                    ht = k.map(d => (d.eventEndDate - d.eventDate) * 700 / max + _self.props.visMap.primaryHeight/2);

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
                transFlag=false;
                rectWidth = _self.props.visMap.sampleRectWidth;
                yp = _self.props.allYPositions[Math.floor(i / 2)].map(y => y * 700.0 / max);

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

                if(!transFlag){
                    timepoints.push(<g key={heatmapi + "timepoint" + globalIndex} transform={transform}><Timepoint
                        timepoint={heatmapd} 
                        index={heatmapi}
                        ypi={yp}
                        ht={ht}
                        max={_self.props.max}
                        numEventsForEachPatient={numEventsForEachPatient}
                        eventStartEnd={d.rootStore.betweenTimepointStore.sampleEventList}
                        currentVariables={_self.props.store.currentVariables[heatmapd.type]}
                        rectWidth={rectWidth}
                        width={_self.props.heatmapWidth}
                        store={_self.props.store}
                        visMap={_self.props.visMap}
                        groupScale={_self.props.groupScale}
                        heatmapScale={_self.props.heatmapScales[heatmapi]}
                        onDrag={_self.props.onDrag}
                        selectedPatients={_self.props.selectedPatients}
                        showTooltip={_self.props.showTooltip}
                        hideTooltip={_self.props.hideTooltip}/>
                    </g>);
                }
                else{

                    timepoints.unshift(<g key={heatmapi + "timepoint" + globalIndex} transform={transform}><Timepoint
                        timepoint={heatmapd} 
                        index={heatmapi}
                        ypi={yp}
                        ht={ht}
                        max={_self.props.max}
                        numEventsForEachPatient={numEventsForEachPatient}
                        eventStartEnd={d.rootStore.betweenTimepointStore.sampleEventList}
                        currentVariables={_self.props.store.currentVariables[heatmapd.type]}
                        rectWidth={rectWidth}
                        width={_self.props.heatmapWidth}
                        store={_self.props.store}
                        visMap={_self.props.visMap}
                        groupScale={_self.props.groupScale}
                        heatmapScale={_self.props.heatmapScales[heatmapi]}
                        onDrag={_self.props.onDrag}
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
        if (this.props.store.rootStore.transitionOn && this.props.store.rootStore.globalTime) {
            return (
                this.getTreatmentTimepoints()
            )
        }

        else if (this.props.store.rootStore.globalTime) {
            return (
                this.getGlobalTimepoints()
            )
        }
        else {
            return (
                this.getTimepoints()
            )
        }


    }
});
export default Timepoints;