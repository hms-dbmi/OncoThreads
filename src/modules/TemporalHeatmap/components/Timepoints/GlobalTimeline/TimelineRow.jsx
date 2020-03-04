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

        const sampleRadius = this.props.rootStore.visStore.sampleRadius;
        const eventRadius = this.props.rootStore.visStore.eventRadius;
        const translation = this.props.rootStore.visStore.sampleRectWidth / 5;

        if (this.props.timepointType === 'between') {
            this.props.events.forEach((ev, i) => {
                let opc1 = this.props.opacity;
                let height = this.props.rootStore
                    .visStore.timeScale(ev.eventEndDate - ev.eventStartDate);

                //let currEventNum= self.props.rootStore.dataStore.variableStores.between.getRelatedVariables('event').length;  

                const val = this.props.rootStore
                    .dataStore.variableStores.between.getById(this.props.row.variable).name;
                const xOffset = this.getXOffset(ev, sampleRadius, eventRadius);
                if (height === 0) {
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
                       
                       cx={this.props.rootStore.visStore.heatmapScales[0](ev.patientId) + translation + xOffset}
                       cy={this.props.rootStore.visStore.timeScale(ev.eventStartDate)}
                       r = {eventRadius}

                       fill={"white"}

                       opacity={opc1}

                       strokeWidth={1}

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
                        width={eventRadius}
                        x={this.props.rootStore.visStore.heatmapScales[0](ev.patientId) + translation + xOffset - eventRadius/2}

                        y={this.props.rootStore.visStore.timeScale(ev.eventStartDate)}
                        fill={"white"}
                        opacity={opc1}
                       
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
                    
                    cx={this.props.rootStore.visStore.heatmapScales[0](d.patient) + translation}
                    
                    cy={this.props.rootStore.visStore
                        .timeScale(this.props.rootStore.sampleTimelineMap[d.sample])}

                    r = {sampleRadius}

                    fill={fill}
                    opacity={this.props.opacity}                   
                /></g>);
                rects=circles;
            });
        }
        return rects;
    }

    getXOffset(event, sampleRadius, eventRadius) {
        const overlappingEvents = this.props.overlappingEventsMap[event.patientId];
        if (!overlappingEvents || !overlappingEvents.length) {
            return 0;
        }
        const length = Math.ceil(overlappingEvents.length/2)-1;
        const min = sampleRadius + eventRadius;
        const max = sampleRadius + 3 * eventRadius;
        let xOffset = 0;
        const index = overlappingEvents.indexOf(this.props.row.variable);
        if (Math.floor(index/2) === 0) {
            xOffset = min * 2 * (index%2-0.5);
        } else if (Math.floor(index/2) > 0) {
            xOffset = (min + ((max-min)/length)*Math.floor(index/2)) * 2 * (index%2-0.5);
        }
        return xOffset;
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
