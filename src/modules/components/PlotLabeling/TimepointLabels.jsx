import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import BlockTextField from './BlockTextField';


/*
 * BlockView: Timepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers
 */
const TimepointLabels = inject('dataStore', 'visStore', 'uiStore')(observer(class TimepointLabels extends React.Component {
    constructor() {
        super();
        this.textFieldHeight = 30;
    }

    /**
     * sets the name of a timepoint
     * @param {number} index
     * @param {event} event
     */
    setName(index, event) {
        this.props.dataStore.timepoints[index].setName(event.target.value);
    }


    render() {
        // console.info("time lables render")
        // create textfields for sample timepoints, but not for between timepoints
        const labels = this.props.dataStore.timepoints.map((d, i) => {
            let pos = this.props.padding + this.props.visStore.timepointPositions.timepoint[i]
                + (this.props.visStore.getTPHeight(d) - this.textFieldHeight) / 2;
            if (this.props.uiStore.selectedTab==='myblock'){
                pos = this.props.padding + this.props.visStore.newTimepointPositions.timepoint[i]
                + (this.props.visStore.getTPHeight(d) - this.textFieldHeight) / 2;
            }
            let textfield = null;
            if (d.type === 'sample') {
                textfield = (
                    <BlockTextField
                        width={this.props.width > 0 ? this.props.width : 2}
                        height={this.textFieldHeight}
                        timepoint={d}
                    />
                );
            }
            return (
                <g key={d.globalIndex} transform={`translate(0,${pos})`}>
                    {textfield}
                </g>
            );
        });
        // create vertical line with whiskers at the ends
        let firstPos = this.props.padding + this.props.visStore.timepointPositions.timepoint[0]
            + this.props.visStore.getTPHeight(this.props.dataStore.timepoints[0]) / 2;
        let lastPos = this.props.padding + this.props.visStore.timepointPositions
            .timepoint[this.props.visStore.timepointPositions.timepoint.length - 1]
            + this.props.visStore.getTPHeight(this.props.dataStore
                .timepoints[this.props.dataStore.timepoints.length - 1]) / 2;

        if (this.props.uiStore.selectedTab==='myblock'){
            firstPos = this.props.padding + this.props.visStore.newTimepointPositions.timepoint[0]
            + this.props.visStore.getTPHeight(this.props.dataStore.timepoints[0]) / 2;

            lastPos = this.props.padding + this.props.visStore.newTimepointPositions
            .timepoint[this.props.visStore.timepointPositions.timepoint.length - 1]
            + this.props.visStore.getTPHeight(this.props.dataStore
                .timepoints[this.props.dataStore.timepoints.length - 1]) / 2;
        }
        return (
            <div>
                <svg
                    width={this.props.width > 0 ? this.props.width : 0}
                    height={this.props.visStore.svgHeight}
                >
                    <line
                        x1={this.props.width / 2 - 10}
                        x2={this.props.width / 2}
                        y1={firstPos}
                        y2={firstPos}
                        stroke="lightgray"
                    />
                    <line
                        x1={this.props.width / 2}
                        x2={this.props.width / 2}
                        y1={firstPos}
                        y2={lastPos}
                        stroke="lightgray"
                    />
                    <line
                        x1={this.props.width / 2 - 10}
                        x2={this.props.width / 2}
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
};
export default TimepointLabels;
