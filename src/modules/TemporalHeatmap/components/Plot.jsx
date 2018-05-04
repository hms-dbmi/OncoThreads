import React from 'react';
import {observer} from 'mobx-react';
import Timepoints from "./Timepoints/Timepoints"
import Transitions from "./Transitions/Transitions"
import SankeyTransitionTooltip from "./Transitions/SankeyTransition/SankeyTransitionTooltip"
import * as d3 from "d3";
/*
creates the plot with timepoints and transitions
 */
const Plot = observer(class Plot extends React.Component {
    constructor() {
        super();
        this.state = ({
            selectedPatients: [],
            selectedPartitions: [],
            showTooltip: "hidden",
            tooltipX: 0,
            tooltipY: 0,
            tooltipContent: ""
        });
        this.handlePatientSelection = this.handlePatientSelection.bind(this);
        this.handlePartitionSelection = this.handlePartitionSelection.bind(this);
        this.showSankeyTooltip = this.showSankeyTooltip.bind(this);
        this.hideSankeyTooltip = this.hideSankeyTooltip.bind(this)
    }

    /**
     * Creates scales ecoding the positions for the different patients in the heatmap (one scale per timepoint)
     * @param w: width of the plot
     * @param rectWidth: width of a heatmap cell
     * @returns heatmap scales
     */
    createSampleHeatMapScales(w, rectWidth) {
        return this.props.timepoints.map(function (d, i) {
            return d3.scalePoint()
                .domain(d.heatmapOrder)
                .range([0, w - rectWidth]);
        })
    }

    /**
     * handles currently selected patients
     * @param patient
     */
    handlePatientSelection(patient) {
        console.log(patient);
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
     * handles the selection of patients in a partition
     * @param patients
     */
    handlePartitionSelection(patients) {
        let selectedPatients = this.state.selectedPatients.slice();
        //isContained: true if all patients are contained
        let isContained=true;
        patients.forEach(function (d,i) {
            if(!selectedPatients.includes(d)){
                isContained=false
            }
        });
        //If not all patients are contained, add the patients that are not contained to the selected patients
        if (!isContained) {
            patients.forEach(function (d) {
                if (!selectedPatients.includes(d)) {
                    selectedPatients.push(d);
                }
            });
        }
        //If all the patients are already contained, remove them from selected patients
        else {
            patients.forEach(function (d) {
                    selectedPatients.splice(selectedPatients.indexOf(d), 1);
            });
        }
        this.setState({
            selectedPatients: selectedPatients,
        });
    }

    showSankeyTooltip(e, source, target, count) {
        this.setState({
            showTooltip: "visible",
            tooltipX: e.pageX - 105,
            tooltipY: e.pageY - 200,
            tooltipContent: source + " -> " + target + ": " + count,
        })
    }

    hideSankeyTooltip() {
        this.setState({
            showTooltip: "hidden",
        })
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
                                    groupScale={groupScale}
                                    heatmapScales={sampleHeatmapScales}
                                    onDrag={this.handlePatientSelection}
                                    selectPartition={this.handlePartitionSelection}
                                    selectedPartitions={this.state.selectedPartitions}
                                    selectedPatients={this.state.selectedPatients}/>


                        <Transitions {...this.props} transitionData={this.props.transitionStore.transitionData}
                                     timepointData={this.props.store.timepoints}
                                     realTime={this.props.store.rootStore.realTime}
                                     yPositions={this.props.transY}
                                     groupScale={groupScale}
                                     heatmapScales={sampleHeatmapScales}
                                     height={this.props.transitionSpace}
                                     selectedPatients={this.state.selectedPatients}
                                     selectedPartitions={this.state.selectedPartitions}
                                     showTooltip={this.showSankeyTooltip}
                                     hideTooltip={this.hideSankeyTooltip}/>

                    </g>
                </svg>
                <SankeyTransitionTooltip visibility={this.state.showTooltip} x={this.state.tooltipX}
                                         y={this.state.tooltipY} content={this.state.tooltipContent}/>
            </div>
        )
    }
});
export default Plot;