import React from 'react';
import {observer} from 'mobx-react';
import RowOperators from "./RowOperators/RowOperators"
import Legend from "./Legend"
import Plot from "./Plot";
import CurrentVariables from "./CurrentVariables";

/*
Main View
Creates the Row operators, the Plot and the Legend
Sets the basic parameters, e.g. the dimensions of the rectangles or the height of the transitions ("transition space")
 */
const MainView = observer(class MainView extends React.Component {
    constructor() {
        super();
        this.state = ({
            showSortContextMenu: "hidden",
            showGroupContextMenu: "hidden",
            showPromoteContextMenu: "hidden",
            selectedPatients: [],
        });
        this.handlePatientSelection = this.handlePatientSelection.bind(this);
        this.handlePartitionSelection = this.handlePartitionSelection.bind(this);
        this.closeContextMenu = this.closeContextMenu.bind(this);
        this.openContextMenu = this.openContextMenu.bind(this);
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
     * handles the selection of patients in a partition
     * @param patients
     */
    handlePartitionSelection(patients) {
        let selectedPatients = this.state.selectedPatients.slice();
        //isContained: true if all patients are contained
        let isContained = true;
        patients.forEach(function (d, i) {
            if (!selectedPatients.includes(d)) {
                isContained = false
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

    openContextMenu(sort, group, promote) {
        this.setState({showSortContextMenu: sort, showGroupContextMenu: group, showPromoteContextMenu: promote})
    }

    closeContextMenu() {
        this.setState({showSortContextMenu: "hidden", showGroupContextMenu: "hidden", showPromoteContextMenu: "hidden"})
    }

    handleTimeClick(event) {
        this.props.store.rootStore.realTime = !this.props.store.rootStore.realTime;
        event.target.className = (this.props.store.rootStore.realTime) ? "selected" : "notSelected";
    }

    createTimeButton() {
        const _self = this;
        if (this.props.timepoints.length === 0) {
            return (<div></div>)
        } else {
            return (
                <div>
                    <button className="btn btn-light" onClick={(e) => _self.handleTimeClick(e)}
                            key={this.props.store.rootStore.realTime}>
                        {(this.props.store.rootStore.realTime) ? "Hide actual timeline" : "Show actual timeline"}
                    </button>
                </div>
            )
        }
    }

    /**
     * set visual parameters
     * @param rectWidth
     */
    setVisualParameters(rectWidth) {
        this.props.visMap.setGap(1);
        this.props.visMap.setPartitionGap(10);
        this.props.visMap.setTransitionSpace(100);
        this.props.visMap.setSampleRectWidth(rectWidth);
        this.props.visMap.setBetweenRectWidth(rectWidth / 2);
        this.props.visMap.setPrimaryHeight(rectWidth);
        this.props.visMap.setSecondaryHeight(rectWidth / 2);
    }

    /**
     * computes the positions for sample and between timepoints
     * @param sampleTPHeight
     * @param betweenTPHeight
     * @returns {{sample: Array, between: Array}}
     */
    computeTimepointPositions(sampleTPHeight, betweenTPHeight) {
        let timepointPositions = {"sample": [], "between": []};
        let prevY = 0;
        for (let i = 0; i < this.props.timepoints.length; i++) {
            let tpHeight;
            if (this.props.timepoints[i].type === "between") {
                tpHeight = betweenTPHeight;
            }
            else {
                tpHeight = sampleTPHeight;
            }
            timepointPositions.sample.push(prevY);
            timepointPositions.between.push(prevY + tpHeight);
            prevY += this.props.visMap.transitionSpace + tpHeight;
        }
        return timepointPositions;
    }

    render() {
        //the width of the heatmap cells is computed relative to the number of patients
        let rectWidth = this.props.width / 50 - 1;
        if (this.props.store.numberOfPatients < 50) {
            rectWidth = this.props.width / this.props.store.numberOfPatients - 1;
        }
        this.setVisualParameters(rectWidth);
        const sampleTPHeight = this.props.visMap.getTimepointHeight(this.props.currentVariables.sample.length);
        const betweenTPHeight = this.props.visMap.getTimepointHeight(this.props.currentVariables.between.length);
        const timepointPositions = this.computeTimepointPositions(sampleTPHeight, betweenTPHeight);

        const heatmapWidth = this.props.store.numberOfPatients * (rectWidth + 1);
        const svgWidth = heatmapWidth + (this.props.store.maxPartitions - 1) * this.props.visMap.partitionGap + 0.5 * rectWidth;
        const svgHeight = this.props.store.timepoints.length * (sampleTPHeight + betweenTPHeight + this.props.visMap.transitionSpace);
        return (
            <div onClick={this.closeContextMenu}>
                {this.createTimeButton()}
                <CurrentVariables store={this.props.store} currentVariables={this.props.currentVariables} width={svgWidth}/>
                <RowOperators {...this.props} height={svgHeight}
                              svgHeight={svgHeight} svgWidth={200}
                              posY={timepointPositions.sample}
                              openContextMenu={this.openContextMenu}
                              showSortContextMenu={this.state.showSortContextMenu}
                              showGroupContextMenu={this.state.showGroupContextMenu}
                              showPromoteContextMenu={this.state.showPromoteContextMenu}
                              selectedPatients={this.state.selectedPatients}/>
                <Plot {...this.props} viewWidth={this.props.width} width={svgWidth} height={svgHeight}
                      heatmapWidth={heatmapWidth}
                      timepointY={timepointPositions.sample}
                      transY={timepointPositions.between}
                      selectedPatients={this.state.selectedPatients}
                      onDrag={this.handlePatientSelection} selectPartition={this.handlePartitionSelection}/>
                <Legend {...this.props} height={svgHeight}
                        posY={timepointPositions.sample}/>
            </div>
        )
    }
});
MainView.defaultProps = {
    width: 850
};
export default MainView;