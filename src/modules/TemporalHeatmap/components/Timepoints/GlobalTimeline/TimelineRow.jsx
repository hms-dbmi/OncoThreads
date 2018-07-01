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
        this.handleClick=this.handleClick.bind(this);
    }

    handleClick(patient){
        this.props.selectPatient(patient)
    }
    getRow() {
        let rects = [];
        const _self = this;
        let j = 0, ind2; //ind;

        let ht = _self.props.ht;
        let eventIndices = {};

        let globalRectHeight;
        let globalRectWidth;


        let xGlobal;

        //var startDay, duration;

        //console.log(this.props.row.data);

        this.props.row.data.forEach(function (d, i) {

            ind2 = -1;
            let p_num = _self.props.store.rootStore.patientOrderPerTimepoint.indexOf(d.patient);
            let maxNum = _self.props.numEventsForEachPatient[p_num];


            let stroke = "none";
            let fill = _self.props.color(d.value);
            if (d.value === undefined) {
                stroke = "lightgray";
                fill = "white";
            }
            if (_self.props.selectedPatients.includes(d.patient)) {
                stroke = "black";
            }


            //while (ind < maxNum) {
                            if (!(_self.props.dtype === "NUMBER" && _self.props.timepointType === "between")) {
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
                                                var eventHere = eventHere2[eventIndices[d.patient]].varId;
                                                fill = _self.props.color(eventHere);
                                                eventIndices[d.patient] = eventIndices[d.patient] + 1;
                                                val = "true";
                                                if (ht[j] === 0) {
                                                    globalRectHeight = globalRectWidth;
                                                }
                                                else {
                                                    globalRectHeight = _self.props.timeScale(ht[j]);
                                                }

                                                xGlobal = _self.props.heatmapScale(d.patient) + _self.props.x - _self.props.rectWidth / 2;

                                                //let duration=Math.round((2*ht[j]-_self.props.visMap.primaryHeight)*_self.props.max/700);

                                                let duration = ht[j];

                                                //console.log(_self.props.ypi);
                                                rects.push(<rect stroke={stroke}
                                                                 onMouseEnter={(e) => _self.handleMouseEnter(e, d.patient, val, startDay, duration)
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
                                                                 y={_self.props.timeScale(_self.props.ypi[j])}
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
                            }

            //}

            //console.log(ind);
            //console.log(ind2)
            _self.props.numEventsForEachPatient[p_num] = _self.props.numEventsForEachPatient[p_num] - (ind2 + 1);
            ind2 = -1;


        });
        j = 0;
        return rects;

    }

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