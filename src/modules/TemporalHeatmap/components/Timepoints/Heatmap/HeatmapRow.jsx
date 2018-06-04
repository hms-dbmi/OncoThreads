import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';
/*
creats a row in the heatmap
 */
const HeatmapRow = observer(class HeatmapRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = ({
            dragging: false,
        });
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.handleMouseEnter=this.handleMouseEnter.bind(this);
        this.handleMouseEnterGlobal=this.handleMouseEnterGlobal.bind(this);
    }

    getRow() {
        let rects = [];
        const _self = this;
        this.props.row.data.forEach(function (d) {
            let stroke = "none";
            if (_self.props.selectedPatients.includes(d.patient)) {
                stroke = "black"
            }
            rects.push(<rect stroke={stroke} onMouseEnter={(e) => _self.handleMouseEnter(e, d.patient, d.value)}
                             onMouseLeave={_self.handleMouseLeave} onMouseDown={() => _self.handleMouseDown(d.patient)}
                             onMouseUp={_self.handleMouseUp} onDoubleClick={() => _self.handleDoubleClick(d.patient)}
                             key={d.patient} height={_self.props.height}
                             width={_self.props.rectWidth}
                             x={_self.props.heatmapScale(d.patient) + _self.props.x}
                             fill={_self.props.color(d.value)} opacity={_self.props.opacity}/>);
        });
        return rects;

    }

    getGlobalRow() {
        let rects = [];
        const _self = this;
        let j = 0, ind;

        let ht = _self.props.ht;
        var eventIndices = {};

        //var startDay, duration;

        this.props.row.data.forEach(function (d, i) {
            let stroke = "none";
            if (_self.props.selectedPatients.includes(d.patient)) {
                stroke = "black"
            }


            ind = 0;
            let p_num = _self.props.store.rootStore.patientOrderPerTimepoint.indexOf(d.patient);
            let maxNum = _self.props.numEventsForEachPatient[p_num];

            while (ind < maxNum) {

                //var k = _self.props.eventStartEnd;


                //var height1;
                let opc1;

                var nId=0;

                if (typeof(d.eventDate) === 'undefined') {
                    //console.log("not transition");
                    opc1 = _self.props.opacity;

                }
                else {
                    opc1 = 0.6;
                }

                var fillC= _self.props.color(d.value);

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
                    //let varName=_self.props.primaryVariable.name;
                    rects.push(<rect stroke={stroke} 
                                     onMouseEnter={(e) => _self.handleMouseEnterGlobal(e, d.patient, d.value, startDay, duration)}
                                     onMouseLeave={_self.handleMouseLeave} 
                                     onMouseDown={() => _self.handleMouseDown(d.patient)}
                                     onMouseUp={_self.handleMouseUp}
                                     key={d.patient + i + j}
                                     height={_self.props.height}
                                     width={_self.props.rectWidth}
                                     x={_self.props.heatmapScale(d.patient) + _self.props.x}
                                     y={_self.props.ypi[j]}
                                     fill={fillC}
                                     
                                     opacity={opc1}
                    />);
                }
                else {
                    let startDay= Math.round(_self.props.ypi[j]*_self.props.max/700);

                    let duration=Math.round((ht[j]-_self.props.visMap.primaryHeight/4)*_self.props.max/700);

                    //let varName=_self.props.primaryVariable.name;

                    if(_self.props.dtype==="binary") {
                        if(!eventIndices[d.patient]) {
                            eventIndices[d.patient] = 0;
                        }
                        var eventHere=_self.props.events.filter(ev => ev.patientId===d.patient)[eventIndices[d.patient]].eventTypeDetailed;

                        fillC=_self.props.color(eventHere);

                        eventIndices[d.patient] = eventIndices[d.patient]+1;
                    }

                    rects.push(<rect stroke={stroke} onMouseEnter={(e) => _self.handleMouseEnterGlobal(e, d.patient, d.value, startDay, duration)}
                                     onMouseLeave={_self.handleMouseLeave}  
                                     onMouseDown={() => _self.handleMouseDown(d.patient)}
                                     onMouseUp={_self.handleMouseUp}
                                     key={d.patient + i + j}
                                     height={ht[j]}//{_self.props.height}
                                     width={_self.props.rectWidth}
                                     x={_self.props.heatmapScale(d.patient) + _self.props.x}
                                     y={_self.props.ypi[j]}
                                     fill={fillC}
                                     //fill={_self.props.color(_self.props.timepoint)}
                                     opacity={opc1}
                        />
                    );
                }
                j++;
                ind++;
            }

            _self.props.numEventsForEachPatient[p_num] = _self.props.numEventsForEachPatient[p_num] - ind;
            ind = 0;


        });
        j = 0;
        return rects;

    }

    handleDoubleClick(patient) {
        window.open("http://www.cbiohack.org/case.do#/patient?studyId=" + this.props.store.rootStore.study.studyId + "&caseId=" + patient);
    }


    //added for drawing lines

    static drawLine(x0, x1, y0, y1, key, mode, strokeColor) {
        const curvature = .5;
        const yi = d3.interpolateNumber(y0, y1),
            y2 = yi(curvature),
            y3 = yi(1 - curvature);

        let path = "M" + x0 + "," + y0
            + "C" + x0 + "," + y2
            + " " + x1 + "," + y3
            + " " + x1 + "," + y1;
        if (mode) {
            return (
                <path key={key + "-solid"} d={path} stroke={strokeColor} fill="none" strokeWidth="22" opacity="0.2"/>)
        } else {
            return (<path key={key + "-dashed"} d={path} stroke={strokeColor} strokeDasharray="5, 5" fill="none"/>)
        }
    }

    handleMouseDown(patient) {
        if (!this.state.dragging) {
            this.props.onDrag(patient);
        }
        this.setState({
            dragging: true
        });

    }

    handleMouseUp() {
        this.setState({
            dragging: false
        })
    }

    handleMouseEnter(event, patient, value) {
        if (this.state.dragging) {
            this.props.onDrag(patient);
        }
        else {
            this.props.showTooltip(event, patient + ": " + value)
        }
    }

    handleMouseEnterGlobal(event, patient, value, startDay, duration) {
        if (this.state.dragging) {
            this.props.onDrag(patient);
        }
        else {
            this.props.showTooltip(event, patient + ": " + value + ", Event start day: " + startDay + ", Duration: "+ duration + " days")
        }
    }

    handleMouseLeave() {
        this.props.hideTooltip();
    }


    render() {

        if (this.props.store.rootStore.globalTime) {
            return (
                this.getGlobalRow()
            )
        } else {
            return (
                this.getRow()
            )
        }


    }
});
export default HeatmapRow;