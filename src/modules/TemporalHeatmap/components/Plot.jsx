import React from 'react';
import {observer} from 'mobx-react';
import Timepoints from "./Timepoints"
import Transitions from "./Transitions"
import * as d3 from "d3";
/*
creates the plot with timepoints and transitions
 */
const Plot = observer(class Plot extends React.Component {
    constructor() {
        super();
        this.state = ({
            selectedPatients: []
        });
        this.handlePatientSelection = this.handlePatientSelection.bind(this);
    }

    /**
     * Creates scales ecoding the positions for the different patients in the heatmap (one scale per timepoint)
     * @param w: width of the plot
     * @param rectWidth: width of a heatmap cell
     * @returns heatmap scales
     */
    createSampleHeatMapScales(w, rectWidth) {
        return this.props.patientOrderPerTimepoint.map(function (d, i) {
            return d3.scalePoint()
                .domain(d)
                .range([0, w - rectWidth]);
        })
    }

    /**
     * handles currently selected patients
     * @param patient
     */
    handlePatientSelection(patient) {
        let patients = this.state.selectedPatients.slice();
        if (patients.includes(patient)) {
            patients.splice(patients.indexOf(patient), 1)
        }
        else {
            patients.push(patient);
        }
        this.setState({
            selectedPatients: patients
        });
    }

    /**
     * creates scales for computing the length of the partitions in grouped timepoints
     * @param w: width of the plot
     */
    createGroupScale(w) {
        return (d3.scaleLinear().domain([0, this.props.store.numberOfPatients]).range([0, w]));

    }

    render() {
        const sampleHeatmapScales = this.createSampleHeatMapScales(this.props.heatmapWidth, this.props.visMap.sampleRectWidth);
        const groupScale = this.createGroupScale(this.props.heatmapWidth);
        let transform = "translate(0," + 20 + ")";
        return (
            <div className="view">
            <svg width={this.props.width} height={this.props.height}>
                <g transform={transform}>
                    <Timepoints {...this.props}
                                yPositions={this.props.timepointY}
                                primaryHeight={this.props.visMap.primaryHeight}
                                groupScale={groupScale}
                                heatmapScales={sampleHeatmapScales}
                                onDrag={this.handlePatientSelection}
                                selectedPatients={this.state.selectedPatients}/>


                    <Transitions {...this.props} transitionData={this.props.transitionStore.transitionData}
                                 timepointData={this.props.store.timepointData}
                                 yPositions={this.props.transY}
                                 height={this.props.transitionSpace} groupScale={groupScale}
                                 heatmapScales={sampleHeatmapScales}
                                 selectedPatients={this.state.selectedPatients}/>

                </g>
            </svg>
            </div>
        )
    }
});
export default Plot;