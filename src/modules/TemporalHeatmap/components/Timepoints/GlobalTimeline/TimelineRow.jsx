import React from 'react';
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react';
import PropTypes from 'prop-types';



/**
 * Component for a row in a timepoint in the global timeline
 = */
const TimelineRow = inject('rootStore')(observer(class TimelineRow extends React.Component {
    constructor(props) {
        super(props);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    getRow() {
        let rects = [];

        let circles = [];

        const j = 0;
        if (this.props.timepointType === 'between') {
            this.props.events.forEach((ev, i) => {
                let opc1 = this.props.opacity;
                let height = this.props.rootStore
                    .visStore.timeScale(ev.eventEndDate - ev.eventStartDate);

                //console.log(height);    
                let offset = 0;
                const val = this.props.rootStore
                    .dataStore.variableStores.between.getById(this.props.row.variable).name;
                if (height === 0) {
                    let ft=3;
                    //height = this.props.rootStore.visStore.timelineRectSize * (2 / 3);
                    offset = this.props.rootStore.visStore.timelineRectSize * (1 / ft);

                    console.log("offset = ", offset);
                    //opc1 += 0.3;

                    //let r1 = this.props.rootStore.visStore.timelineRectSize * (2 / 3);

                    /*circles.push(
                        <circle 
                       
                        onMouseEnter={e => this.handleMouseEnter(
                            e, ev.patientId, val, ev.eventStartDate,
                            ev.eventEndDate - ev.eventStartDate,
                        )
                        }
                        onMouseLeave={this.handleMouseLeave}
                        onDoubleClick={() => this.handleDoubleClick(ev.patientId)}
                        onClick={() => this.handleClick(ev.patientId)}
                        key={ev.patientId + i}
                        
                        cx={this.props.rootStore.visStore.heatmapScales[0](ev.patientId)
                            //+ this.props.rootStore.visStore.timelineRectSize * (1 / 6)
                            + this.props.rootStore.visStore.timelineRectSize/2}
                        cy={this.props.rootStore.visStore.timeScale(ev.eventStartDate) //- offset
                            //+ this.props.rootStore.visStore.timelineRectSize/2
                        }
                        r = {5}//{r1}

                        fill={this.props.color(this.props.row.variable)}

                        opacity={opc1}
                       
                    />);

                    rects=circles;
                    //return circles;*/


                    //rect with lines in between them 
                    /*rects.push(<g><rect
                        onMouseEnter={e => this.handleMouseEnter(
                            e, ev.patientId, val, ev.eventStartDate,
                            ev.eventEndDate - ev.eventStartDate,
                        )
                        }
                        onMouseLeave={this.handleMouseLeave}
                        onDoubleClick={() => this.handleDoubleClick(ev.patientId)}
                        onClick={() => this.handleClick(ev.patientId)}
                        key={ev.patientId + i}
                        height={offset/2}
                        width={offset}
                        x={this.props.rootStore.visStore.heatmapScales[0](ev.patientId)
                            //+ offset + offset/2
                            + (offset/2)*ft 
                            - offset/2
                            //-offset
                            }
                        y={this.props.rootStore.visStore.timeScale(ev.eventStartDate) -(offset/2)/2
                            }
                        fill="none" //{this.props.color(this.props.row.variable)}
                        opacity={opc1}
                        //rx={3}
                        strokeWidth={1}
                        //stroke={this.props.color(this.props.row.variable)}
                        //strokeOpacity="1"
                        stroke={this.props.color(this.props.row.variable)}//{"slategrey"}
                    />

                    <line 
                        x1={this.props.rootStore.visStore.heatmapScales[0](ev.patientId)
                            //+ offset + offset/2
                            + (offset/2)*ft 
                            - offset/2
                        } 
                        x2={this.props.rootStore.visStore.heatmapScales[0](ev.patientId)
                            //+ offset + offset/2
                            + (offset/2)*ft 
                            - offset/2
                            +offset
                        }  
                        y1={this.props.rootStore.visStore.timeScale(ev.eventStartDate) //+(offset/2)
                        }
                        y2={this.props.rootStore.visStore.timeScale(ev.eventStartDate) //+(offset/2)
                        }
                        stroke={this.props.color(this.props.row.variable)}
                        strokeWidth={1.5}
                        opacity={opc1}
                    />

                    </g>);*/

//rects and circles
                   /* rects.push(<g><rect
                        onMouseEnter={e => this.handleMouseEnter(
                            e, ev.patientId, val, ev.eventStartDate,
                            ev.eventEndDate - ev.eventStartDate,
                        )
                        }
                        onMouseLeave={this.handleMouseLeave}
                        onDoubleClick={() => this.handleDoubleClick(ev.patientId)}
                        onClick={() => this.handleClick(ev.patientId)}
                        key={ev.patientId + i}
                        height={offset}
                        width={offset}
                        x={this.props.rootStore.visStore.heatmapScales[0](ev.patientId)
                            //+ offset + offset/2
                            + (offset/2)*ft 
                            - offset/2
                            //-offset
                            }
                        y={this.props.rootStore.visStore.timeScale(ev.eventStartDate) -(offset/2)/2
                            }
                        fill="none" //{this.props.color(this.props.row.variable)}
                        opacity={opc1}
                        //rx={3}
                        strokeWidth={1}
                        //stroke={this.props.color(this.props.row.variable)}
                        //strokeOpacity="1"
                        stroke={this.props.color(this.props.row.variable)}//{"slategrey"}
                    />

                
                    <circle 
                       
                       onMouseEnter={e => this.handleMouseEnter(
                           e, ev.patientId, val, ev.eventStartDate,
                           ev.eventEndDate - ev.eventStartDate,
                       )
                       }
                       onMouseLeave={this.handleMouseLeave}
                       onDoubleClick={() => this.handleDoubleClick(ev.patientId)}
                       onClick={() => this.handleClick(ev.patientId)}
                       key={ev.patientId + i}
                       
                       cx={this.props.rootStore.visStore.heatmapScales[0](ev.patientId)
                           //+ this.props.rootStore.visStore.timelineRectSize * (1 / 6)
                           + this.props.rootStore.visStore.timelineRectSize/2}
                       cy={this.props.rootStore.visStore.timeScale(ev.eventStartDate) +(offset/2)/2
                        //- offset
                           //+ this.props.rootStore.visStore.timelineRectSize/2
                       }
                       r = {5}//{r1}

                       fill={this.props.color(this.props.row.variable)}

                       opacity={opc1}
                      
                   />
                    </g>);*/


                    //small rect and circle


                    rects.push(<g>

                    
                    <circle 
                       
                       onMouseEnter={e => this.handleMouseEnter(
                           e, ev.patientId, val, ev.eventStartDate,
                           ev.eventEndDate - ev.eventStartDate,
                       )
                       }
                       onMouseLeave={this.handleMouseLeave}
                       onDoubleClick={() => this.handleDoubleClick(ev.patientId)}
                       onClick={() => this.handleClick(ev.patientId)}
                       key={ev.patientId + i}
                       
                       cx={this.props.rootStore.visStore.heatmapScales[0](ev.patientId)
                           //+ this.props.rootStore.visStore.timelineRectSize * (1 / 6)
                           + this.props.rootStore.visStore.timelineRectSize/2}
                       cy={this.props.rootStore.visStore.timeScale(ev.eventStartDate) //+(offset/2)/2
                        //- offset
                           //+ this.props.rootStore.visStore.timelineRectSize/2
                       }
                       r = {5}//{r1}

                       fill={"none"}

                       opacity={opc1}

                       stroke={this.props.color(this.props.row.variable)}
                      
                   />


                    
                    </g>);

                }
                else{
                    rects.push(<rect
                        onMouseEnter={e => this.handleMouseEnter(
                            e, ev.patientId, val, ev.eventStartDate,
                            ev.eventEndDate - ev.eventStartDate,
                        )
                        }
                        onMouseLeave={this.handleMouseLeave}
                        onDoubleClick={() => this.handleDoubleClick(ev.patientId)}
                        onClick={() => this.handleClick(ev.patientId)}
                        key={ev.patientId + i}
                        height={height}
                        width={this.props.rootStore.visStore.timelineRectSize * (1 / 3)}
                        x={this.props.rootStore.visStore.heatmapScales[0](ev.patientId)
                        + this.props.rootStore.visStore.timelineRectSize * (2 / 6)}
                        y={this.props.rootStore.visStore.timeScale(ev.eventStartDate) - offset}
                        fill={"none"}
                        opacity={opc1}
                        //rx={3}
                        //strokeWidth={1}
                        //stroke={"black"}
                        //strokeOpacity="1"
                        strokeWidth={1}
                        
                        stroke={this.props.color(this.props.row.variable)}
                    />);
                }
                
            });
        } else {
            this.props.row.data.forEach((d, i) => {
                //let stroke = 'none';
                let fill = this.props.color(d.value);
                if (d.value === undefined) {
                    //stroke = 'lightgray';
                    fill = 'white';
                }
                //if (this.props.rootStore.dataStore.selectedPatients.includes(d.patient)) {
                    //stroke = 'black';
                //}
                /*rects.push(<rect
                    stroke={stroke}
                    onMouseEnter={e => this.handleMouseEnter(
                        e, d.patient, d.value,
                        this.props.rootStore.sampleTimelineMap[d.sample], 0,
                    )
                    }
                    onMouseLeave={this.handleMouseLeave}
                    onDoubleClick={() => this.handleDoubleClick(d.patient)}
                    onClick={() => this.handleClick(d.patient)}
                    key={d.patient + i + j}
                    height={this.props.rootStore.visStore.timelineRectSize}
                    width={this.props.rootStore.visStore.timelineRectSize}
                    x={this.props.rootStore.visStore.heatmapScales[0](d.patient)}
                    y={this.props.rootStore.visStore
                        .timeScale(this.props.rootStore.sampleTimelineMap[d.sample])
                    - this.props.rootStore.visStore.timelineRectSize / 2}
                    //paint-order= "fill"
                    fill={fill}
                    opacity={this.props.opacity}
                    
                />);*/

                //new code-start        
                //let offset = this.props.rootStore.visStore.timelineRectSize * (1 / 3);

                //opc1 += 0.3;

                //let r1 = this.props.rootStore.visStore.timelineRectSize * (2 / 3);

                circles.push(
                    
                    <g>
                    

                    <defs>
            <pattern id="Triangle"
                     width="10" height="10"
                     patternUnits="userSpaceOnUse">
                <polygon points="5,0 10,10 0,10"/>
            </pattern>
        </defs>
                

        <defs>
            <pattern id="pattern-stripe" 
              width="4" height="4" 
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(135)">
              <rect width="1" height="4" transform="translate(0,0)" fill="grey"></rect>
            </pattern>

            
            <mask id="mask-stripe">
              <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-stripe)" />
            </mask>      
          </defs>


                <circle 
                   
                    

                    onMouseEnter={e => this.handleMouseEnter(
                        e, d.patient, d.value,
                        this.props.rootStore.sampleTimelineMap[d.sample], 0,
                    )
                    }
                    onMouseLeave={this.handleMouseLeave}
                    onDoubleClick={() => this.handleDoubleClick(d.patient)}
                    onClick={() => this.handleClick(d.patient)}
                    key={d.patient + i + j}
                    
                    cx={this.props.rootStore.visStore.heatmapScales[0](d.patient)
                        //+ this.props.rootStore.visStore.timelineRectSize * (1 / 6)
                        + this.props.rootStore.visStore.timelineRectSize/2}
                    //cy={this.props.rootStore.visStore.timeScale(ev.eventStartDate) - offset
                       // + this.props.rootStore.visStore.timelineRectSize/2}
                    
                    cy={this.props.rootStore.visStore
                        .timeScale(this.props.rootStore.sampleTimelineMap[d.sample])
                    }

                    r = {5}//{r1}

                    fill={fill}

                    //fill="url(#pattern-stripe)"

                    opacity={this.props.opacity}

                    strokeWidth={1}
                    stroke={fill}
                   
                /></g>);

                rects=circles;

                //end
                /*if (d.value === undefined) {
                    rects.push(<line
                        stroke="lightgrey"
                        key={`${d.patient + j}UNDEFINED`}
                        height={this.props.rootStore.visStore.timelineRectSize / 2}
                        width={this.props.rootStore.visStore.timelineRectSize/2}
                        x1={this.props.rootStore.visStore.heatmapScales[0](d.patient)}
                        x2={this.props.rootStore.visStore.heatmapScales[0](d.patient)
                        + this.props.rootStore.visStore.timelineRectSize}
                        y1={this.props.rootStore.visStore
                            .timeScale(this.props.rootStore.sampleTimelineMap[d.sample])
                        - this.props.rootStore.visStore.timelineRectSize / 2}
                        y2={this.props.rootStore.visStore
                            .timeScale(this.props.rootStore.sampleTimelineMap[d.sample])
                        + this.props.rootStore.visStore.timelineRectSize / 2}
                        opacity={this.props.opacity}
                    />);
                }*/
            });
        }
        return rects;
    }

    handleClick(patient) {
        this.props.rootStore.dataStore.handlePatientSelection(patient);
    }


    handleDoubleClick(patient) {
        if (!this.props.rootStore.isOwnData) {
            window.open(`${this.props.rootStore.cBioLink}/patient?studyId=${this.props.rootStore.study.studyId}&caseId=${patient}`);
        }
    }


    handleMouseEnter(event, patient, value, startDay, duration) {
        let timeVariable = 'Day';
        let start = startDay;
        let dur = duration;

        if (this.props.rootStore.timeVar === '30') {
            start = Math.round((startDay / 30) * 100) / 100;
            dur = Math.round((duration / 30) * 100) / 100;
            timeVariable = 'Month';
        } else if (this.props.rootStore.timeVar === '365') {
            start = Math.round((startDay / 365) * 100) / 100;
            dur = Math.round((duration / 365) * 100) / 100;
            timeVariable = 'Year';
        }
        if (duration === 0) {
            this.props.showTooltip(event, `${patient}: ${value}, ${timeVariable}: ${start}`);
        } else {
            this.props.showTooltip(event, `${patient}: ${value}, Event start ${timeVariable}: ${start}, Duration: ${dur} ${timeVariable}`);
        }
    }

    handleMouseLeave() {
        this.props.hideTooltip();
    }


    render() {
        return (
            this.getRow()
        );
    }
}));
TimelineRow.propTypes = {
    timepointType: PropTypes.string.isRequired,
    showTooltip: PropTypes.func.isRequired,
    hideTooltip: PropTypes.func.isRequired,
    events: PropTypes.arrayOf(PropTypes.object),
    row: MobxPropTypes.observableObject.isRequired,
    color: PropTypes.func.isRequired,
};
TimelineRow.defaultProps = {
    events: [],
};
export default TimelineRow;
