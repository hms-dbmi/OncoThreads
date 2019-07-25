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
        const rects = [];
        const j = 0;
        if (this.props.timepointType === 'between') {
            this.props.events.forEach((ev, i) => {
                let opc1 = this.props.opacity;
                let height = this.props.rootStore
                    .visStore.timeScale(ev.eventEndDate - ev.eventStartDate);
                let offset = 0;
                const val = this.props.rootStore
                    .dataStore.variableStores.between.getById(this.props.row.variable).name;
                if (height === 0) {
                    height = this.props.rootStore.visStore.timelineRectSize * (2 / 3);
                    offset = this.props.rootStore.visStore.timelineRectSize * (1 / 3);
                    opc1 += 0.3;
                }
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
                    width={this.props.rootStore.visStore.timelineRectSize * (2 / 3)}
                    x={this.props.rootStore.visStore.heatmapScales[0](ev.patientId)
                    + this.props.rootStore.visStore.timelineRectSize * (1 / 6)}
                    y={this.props.rootStore.visStore.timeScale(ev.eventStartDate) - offset}
                    fill={this.props.color(this.props.row.variable)}
                    opacity={opc1}
                />);
            });
        } else {
            this.props.row.data.forEach((d, i) => {
                let stroke = 'none';
                let fill = this.props.color(d.value);
                if (d.value === undefined) {
                    stroke = 'lightgray';
                    fill = 'white';
                }
                if (this.props.rootStore.dataStore.selectedPatients.includes(d.patient)) {
                    stroke = 'black';
                }
                rects.push(<rect
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
                    fill={fill}
                    opacity={this.props.opacity}
                />);
                if (d.value === undefined) {
                    rects.push(<line
                        stroke="lightgrey"
                        key={`${d.patient + j}UNDEFINED`}
                        height={this.props.rootStore.visStore.timelineRectSize / 2}
                        width={this.props.rootStore.visStore.timelineRectSize}
                        x1={this.props.rootStore.visStore.heatmapScales[0](d.patient)}
                        x2={this.props.rootStore.visStore.heatmapScales[0](d.patient)
                        + this.props.rootStore.visStore.timelineRectSize / 2}
                        y1={this.props.rootStore.visStore
                            .timeScale(this.props.rootStore.sampleTimelineMap[d.sample])
                        - this.props.rootStore.visStore.timelineRectSize / 2}
                        y2={this.props.rootStore.visStore
                            .timeScale(this.props.rootStore.sampleTimelineMap[d.sample])
                        + this.props.rootStore.visStore.timelineRectSize / 2}
                        opacity={this.props.opacity}
                    />);
                }
            });
        }
        return rects;
    }

    handleClick(patient) {
        this.props.rootStore.dataStore.handlePatientSelection(patient);
    }


    handleDoubleClick(patient) {
        window.open(`http://www.cbiohack.org/case.do#/patient?studyId=${this.props.rootStore.study.studyId}&caseId=${patient}`);
    }


    handleMouseEnter(event, patient, value, startDay, duration) {
        let timeVariable = 'Day';
        let start;
        let dur;

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
            this.props.tooltipVisibility(event, `${patient}: ${value}, ${timeVariable}: ${start}`);
        } else {
            this.props.tooltipVisibility(event, `${patient}: ${value}, Event start ${timeVariable}: ${start}, Duration: ${dur} ${timeVariable}`);
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
    tooltipVisibility: PropTypes.func.isRequired,
    hideTooltip: PropTypes.func.isRequired,
    events: PropTypes.arrayOf(PropTypes.object),
    row: MobxPropTypes.observableObject.isRequired,
    color: PropTypes.func.isRequired,
};
TimelineRow.defaultProps = {
    events: [],
};
export default TimelineRow;
