import React from 'react';
import { PropTypes } from 'prop-types';
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react';
import {getScientificNotation} from 'modules/TemporalHeatmap/UtilityClasses/UtilityFunctions';

/**
 * Component for creating a row of a heatmap (ungrouped) timepoint
 */
const HeatmapRow = inject('dataStore')(observer(class HeatmapRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = ({
            dragging: false,
        });
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleRightClick = this.handleRightClick.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
    }

    /**
     * creates a row for the timepoint
     * @return {(rect|line)[]}
     */
    getRow() {
        const rects = [];
        this.props.row.data.forEach((d) => {
            let stroke = 'none';
            const variable = this.props.dataStore.variableStores[this.props.timepointType]
                .getById(this.props.row.variable);
            let fill = variable.colorScale(d.value);
            if (d.value === undefined) {
                stroke = 'lightgray';
                fill = 'white';
            }
            if (this.props.dataStore.selectedPatients.includes(d.patient)) {
                stroke = 'black';
            }
            let str;

            if (variable.datatype === 'NUMBER') {
                str = getScientificNotation(d.value);
            } else if (variable.derived && variable.datatype === 'ORDINAL' && variable.modification.type === 'continuousTransform') {
                str = `${d.value} (${getScientificNotation(this.props.dataStore.variableStores[this.props.timepointType].getById(variable.originalIds[0]).mapper[d.sample])})`;
            } else {
                str = d.value;
            }
            rects.push(<rect
                className={`heatmap ind ${d.patient}`}
                stroke={stroke}
                onMouseEnter={e => this.handleMouseEnter(e, d.patient, str)}
                onMouseLeave={this.handleMouseLeave}
                onMouseDown={e => this.handleMouseDown(e, d.patient)}
                onMouseUp={this.handleMouseUp}
                onDoubleClick={() => this.handleDoubleClick(d.patient)}
                onContextMenu={e => this.handleRightClick(e, d.patient, this.props.timepointIndex)}
                key={d.patient}
                height={this.props.height}
                width={this.props.rectWidth}
                x={this.props.heatmapScale(d.patient) + this.props.xOffset}
                fill={fill}
                opacity={this.props.opacity}
            />);
            if (d.value === undefined) {
                rects.push(<line
                    className='heatmap ind undefined'
                    stroke={stroke}
                    key={`${d.patient}UNDEFINED`}
                    height={this.props.height}
                    width={this.props.rectWidth}
                    x1={this.props.heatmapScale(d.patient) + this.props.xOffset}
                    x2={this.props.heatmapScale(d.patient) + this.props.xOffset
                    + this.props.rectWidth}
                    y1={0}
                    y2={this.props.height}
                    opacity={this.props.opacity}
                />);
            }
        });
        return rects;
    }

    /**
     * point to cbio to show more patient specific informatiom
     * @param {string} patient
     */
    handleDoubleClick(patient) {
        if (!this.props.dataStore.rootStore.isOwnData) {
            window.open(`${this.props.dataStore.rootStore.cBioLink}/patient?studyId=${this.props.dataStore.rootStore.study.studyId}&caseId=${patient}`);
        }
    }

    /**
     * when mouse button is pressed activate dragging
     * @param {event} event
     * @param {string} patient
     */
    handleMouseDown(event, patient) {
        if (event.button === 0) {
            // stop event propagation to prevent dragging the entire panel
            event.stopPropagation();
            if (!this.state.dragging) {
                this.props.dataStore.handlePatientSelection(patient);
            }
            this.setState({
                dragging: true,
            });
        }
    }

    /**
     * when mouse button is released deactivate dragging
     */
    handleMouseUp() {
        this.setState({
            dragging: false,
        });
    }

    handleMouseEnter(event, patient, value) {
        if (this.state.dragging) {
            this.props.dataStore.handlePatientSelection(patient);
        } else {
            this.props.showTooltip(event, `${patient}: ${value}`);
        }
    }

    handleMouseLeave() {
        this.props.hideTooltip();
    }

    /**
     * open context menu for moving a patient/patients
     * @param {event} e
     * @param {string} patient
     * @param {number} timepointIndex
     * @param {number} xposition
     */
    handleRightClick(e, patient, timepointIndex, xposition) {
        e.preventDefault();
        this.setState({
            dragging: false,
        });
        this.props.showContextMenuHeatmapRow(e, patient, timepointIndex, xposition);
    }


    render() {
        return (
            this.getRow()
        );
    }
}));
HeatmapRow.propTypes = {
    row: MobxPropTypes.observableObject.isRequired,
    timepointType: PropTypes.string.isRequired,
    timepointIndex: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    rectWidth: PropTypes.number.isRequired,
    opacity: PropTypes.number.isRequired,
    heatmapScale: PropTypes.func.isRequired,
    xOffset: PropTypes.number.isRequired,
    showTooltip: PropTypes.func.isRequired,
    hideTooltip: PropTypes.func.isRequired,
    showContextMenuHeatmapRow: PropTypes.func.isRequired,
};
export default HeatmapRow;
