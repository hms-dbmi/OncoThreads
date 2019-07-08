import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import BlockTextField from './BlockTextField';


/*
 * BlockView: Timepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers
 */
const TimepointLabels = inject('dataStore', 'visStore', 'undoRedoStore')(observer(class TimepointLabels extends React.Component {
    /**
     * sets the name of a timepoint
     * @param {number} index
     * @param {event} event
     */
    setName(index, event) {
        this.props.dataStore.timepoints[index].setName(event.target.value);
    }

    /**
     * realigns patiens so column order of patients is restored
     * @param {number} index - timepoint index
     */
    realignPatients(index) {
        this.props.dataStore.applyPatientOrderToAll(index);
        this.props.undoRedoStore.saveRealignToHistory(index);
    }

    render() {
        const iconDimension = 20;
        const gap = 10;
        // create textfields for sample timepoints, but not for between timepoints
        const labels = this.props.dataStore.timepoints.map((d, i) => {
            let pos;
            if (d.type === 'sample') {
                pos = this.props.visStore.timepointPositions.timepoint[i]
                    + this.props.visStore.getTPHeight(d) / 2 + 4;
                return (
                    <g key={d.globalIndex} transform={`translate(0,${pos})`}>
                        <BlockTextField
                            width={this.props.width - (iconDimension + gap)}
                            timepoint={d}
                        />
                        <g
                            className="not_exported"
                            transform={`translate(${this.props.width - (iconDimension + gap)},0)`}
                            onMouseEnter={e => this.props.showTooltip(e, 'Realign patients')}
                            onMouseLeave={this.props.hideTooltip}
                        >
                            <g transform="translate(0,4)">
                                <path
                                    fill="gray"
                                    d="M9,3V21H11V3H9M5,3V21H7V3H5M13,3V21H15V3H13M19,3H17V21H19V3Z"
                                />
                                <rect
                                    onClick={() => this.realignPatients(d.globalIndex)}
                                    width={iconDimension}
                                    height={iconDimension}
                                    fill="none"
                                    pointerEvents="visible"
                                />
                            </g>
                        </g>
                    </g>
                );
            }

            pos = this.props.visStore.timepointPositions.timepoint[i]
                + this.props.visStore.getTPHeight(d) / 2 + 4;
            return (
                <g
                    key={d.globalIndex}
                    className="not_exported"
                    transform={`translate(${this.props.width - (iconDimension + gap)},${pos})`}
                    onMouseEnter={e => this.props.showTooltip(e, 'Realign patients')}
                    onMouseLeave={this.props.hideTooltip}
                >
                    <g transform="translate(0,4)">
                        <path
                            fill="gray"
                            d="M9,3V21H11V3H9M5,3V21H7V3H5M13,3V21H15V3H13M19,3H17V21H19V3Z"
                        />
                        <rect
                            onClick={() => this.realignPatients(d.globalIndex)}
                            width={iconDimension}
                            height={iconDimension}
                            fill="none"
                            pointerEvents="visible"
                        />
                    </g>
                </g>
            );
        });
        const offset = 15 + this.props.visStore.getTPHeight(this.props.dataStore.timepoints[0]) / 2;
        return (
            <div>
                <svg width={this.props.width} height={this.props.visStore.svgHeight}>
                    <line
                        x1={(this.props.width - (iconDimension + gap)) / 2 - 10}
                        x2={(this.props.width - (iconDimension + gap)) / 2}
                        y1={this.props.visStore.timepointPositions.timepoint[0] + offset}
                        y2={this.props.visStore.timepointPositions.timepoint[0] + offset}
                        stroke="lightgray"
                    />
                    <line
                        x1={(this.props.width - (iconDimension + gap)) / 2}
                        x2={(this.props.width - (iconDimension + gap)) / 2}
                        y1={this.props.visStore.timepointPositions.timepoint[0] + offset}
                        y2={this.props.visStore.timepointPositions.timepoint[this.props
                            .visStore.timepointPositions.timepoint.length - 1] + offset}
                        stroke="lightgray"
                    />
                    <line
                        x1={(this.props.width - (iconDimension + gap)) / 2 - 10}
                        x2={(this.props.width - (iconDimension + gap)) / 2}
                        y1={this.props.visStore.timepointPositions.timepoint[this.props
                            .visStore.timepointPositions.timepoint.length - 1] + offset}
                        y2={this.props.visStore.timepointPositions.timepoint[this.props
                            .visStore.timepointPositions.timepoint.length - 1] + offset}
                        stroke="lightgray"
                    />
                    <text
                        y={15}
                        x={0}
                    >
                        Timepoint
                    </text>
                    {labels}
                </svg>
            </div>
        );
    }
}));
TimepointLabels.propTypes = {
    width: PropTypes.number.isRequired,
    showTooltip: PropTypes.func.isRequired,
    hideTooltip: PropTypes.func.isRequired,
};
export default TimepointLabels;
