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
        this.handleMouseEnter=this.handleMouseEnter.bind(this);
        this.handleMouseEnter=this.handleMouseEnter.bind(this);
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


            //let stroke = "none";
            let fill=_self.props.color(d.value);
            if(d.value===undefined){
                //stroke="lightgray";
                fill="white";
            }
            /*
            if (_self.props.selectedPatients.includes(d.patient)) {
                stroke = "black";

            }
            */


            //while (ind < maxNum) {

            var strColor;

            Array.from(Array(maxNum).keys()).forEach(function(ind){
               if(!(_self.props.dtype==="NUMBER"&&_self.props.timepointType==="between")){

                //var k = _self.props.eventStartEnd;


                //var height1;

                //var nId=0;

                /*if (typeof(d.eventDate) === 'undefined') {
                    //console.log("not transition");

                }
                else {
                    opc1 = 0.6;
                }*/


                //var colorEx=['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f', '#bf5b17'];

                /*if(_self.props.dtype==="binary"){
                    //fillC= _self.props.color(_self.props.currentVariables[_self.props.currentVariables.length-1].name);

                    //fillC= colorEx[(colorEx.length ) % _self.props.currentVariables.length];
                    fillC=_self.props.color(d.eventName);
                }*/

                //if(_self.props.dtype=="binary"){
                  //  fillC=_self.props.color(_self.props.store.rootStore.betweenTimepointStore.variableStore.currentVariables.length);
                //}
                if (typeof(ht) === 'undefined') {
                    let startDay=Math.round(_self.props.ypi[j]*_self.props.max/700);
                    let duration=0;

                    globalRectHeight = _self.props.height;

                    globalRectWidth =_self.props.rectWidth;

                    xGlobal= _self.props.heatmapScale(d.patient) + _self.props.x - _self.props.rectWidth/2;
                    if(_self.props.dtype!=="binary") {
                        globalRectHeight= _self.props.height/2;

                        globalRectWidth =_self.props.rectWidth/2;

                        xGlobal= xGlobal+ _self.props.rectWidth/2;
                    }

                    strColor='#800080';

                    //let varName=_self.props.primaryVariable.name;
                    rects.push(<rect //stroke={stroke}
                                     onMouseEnter={(e) => _self.handleMouseEnter(e, d.patient, d.value, startDay, duration)}
                                     onMouseLeave={_self.handleMouseLeave}
                                     key={d.patient + i + j}
                                     height={globalRectHeight}
                                     width={globalRectWidth}
                                     x={xGlobal}
                                     y={_self.props.ypi[j]}
                                     fill={fill}
                                     strokeWidth={1}
                                     stroke={strColor}
                    />);
                }
                else {
                    let startDay= Math.round(_self.props.ypi[j]*_self.props.max/700);

                    //let duration=Math.round((ht[j]-_self.props.visMap.primaryHeight/4)*_self.props.max/700);


                    //let varName=_self.props.primaryVariable.name;

                    var val= d.value;


                   // globalRectHeight =ht[j];

                    globalRectWidth =_self.props.rectWidth;


                    if(_self.props.dtype==="binary") {
                        if(!eventIndices[d.patient]) {
                            eventIndices[d.patient] = 0;
                        }
                        if(_self.props.events.length>0){
                            //var eventHere=_self.props.events.filter(ev => ev.patientId===d.patient)[eventIndices[d.patient]].eventTypeDetailed;

                            var eventHere2=_self.props.events.filter(ev => ev.patientId===d.patient);// [eventIndices[d.patient]].eventTypeDetailed;

                            if(eventHere2){

                                var eventHere=eventHere2[eventIndices[d.patient]].eventTypeDetailed;

                                fill=_self.props.color(eventHere);

                                strColor='#FF00FF';

                                eventIndices[d.patient] = eventIndices[d.patient]+1;

                                val="true";

                                globalRectHeight =ht[j];

                                xGlobal= _self.props.heatmapScale(d.patient) + _self.props.x - _self.props.rectWidth/2;

                                //let duration=Math.round((2*ht[j]-_self.props.visMap.primaryHeight)*_self.props.max/700);

                                let duration=Math.round(((2*ht[j] - _self.props.visMap.primaryHeight)*_self.props.max)/(700*2));

                                //console.log(_self.props.ypi);
                                rects.push(<rect //stroke={stroke}
                                    onMouseEnter={ (e) => _self.handleMouseEnter(e, d.patient, val, startDay, duration)
                                        }
                                    onMouseLeave={_self.handleMouseLeave}
                                    //onMouseDown={() => _self.handleMouseDown(d.patient)}
                                    //onMouseUp={_self.handleMouseUp}
                                    key={d.patient + i + j}
                                    height={globalRectHeight}//{_self.props.height}
                                    width={globalRectWidth}
                                    x={xGlobal}
                                    y={_self.props.ypi[j]}
                                    fill={fill}
                                    strokeWidth={1}
                                    stroke={strColor}
                                    //fill={_self.props.color(_self.props.timepoint)}
                                />
                                );
                            }

                        }

                    }

                    else{
                        //globalRectHeight= ht[j]/2;

                        globalRectHeight= ht[j]/2;

                        strColor='#800080';

                        globalRectWidth =_self.props.rectWidth/2;

                        xGlobal= _self.props.heatmapScale(d.patient) + _self.props.x ;

                        let duration=Math.round((ht[j]-_self.props.visMap.primaryHeight)*_self.props.max/700);

                        rects.push(<rect //stroke={stroke}
                                        onMouseEnter={ (e) => _self.handleMouseEnter(e, d.patient, val, startDay, duration)
                                            }
                                        onMouseLeave={_self.handleMouseLeave}
                                         onDoubleClick={()=>_self.handleDoubleClick(d.patient)}
                                        key={d.patient + i + j}
                                        height={globalRectHeight}//{_self.props.height}
                                        width={globalRectWidth}
                                        x={xGlobal}
                                        y={_self.props.ypi[j]}
                                        fill={fill}
                                        strokeWidth={1}
                                        stroke={strColor}
                                        //fill={_self.props.color(_self.props.timepoint)}
                            />
                        );
                    }
                }
                j++;
                //ind++;
                ind2=ind;

                //console.log(ind2);


                }
            });
            //}

            //console.log(ind);
            //console.log(ind2)
            _self.props.numEventsForEachPatient[p_num] = _self.props.numEventsForEachPatient[p_num] - (ind2+1);
            ind2 = -1;



        });
        j = 0;
        return rects;

    }

    handleDoubleClick(patient) {
        window.open("http://www.cbiohack.org/case.do#/patient?studyId=" + this.props.store.rootStore.study.studyId + "&caseId=" + patient);
    }



    handleMouseEnter(event, patient, value, startDay, duration) {

            this.props.showTooltip(event, patient + ": " + value + ", Event start day: " + startDay + ", Duration: "+ duration + " days")

    }

    handleMouseLeave() {
        this.props.hideTooltip();
    }


    render() {
        return(
                this.getRow()
    )


    }
});
export default TimelineRow;