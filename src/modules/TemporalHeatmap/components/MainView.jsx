import React from 'react';
import {observer} from 'mobx-react';
import {Button, ButtonToolbar, Col, Grid, Row} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';


import RowOperators from "./RowOperators/RowOperators"

import GlobalRowOperators from "./RowOperators/GlobalRowOperators"

import Legend from "./Legend"
import Plot from "./Plot";
import PatientAxis from "./PlotLabeling/PatientAxis";
import GlobalTimeAxis from "./PlotLabeling/GlobalTimeAxis";
import TimepointLabels from "./PlotLabeling/TimepointLabels";


/*
Main View
Creates the Row operators, the Plot and the Legend
Sets the basic parameters, e.g. the dimensions of the rectangles or the height of the transitions ("transition space")
 */
const MainView = observer(class MainView extends React.Component {
    constructor(props) {
        super(props);
        this.handlePatientSelection = this.handlePatientSelection.bind(this);
        this.handlePartitionSelection = this.handlePartitionSelection.bind(this);
        this.handleTimeClick=this.handleTimeClick.bind(this);
        this.handleGlobalTimeClick=this.handleGlobalTimeClick.bind(this);
    }


    handleTimeClick() {
        this.props.store.applyPatientOrderToAll(0);
        this.props.store.rootStore.realTime = !this.props.store.rootStore.realTime;
    }
     handleGlobalTimeClick() {
        this.props.store.applyPatientOrderToAll(0);
        this.props.store.ungroupEverything();
        this.props.store.rootStore.globalTime = !this.props.store.rootStore.globalTime;
    }


    /**
     * handles currently selected patients
     * @param patient
     */
    handlePatientSelection(patient) {
        if (this.props.store.selectedPatients.includes(patient)) {
            this.props.store.removePatientFromSelection(patient)
        }
        else {
            this.props.store.addPatientToSelection(patient);
        }
    }




    /**
     * handles the selection of patients in a partition
     * @param patients
     */
    handlePartitionSelection(patients) {
        const _self=this;
        //isContained: true if all patients are contained
        let isContained = true;
        patients.forEach(function (d, i) {
            if (!_self.props.store.selectedPatients.includes(d)) {
                isContained = false
            }
        });
        //If not all patients are contained, add the patients that are not contained to the selected patients
        if (!isContained) {
            patients.forEach(function (d) {
                if (!_self.props.store.selectedPatients.includes(d)) {
                    _self.props.store.addPatientToSelection(d);
                }
            });
        }
        //If all the patients are already contained, remove them from selected patients
        else {
            patients.forEach(function (d) {
                _self.props.store.removePatientFromSelection(d);
            });
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
        this.props.visMap.setPrimaryHeight(30);
        this.props.visMap.setSecondaryHeight(30 / 2);
    }

    /**
     * computes the positions for sample and between timepoints
     * @param sampleTPHeight
     * @param betweenTPHeight
     * @returns {{sample: Array, between: Array}}
     */
    computeTimepointPositions(sampleTPHeight, betweenTPHeight) {
        let timepointPositions = {"timepoint": [], "connection": []};
        let prevY = 0;
        for (let i = 0; i < this.props.timepoints.length; i++) {
            let tpHeight;
            if (this.props.timepoints[i].type === "between") {
                tpHeight = betweenTPHeight;
            }
            else {
                tpHeight = sampleTPHeight;
            }
            timepointPositions.timepoint.push(prevY);
            timepointPositions.connection.push(prevY + tpHeight);
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
        let height = 0;
        if (sampleTPHeight === 0) {
            height = betweenTPHeight;
        }
        else if (betweenTPHeight === 0) {
            height = sampleTPHeight;
        }
        else {
            height = (sampleTPHeight + betweenTPHeight) / 2
        }
        var svgHeight = this.props.store.timepoints.length * (height + this.props.visMap.transitionSpace);
        if(!this.props.store.rootStore.globalTime){
            return (
                <Grid fluid={true} onClick={this.closeContextMenu}>
                    <Row>
                        <Col md={5}>
                            <ButtonToolbar>
                                <Button onClick={this.props.store.rootStore.reset}><FontAwesome
                                    name="undo"/> Reset</Button>
                                <Button onClick={this.handleTimeClick}
                                        disabled={this.props.store.rootStore.globalTime||this.props.store.timepoints.length === 0 || this.props.store.currentVariables.between.length > 0}
                                        key={"actualTimeline"}>
                                    <FontAwesome
                                        name="clock"/> {(this.props.store.rootStore.realTime) ? "Hide relative time" : "Show relative time"}
                                </Button>
                                <Button onClick={(e) => this.handleGlobalTimeClick(e)}
                                        disabled={this.props.store.rootStore.realTime}
                                        key={this.props.store.rootStore.globalTime}>
                                    {(this.props.store.rootStore.globalTime) ? "Hide global timeline" : "Show global timeline"}
                                </Button>
                            </ButtonToolbar>
                        </Col>
                        <Col md={7}>
                            <PatientAxis width={400} height={60}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={1} style={{padding: 0}}>
                            <TimepointLabels sampleTPHeight={sampleTPHeight} betweenTPHeight={betweenTPHeight}
                                            timepoints={this.props.store.timepoints} width={100} height={svgHeight}
                                            posY={timepointPositions.timepoint}/>
                        </Col>
                        <Col xs={2} md={2} style={{padding: 0}}>
                            <RowOperators {...this.props} height={svgHeight} width={200}
                                        posY={timepointPositions.timepoint}
                                        selectedPatients={this.props.store.selectedPatients}
                                        currentVariables={this.props.store.currentVariables}/>

                        </Col>
                        <Col xs={8} md={7} style={{padding: 0}}>
                            <Plot {...this.props} width={this.props.width} svgWidth={svgWidth} height={svgHeight}
                                heatmapWidth={heatmapWidth}
                                timepointY={timepointPositions.timepoint}
                                transY={timepointPositions.connection}
                                selectedPatients={this.props.store.selectedPatients}
                                onDrag={this.handlePatientSelection} selectPartition={this.handlePartitionSelection}/>
                        </Col>
                        <Col xs={2} md={2} style={{padding: 0}}>
                            <Legend {...this.props} mainWidth={svgWidth} height={svgHeight} width={400}
                                    posY={timepointPositions.timepoint}/>
                        </Col>
                    </Row>
                </Grid>
            )
        }  
        else{

            var sampH=this.props.visMap.getTimepointHeight(1);
            /*if(this.props.store.currentVariables.between.length===0){ //since there's no transition variables, the default window height is small, so making it larger
                svgHeight =this.props.store.timepoints.length * (sampH + this.props.visMap.transitionSpace) * 1.5;
            }
            else{
                svgHeight = Math.floor((this.props.store.timepoints.length/2)) * (sampH + this.props.visMap.transitionSpace) * 1.5;
            }*/

            svgHeight =4 * (sampH + this.props.visMap.transitionSpace) * 1.5;


            let a = this.props.store.rootStore.eventDetails;

            let b = a.filter(d => d.eventEndDate);
            let c = b.map(d => d.eventEndDate);
    
    
            let max1 = Math.max(...c);
    
    
            let max2 = this.props.store.rootStore.actualTimeLine
                .map(yPositions => yPositions.reduce((next, max) => next > max ? next : max, 0))
                .reduce((next, max) => next > max ? next : max, 0);
    
            var maxTime = Math.max(max1, max2);



            return (
                <Grid fluid={true} onClick={this.closeContextMenu}>
                    <Row>
                        <Col md={5}>
                            <ButtonToolbar>
                                <Button onClick={this.props.store.rootStore.reset}><FontAwesome
                                    name="undo"/> Reset</Button>
                                <Button onClick={this.handleTimeClick}
                                        disabled={this.props.store.rootStore.globalTime||this.props.store.timepoints.length === 0 || this.props.store.currentVariables.between.length > 0}
                                        key={"actualTimeline"}>
                                    <FontAwesome
                                        name="clock"/> {(this.props.store.rootStore.realTime) ? "Hide relative time" : "Show relative time"}
                                </Button>
                                <Button onClick={(e) => this.handleGlobalTimeClick(e)}
                                        key={this.props.store.rootStore.globalTime}>
                                    {(this.props.store.rootStore.globalTime) ? "Hide global timeline" : "Show global timeline"}
                                </Button>
                            </ButtonToolbar>
                        </Col>
                        <Col md={7}>
                            <PatientAxis width={400} height={60}/>
                        </Col>

                        

                    </Row>
                    <Row>
                       
                        <Col xs={2} md={2} style={{padding: 0}}>
                            <GlobalRowOperators {...this.props} height={svgHeight-20} width={200}
                                        posY={timepointPositions.timepoint}
                                        selectedPatients={this.props.store.selectedPatients}
                                        currentVariables={this.props.store.currentVariables}/>

                        </Col>
                      

                        <Col md={2}>
                            <GlobalTimeAxis width={150} height={svgHeight-20} maxTimeInDays={maxTime}/>
                        </Col>

                        <Col xs={8} md={7} style={{padding: 0}}>
                            <Plot {...this.props} width={this.props.width} svgWidth={svgWidth} height={svgHeight}
                                heatmapWidth={heatmapWidth}
                                timepointY={timepointPositions.timepoint}
                                transY={timepointPositions.connection}
                                selectedPatients={this.props.store.selectedPatients}
                                onDrag={this.handlePatientSelection} 
                                selectPartition={this.handlePartitionSelection}/>
                        </Col>
                        
                    </Row>
                </Grid>
            )
        }
    }
});
MainView.defaultProps = {
    width: 700
};
export default MainView;