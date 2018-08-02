import React from 'react';
import {observer} from 'mobx-react';
/*
creats a row in the heatmap
 */
const TimelineRow = observer(class TimelineRow extends React.Component {
    constructor(props) {
        super(props);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(patient) {
        this.props.selectPatient(patient)
    }

    getRow() {
        let rects = [];
        const _self = this;
        let j = 0;

        let ht = _self.props.ht;

        let globalRectHeight;
        let globalRectWidth;


        let xGlobal;

        //var startDay, duration;

        //console.log(this.props.row.data);
        if (_self.props.timepointType === "between") {
            if (_self.props.dtype === "binary") {

                let fillC="#F00";

                
                _self.props.events.forEach(function (ev, j) {

                   

                    //if(fillC==="#F00"){
                      //  fillC = _self.props.color(ev.varId);
                    //}



                    _self.props.store.variableStore['between'].currentVariables.forEach(function(d){
                        if(d.originalIds.includes(ev.varId)){
                            //console.log(d.originalIds[0]);
                            fillC = _self.props.color(d.originalIds[0]);
                        }
                
                    })
                    let height=_self.props.timeScale(ev.eventEndDate-ev.eventDate);
                    if(height===0){
                        height=_self.props.rectWidth;
                    }
                    let val = _self.props.store.variableStore['between'].getByIdAllVariables(ev.varId).name;
                    rects.push(<rect onMouseEnter={(e) => _self.handleMouseEnter(e, ev.patientId, val, ev.eventDate, ev.eventEndDate - ev.eventDate)
                                     }
                                     onMouseLeave={_self.handleMouseLeave}
                                     onDoubleClick={() => _self.handleDoubleClick(ev.patientId)}
                                     onClick={() => _self.handleClick(ev.patientId)}
                            //onMouseDown={() => _self.handleMouseDown(d.patient)}
                            //onMouseUp={_self.handleMouseUp}
                                     key={ev.patientId + j}
                                     height={height}//{_self.props.height}
                                     width={_self.props.rectWidth}
                                     x={_self.props.heatmapScale(ev.patientId)}
                                     y={_self.props.timeScale(ev.eventDate)}
                                     //fill={_self.props.color(ev.varId)}

                                     fill={fillC}
                                     opacity={_self.props.opacity}
                            //fill={_self.props.color(_self.props.timepoint)}
                        />
                    );
                });
            }
        }
        else {
            this.props.row.data.forEach(function (d, i) {
                let stroke = "none";
                let fill = _self.props.color(d.value);
                if (d.value === undefined) {
                    stroke = "lightgray";
                    fill = "white";
                }
                if (_self.props.selectedPatients.includes(d.patient)) {
                    stroke = "black";
                }


                let startDay = _self.props.ypi[i];
                //let duration=Math.round((ht[j]-_self.props.visMap.primaryHeight/4)*_self.props.max/700);


                //let varName=_self.props.primaryVariable.name;

                var val = d.value;

                // globalRectHeight =ht[j];

                globalRectWidth = _self.props.rectWidth;
                //globalRectHeight= ht[j]/2;


                globalRectWidth = _self.props.rectWidth / 2;
                globalRectHeight = globalRectWidth;

                xGlobal = _self.props.heatmapScale(d.patient) + _self.props.x;

                let duration = ht[j];

                rects.push(<rect stroke={stroke}
                                 onMouseEnter={(e) => _self.handleMouseEnter(e, d.patient, val, startDay, duration)
                                 }
                                 onMouseLeave={_self.handleMouseLeave}
                                 onDoubleClick={() => _self.handleDoubleClick(d.patient)}
                                 onClick={() => _self.handleClick(d.patient)}
                                 key={d.patient + i + j}
                                 height={globalRectHeight}//{_self.props.height}
                                 width={globalRectWidth}
                                 x={xGlobal}
                                 y={_self.props.timeScale(_self.props.ypi[i])}
                                 fill={fill}
                                 opacity={_self.props.opacity}
                    />
                );
            });
        }
        return rects;
    }
                /*
                Array.from(Array(maxNum).keys()).forEach(function (ind) {
                    let startDay = _self.props.ypi[j];
                    //let duration=Math.round((ht[j]-_self.props.visMap.primaryHeight/4)*_self.props.max/700);


                    //let varName=_self.props.primaryVariable.name;

                    var val = d.value;

                    // globalRectHeight =ht[j];

                    globalRectWidth = _self.props.rectWidth;


                    if (_self.props.dtype === "binary") {
                        if (!eventIndices[d.patient]) {
                            eventIndices[d.patient] = 0;
                        }
                        if (_self.props.events.length > 0) {
                            //var eventHere=_self.props.events.filter(ev => ev.patientId===d.patient)[eventIndices[d.patient]].eventTypeDetailed;

                            var eventHere2 = _self.props.events.filter(ev => ev.patientId === d.patient);// [eventIndices[d.patient]].eventTypeDetailed;

                            if (eventHere2) {
                                var eventHere = eventHere2[eventIndices[d.patient]];
                                fill = _self.props.color(eventHere.varId);
                                eventIndices[d.patient] = eventIndices[d.patient] + 1;
                                val = _self.props.store.variableStore['between'].getByIdAllVariables(eventHere.varId).name;
                                if (eventHere.eventEndDate===eventHere.eventDate) {
                                    globalRectHeight = globalRectWidth;
                                }
                                else {
                                    globalRectHeight = _self.props.timeScale(eventHere.eventEndDate-eventHere.eventDate);
                                }

                                xGlobal = _self.props.heatmapScale(d.patient) + _self.props.x - _self.props.rectWidth / 2;

                                //let duration=Math.round((2*ht[j]-_self.props.visMap.primaryHeight)*_self.props.max/700);

                                let duration = ht[j];

                                //console.log(_self.props.ypi);
                                rects.push(<rect stroke={stroke}
                                                 onMouseEnter={(e) => _self.handleMouseEnter(e, d.patient, val, eventHere.eventDate, eventHere.eventEndDate-eventHere.eventDate)
                                                 }
                                                 onMouseLeave={_self.handleMouseLeave}
                                                 onDoubleClick={() => _self.handleDoubleClick(d.patient)}
                                                 onClick={() => _self.handleClick(d.patient)}
                                        //onMouseDown={() => _self.handleMouseDown(d.patient)}
                                        //onMouseUp={_self.handleMouseUp}
                                                 key={d.patient + i + j}
                                                 height={globalRectHeight}//{_self.props.height}
                                                 width={globalRectWidth}
                                                 x={xGlobal}
                                                 y={_self.props.timeScale(eventHere.eventDate)}
                                                 fill={fill}
                                                 opacity={_self.props.opacity}
                                        //fill={_self.props.color(_self.props.timepoint)}
                                    />
                                );
                            }

                        }
                    }

                    else {
                        //globalRectHeight= ht[j]/2;


                        globalRectWidth = _self.props.rectWidth / 2;
                        globalRectHeight = globalRectWidth;

                        xGlobal = _self.props.heatmapScale(d.patient) + _self.props.x;

                        let duration = ht[j];

                        rects.push(<rect stroke={stroke}
                                         onMouseEnter={(e) => _self.handleMouseEnter(e, d.patient, val, startDay, duration)
                                         }
                                         onMouseLeave={_self.handleMouseLeave}
                                         onDoubleClick={() => _self.handleDoubleClick(d.patient)}
                                         onClick={() => _self.handleClick(d.patient)}
                                         key={d.patient + i + j}
                                         height={globalRectHeight}//{_self.props.height}
                                         width={globalRectWidth}
                                         x={xGlobal}
                                         y={_self.props.timeScale(_self.props.ypi[j])}
                                         fill={fill}
                                         opacity={_self.props.opacity}
                            />
                        );

                    }

                    j++;
                    //ind++;
                    ind2 = ind;

                    //console.log(ind2);


                });
                */

            //}



    handleDoubleClick(patient) {
        window.open("http://www.cbiohack.org/case.do#/patient?studyId=" + this.props.store.rootStore.study.studyId + "&caseId=" + patient);
    }


    handleMouseEnter(event, patient, value, startDay, duration) {
        this.props.showTooltip(event, patient + ": " + value + ", Event start day: " + startDay + ", Duration: " + duration + " days")

    }

    handleMouseLeave() {
        this.props.hideTooltip();
    }


    render() {
        return (
            this.getRow()
        )


    }
});
export default TimelineRow;