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
        //this.handleMouseEnter = this.handleMouseEnter.bind(this);
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


        let xGlobal;

        //var startDay, duration;

        //console.log(this.props.row.data);
        if (_self.props.timepointType === "between") {
            if (_self.props.dtype === "BINARY") {


                _self.props.events.forEach(function (ev, j) {
                        let opc1 = _self.props.opacity;
                        let height = _self.props.timeScale(ev.eventEndDate - ev.eventDate);
                        if (height === 0) {
                            height = _self.props.rectWidth;
                            opc1 = opc1 + 0.3;
                        }
                        let val = _self.props.store.variableStores.between.getById(ev.varId).name;
                        rects.push(<rect
                            onMouseEnter={(e) => _self.handleMouseEnter(e, ev.patientId, val, ev.eventDate, ev.eventEndDate - ev.eventDate)
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

                            fill={_self.props.color(_self.props.row.variable)}
                            opacity={opc1}
                            //fill={_self.props.color(_self.props.timepoint)}
                        />);
                    }
                );
            }
        }
        else
        {
            this.props.row.data.forEach(function (d, i) {

            if(_self.props.store.rootStore.dataStore.timepoints.length!==_self.props.index){
            //if(_self.props.store.rootStore.dataStore.timepoints.length!==-1){
                let stroke = "none";
                let fill = _self.props.color(d.value);
                if (d.value === undefined) {
                    stroke = "lightgray";
                    fill = "white";
                }
                if (_self.props.store.selectedPatients.includes(d.patient)) {
                    stroke = "black";
                }


                //let duration=Math.round((ht[j]-_self.props.visMap.primaryHeight/4)*_self.props.max/700);


                //let varName=_self.props.primaryVariable.name;

                const val = d.value;

                // globalRectHeight =ht[j];

                //globalRectHeight= ht[j]/2;


                xGlobal = _self.props.heatmapScale(d.patient);

                rects.push(<rect stroke={stroke}
                                onMouseEnter={(e) => _self.handleMouseEnter(e, d.patient, val, _self.props.store.rootStore.sampleTimelineMap[d.sample].startNumberOfDaysSinceDiagnosis, 0)
                                }
                                onMouseLeave={_self.handleMouseLeave}
                                onDoubleClick={() => _self.handleDoubleClick(d.patient)}
                                onClick={() => _self.handleClick(d.patient)}
                                key={d.patient + i + j}
                                height={_self.props.rectWidth / 2}//{_self.props.height}
                                width={_self.props.rectWidth / 2}
                                x={_self.props.heatmapScale(d.patient)}
                                y={_self.props.timeScale(_self.props.store.rootStore.sampleTimelineMap[d.sample].startNumberOfDaysSinceDiagnosis)}
                                fill={fill}
                                opacity={_self.props.opacity}
                    />
                );
                if (d.value === undefined) {
                                    rects.push(<line stroke={"lightgrey"}
                                                    key={d.patient+j + "UNDEFINED"} height={_self.props.rectWidth / 2}
                                                    width={_self.props.rectWidth / 2}
                                                    x1={_self.props.heatmapScale(d.patient)}
                                                    x2={_self.props.heatmapScale(d.patient)+ _self.props.rectWidth/2}
                                                    y1={_self.props.timeScale(_self.props.store.rootStore.sampleTimelineMap[d.sample].startNumberOfDaysSinceDiagnosis)}
                                                    y2={_self.props.timeScale(_self.props.store.rootStore.sampleTimelineMap[d.sample].startNumberOfDaysSinceDiagnosis)+_self.props.rectWidth/2}
                                                    opacity={_self.props.opacity}/>);
                                }



            }
            else{

            let stroke = "none";



            //const val = d.value;

            // globalRectHeight =ht[j];

            //globalRectHeight= ht[j]/2;


            //console.log( _self.props.ypi);
            xGlobal = _self.props.heatmapScale(d.patient);

            if(_self.props.ypi[i]!=='undefined' && _self.props.ypi[i]>0){

                if(_self.props.store.rootStore.staticMappers["OS_STATUS"][d.patient+"_Pri"]==="DECEASED"){

                    let fill = "black";

                    rects.push(<rect stroke={stroke}
                            onMouseEnter={(e) => _self.handleMouseEnter(e, d.patient, "Approximate Time of Death", _self.props.ypi[i], 0)
                            }
                            onMouseLeave={_self.handleMouseLeave}
                            onDoubleClick={() => _self.handleDoubleClick(d.patient)}
                            onClick={() => _self.handleClick(d.patient)}
                            key={d.patient + i + j}
                            height={_self.props.rectWidth / 6}//{_self.props.height}
                            width={_self.props.rectWidth / 2}
                            x={xGlobal}
                        // y={_self.props.timeScale(_self.props.store.rootStore.sampleTimelineMap[d.sample].startNumberOfDaysSinceDiagnosis)}
                            y={_self.props.timeScale(_self.props.ypi[i])}
                            fill={fill}
                            opacity={_self.props.opacity}
                        />
                    );
                }
                else{

                    let fill = "lightgrey";

                    rects.push(<rect stroke={stroke}
                        onMouseEnter={(e) => _self.handleMouseEnter(e, d.patient, "Last known status: Living", _self.props.ypi[i], 0)
                        }
                        onMouseLeave={_self.handleMouseLeave}
                        onDoubleClick={() => _self.handleDoubleClick(d.patient)}
                        onClick={() => _self.handleClick(d.patient)}
                        key={d.patient + i + j}
                        height={_self.props.rectWidth / 6}//{_self.props.height}
                        width={_self.props.rectWidth / 2}
                        x={xGlobal}
                    // y={_self.props.timeScale(_self.props.store.rootStore.sampleTimelineMap[d.sample].startNumberOfDaysSinceDiagnosis)}
                        y={_self.props.timeScale(_self.props.ypi[i])}
                        fill={fill}
                        opacity={_self.props.opacity}
                    />
                );


                }

            }
            /*if (d.value === undefined) {
                                rects.push(<line stroke={"lightgrey"}
                                                key={d.patient+j + "UNDEFINED"} height={_self.props.rectWidth / 2}
                                                width={_self.props.rectWidth / 2}
                                                x1={_self.props.heatmapScale(d.patient)}
                                                x2={_self.props.heatmapScale(d.patient)+ _self.props.rectWidth/2}
                                                y1={_self.props.timeScale(_self.props.store.rootStore.sampleTimelineMap[d.sample].startNumberOfDaysSinceDiagnosis)}
                                                y2={_self.props.timeScale(_self.props.store.rootStore.sampleTimelineMap[d.sample].startNumberOfDaysSinceDiagnosis)+_self.props.rectWidth/2}
                                                opacity={_self.props.opacity}/>);
                            }*/


           }

        });
    }
return rects;
}


handleDoubleClick(patient)
{
    window.open("http://www.cbiohack.org/case.do#/patient?studyId=" + this.props.store.rootStore.study.studyId + "&caseId=" + patient);
}


handleMouseEnter(event, patient, value, startDay, duration)
{

    var timeVariable = "Day";

    if (this.props.store.rootStore.timeVar === "30") {
        startDay = Math.round((startDay / 30) * 100) / 100;
        duration = Math.round((duration / 30) * 100) / 100;
        timeVariable = "Month";
    }
    else if (this.props.store.rootStore.timeVar === "365") {
        startDay = Math.round((startDay / 365) * 100) / 100;
        duration = Math.round((duration / 365) * 100) / 100;
        timeVariable = "Year";
    }


    if (duration === 0) {
        this.props.showTooltip(event, patient + ": " + value + ", " + timeVariable + ": " + startDay)

    }
    else {
        //this.props.showTooltip(event, patient + ": " + value + ", Event start day: " + startDay + ", Duration: " + duration + " days")

        this.props.showTooltip(event, patient + ": " + value + ", Event start " + timeVariable + ": " + startDay + ", Duration: " + duration + " " + timeVariable)
    }

}

handleMouseLeave()
{
    this.props.hideTooltip();
}


render()
{
    return (
        this.getRow()
    )


}
})
;
export default TimelineRow;