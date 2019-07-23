import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import BlockTextField from './BlockTextField';


/*
 * BlockView: Timepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers
 */
const TimepointLabels = inject('dataStore', 'visStore', 'undoRedoStore')(observer(class TimepointLabels extends React.Component {
    constructor() {
        super();
        this.textFieldHeight = 30;
        this.iconDimension = 20;
    }

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
        // create textfields for sample timepoints, but not for between timepoints
        const labels = this.props.dataStore.timepoints.map((d, i) => {
            const pos = this.props.padding + this.props.visStore.timepointPositions.timepoint[i]
                + (this.props.visStore.getTPHeight(d) - this.textFieldHeight) / 2;
            let textfield = null;
            if (d.type === 'sample') {
                textfield = (
                    <BlockTextField
                        width={this.props.width - this.iconDimension}
                        height={this.textFieldHeight}
                        timepoint={d}
                    />
                );
            }
            return (
                <g key={d.globalIndex} transform={`translate(0,${pos})`}>
                    {textfield}
                    <g
                        transform={`translate(${this.props.width - (this.iconDimension)},${(this.textFieldHeight - this.iconDimension) / 2 - 1})`}
                        className="not_exported"
                        onMouseEnter={e => this.props.showTooltip(e, 'Realign patients')}
                        onMouseLeave={this.props.hideTooltip}
                    >
                        <path
                            fill="gray"
                            d="M9,3V21H11V3H9M5,3V21H7V3H5M13,3V21H15V3H13M19,3H17V21H19V3Z"
                        />
                        <rect
                            onClick={() => this.realignPatients(d.globalIndex)}
                            width={this.iconDimension}
                            height={this.iconDimension}
                            fill="none"
                            pointerEvents="visible"
                        />
                    </g>
                </g>
            );
        });
        // create vertical line with whiskers at the ends
        const firstPos = this.props.padding + this.props.visStore.timepointPositions.timepoint[0]
            + this.props.visStore.getTPHeight(this.props.dataStore.timepoints[0]) / 2;
        const lastPos = this.props.padding + this.props.visStore.timepointPositions
            .timepoint[this.props.visStore.timepointPositions.timepoint.length - 1]
            + this.props.visStore.getTPHeight(this.props.dataStore
                .timepoints[this.props.dataStore.timepoints.length - 1]) / 2;
        return (
            <div>
                <svg width={this.props.width} height={this.props.visStore.svgHeight}>
                    <line
                        x1={this.props.width / 2 - this.iconDimension}
                        x2={(this.props.width - this.iconDimension) / 2}
                        y1={firstPos}
                        y2={firstPos}
                        stroke="lightgray"
                    />
                    <line
                        x1={(this.props.width - this.iconDimension) / 2}
                        x2={(this.props.width - this.iconDimension) / 2}
                        y1={firstPos}
                        y2={lastPos}
                        stroke="lightgray"
                    />
                    <line
                        x1={(this.props.width) / 2 - this.iconDimension}
                        x2={(this.props.width - this.iconDimension) / 2}
                        y1={lastPos}
                        y2={lastPos}
                        stroke="lightgray"
                    />
                    <text
                        y={this.props.padding - 5}
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
    padding: PropTypes.number.isRequired,
    showTooltip: PropTypes.func.isRequired,
    hideTooltip: PropTypes.func.isRequired,
};
export default TimepointLabels;
