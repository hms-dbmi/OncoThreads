import React from 'react';
import {observer} from 'mobx-react';
import {Button, ButtonToolbar, Col, DropdownButton, Grid, MenuItem, Row} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';


import RowOperators from "./RowOperators/RowOperators"

import GlobalRowOperators from "./RowOperators/GlobalRowOperators"

import Legend from "./Legend"
import Plot from "./Plot";
import GlobalTimeAxis from "./PlotLabeling/GlobalTimeAxis";
import TimeAssign from "./PlotLabeling/TimeAssign";
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
        this.handleTimeClick = this.handleTimeClick.bind(this);
        this.handleGlobalTimeClick = this.handleGlobalTimeClick.bind(this);
        this.handleResetAll = this.handleResetAll.bind(this);
        this.handleResetAlignment = this.handleResetAlignment.bind(this);
        this.handleResetSelection = this.handleResetSelection.bind(this);
        this.horizontalZoom = this.horizontalZoom.bind(this);
        this.setToScreenWidth = this.setToScreenWidth.bind(this);
        this.verticalZoom = this.verticalZoom.bind(this);
        this.setToScreenHeight = this.setToScreenHeight.bind(this);
        this.setHighlightedVariable = this.setHighlightedVariable.bind(this);
        this.removeHighlightedVariable = this.removeHighlightedVariable.bind(this);
        this.state = {
            horizontalZoom: props.store.numberOfPatients < 300 ? props.store.numberOfPatients : 300,
            highlightedVariable: ''
        }
    }

    setHighlightedVariable(newHighlighted) {
        this.setState({highlightedVariable: newHighlighted});
    }

    removeHighlightedVariable() {
        this.setState({highlightedVariable: ''});
    }

    handleTimeClick() {
        this.props.store.applyPatientOrderToAll(0);
        this.props.store.realTime = !this.props.store.realTime;
    }

    handleGlobalTimeClick() {
        this.props.store.globalTime = !this.props.store.globalTime;
        this.props.store.rootStore.undoRedoStore.saveSwitchHistory(this.props.store.globalTime);
    }

    handleResetAll() {
        this.props.store.rootStore.reset();
    }

    handleResetAlignment() {
        this.props.store.rootStore.resetTimepointStructure(true);
    }

    handleResetSelection() {
        this.props.store.selectedPatients = []
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
        const _self = this;
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
        this.props.visMap.setSampleRectWidth(rectWidth);
    }


    getBlockView(sampleTPHeight, betweenTPHeight, svgHeight, svgWidth, heatmapWidth, timepointPositions) {
        return (<Row>
            <Col md={1} xs={1} style={{padding: 0}}>
                <TimepointLabels sampleTPHeight={sampleTPHeight} betweenTPHeight={betweenTPHeight}
                                 timepoints={this.props.store.timepoints} width={100} height={svgHeight}
                                 posY={timepointPositions.timepoint}
                                 store={this.props.store}
                                 showTooltip={this.props.showTooltip}
                                 hideTooltip={this.props.hideTooltip}/>
            </Col>
            <Col xs={2} md={2} style={{padding: 0}}>
                <RowOperators {...this.props} height={svgHeight} width={200}
                              posY={timepointPositions.timepoint}
                              selectedPatients={this.props.store.selectedPatients}
                              currentVariables={this.props.store.currentVariables}
                              highlightedVariable={this.state.highlightedVariable}
                              setHighlightedVariable={this.setHighlightedVariable}
                              removeHighlightedVariable={this.removeHighlightedVariable}/>

            </Col>
            <Col xs={7} md={7} style={{padding: 0}}>
                <Plot
                    {...this.props} width={this.props.width} svgWidth={svgWidth} height={svgHeight}
                    horizontalZoom={this.state.horizontalZoom}
                    timepointY={timepointPositions.timepoint}
                    transY={timepointPositions.connection}
                    selectedPatients={this.props.store.selectedPatients}
                    onDrag={this.handlePatientSelection} selectPartition={this.handlePartitionSelection}/>
            </Col>
            <Col xs={2} md={2} style={{padding: 0}}>
                <Legend {...this.props} height={svgHeight} width={400} mainWidth={svgWidth}
                        posY={timepointPositions.timepoint}
                        highlightedVariable={this.state.highlightedVariable}
                        setHighlightedVariable={this.setHighlightedVariable}
                        removeHighlightedVariable={this.removeHighlightedVariable}/>
            </Col>
        </Row>);
    }

    //getGlobalView(timepointPositions) {
    getGlobalView(timepointPositions, svgHeight, svgWidth) {

        //let sampH = this.props.visMap.getTimepointHeight(1);

        //var svgH = 4 * (sampH + this.props.visMap.transitionSpace) * 1.5;

        //let svgHeight = this.props.visMap.rootStore.originalTimePointLength * (sampH + this.props.visMap.transitionSpace) * 1.5;

        //view = this.getGlobalView(this.props.visMap.timepointPositions, this.props.visMap.svgHeight, svgWidth, heatmapWidth);
        let a = this.props.store.rootStore.eventDetails;

        let b = a.filter(d => d.eventEndDate);
        let c = b.map(d => d.eventEndDate);


        let max1 = Math.max(...c);


        let max2 = this.props.store.rootStore.actualTimeLine
            .map(yPositions => yPositions.reduce((next, max) => next > max ? next : max, 0))
            .reduce((next, max) => next > max ? next : max, 0);

        let maxTime = Math.max(max1, max2);


        const globalPrimaryName = this.props.currentVariables.sample.filter(d1 => d1.id === this.props.store.rootStore.globalPrimary)[0].name;
        //console.log(current_var);
        const axisHorizontalZoom = this.state.horizontalZoom / (this.props.store.numberOfPatients < 300 ? this.props.store.numberOfPatients : 300);

        return (<Row>
            <Col xs={2} style={{padding: 0}}>
                <TimeAssign {...this.props} //timeVar={this.timeVar} timeValue={this.timeValue}
                            width={250} height={svgHeight} maxTimeInDays={maxTime}/>
                <GlobalRowOperators {...this.props} width={300}
                                    timepointVarHeight={(this.props.currentVariables.sample.length + 1) * 19}
                                    eventVarHeight={this.props.store.variableStore.between.allVariables.length * 19}
                                    posY={timepointPositions.timepoint}
                                    selectedPatients={this.props.store.selectedPatients}
                                    currentVariables={this.props.store.currentVariables}/>

                <h5>{"Legend of " + globalPrimaryName}</h5>
                <Legend {...this.props} height={svgHeight / 4}
                        width={this.props.width}
                        mainWidth={svgWidth}/>
            </Col>

            <Col md={1} style={{padding: 0, width: 100}}>
                <GlobalTimeAxis {...this.props} //timeVar={this.props.store.rootStore.timeVar}
                                timeValue={this.props.store.rootStore.timeValue}
                    //width={150}
                                width={this.props.width * 1.8 / axisHorizontalZoom}


                    //width={svgWidth+(this.props.width/12>100? this.props.width/12: 100)}
                                height={svgHeight} maxTimeInDays={maxTime}/>
            </Col>

            <Col xs={9} md={9} style={{padding: 0}}>
                <Plot {...this.props}
                      height={svgHeight}
                      svgWidth={svgWidth}
                      width={this.props.width}
                      horizontalZoom={this.state.horizontalZoom}
                      timepointY={timepointPositions.timepoint}
                      transY={timepointPositions.connection}
                      selectedPatients={this.props.store.selectedPatients}
                      onDrag={this.handlePatientSelection}/>
            </Col>


        </Row>)
    }

    horizontalZoom(event) {
        this.setState({horizontalZoom: parseInt(event.target.value, 10)});

    }

    verticalZoom(event) {
        this.props.visMap.setTransitionSpace(parseInt(event.target.value, 10));
    }

    setToScreenWidth() {
        this.setState({horizontalZoom: this.props.store.numberOfPatients < 300 ? this.props.store.numberOfPatients : 300})
    }

    setToScreenHeight() {
        this.props.visMap.fitToScreenHeight();
    }


    render() {
        /*let view;
        if (!this.props.store.globalTime) {
            view = this.getBlockView(this.props.visMap.sampleTPHeight, this.props.visMap.betweenTPHeight, this.props.visMap.svgHeight, this.props.visMap.timepointPositions);
        }
        else {
            view = this.getGlobalView(this.props.visMap.timepointPositions);
        }*/


        let rectWidth = this.props.width / 300;
        if (this.props.store.numberOfPatients < 300) {
            rectWidth = this.props.width / this.props.store.numberOfPatients - 1;
        }
        this.setVisualParameters(rectWidth);


        const heatmapWidth = this.props.store.numberOfPatients * (rectWidth + 1);
        const svgWidth = heatmapWidth + (this.props.store.maxPartitions - 1) * this.props.visMap.partitionGap + 0.5 * rectWidth;
        let view;
        if (!this.props.store.globalTime) {
            view = this.getBlockView(this.props.visMap.sampleTPHeight, this.props.visMap.betweenTPHeight, this.props.visMap.svgHeight, svgWidth, heatmapWidth, this.props.visMap.timepointPositions);
        }
        else {

            var sampH = this.props.visMap.getTimepointHeight(1);

            //var svgH = 4 * (sampH + this.props.visMap.transitionSpace) * 1.5;

            var svgH = this.props.visMap.rootStore.originalTimePointLength * (sampH + this.props.visMap.transitionSpace) * 1.5;

            //view = this.getGlobalView(this.props.visMap.timepointPositions, this.props.visMap.svgHeight, svgWidth, heatmapWidth);

            view = this.getGlobalView(this.props.visMap.timepointPositions, svgH, svgWidth, heatmapWidth);

        }
        return (
            <Grid fluid={true} onClick={this.closeContextMenu}>
                <Row>
                    <Col md={5}>
                        <ButtonToolbar>
                            <Button onClick={this.handleTimeClick}
                                    disabled={this.props.store.globalTime || this.props.store.timepoints.length === 0 || this.props.store.currentVariables.between.length > 0}
                                    key={"actualTimeline"}>
                                <FontAwesome
                                    name="clock"/> {(this.props.store.realTime) ? "Hide relative time" : "Show relative time"}
                            </Button>
                            <Button onClick={(e) => this.handleGlobalTimeClick(e)}
                                    disabled={this.props.store.realTime}
                                    key={"globalTimeline"}>
                                {(this.props.store.globalTime) ? "Switch to block view" : "Switch to timeline"}
                            </Button>
                            <DropdownButton
                                title={"Zoom"}
                                key={"zoom"}
                                id={"zoom"}
                            >
                                <div style={{padding: "5px"}}>
                                    Horizontal: <input type="range" value={this.state.horizontalZoom}
                                                       onChange={this.horizontalZoom} step={1}
                                                       min={10} max={300}/>
                                    <Button onClick={this.setToScreenWidth}>Set to screen width</Button>
                                    <br/>
                                    Vertical: <input type="range" value={this.props.visMap.transitionSpace}
                                                     onChange={this.verticalZoom} step={1}
                                                     min={5} max={700}/>
                                    <Button onClick={this.setToScreenHeight}>Set to screen height</Button>
                                </div>
                            </DropdownButton>
                        </ButtonToolbar>

                    </Col>
                    <Col md={3}>
                        <h5>{"Patients visible: " + (this.state.horizontalZoom < this.props.store.numberOfPatients ? this.state.horizontalZoom : this.props.store.numberOfPatients) + "/" + this.props.store.numberOfPatients}</h5>
                    </Col>
                    <Col md={4}>
                        <ButtonToolbar>
                            <Button onClick={this.props.store.rootStore.undoRedoStore.undo}><FontAwesome
                                name="undo"/></Button>
                            <Button onClick={this.props.store.rootStore.undoRedoStore.redo}><FontAwesome
                                name="redo"/></Button>
                            <DropdownButton
                                title={"Reset"}
                                key={"ResetButton"}
                                id={"ResetButton"}
                            >
                                <MenuItem eventKey="1" onClick={this.handleResetAlignment}>...timepoint
                                    alignment</MenuItem>
                                <MenuItem eventKey="2" onClick={this.handleResetSelection}>...selection</MenuItem>
                                <MenuItem eventKey="3" onClick={this.handleResetAll}>...all</MenuItem>
                            </DropdownButton>
                        </ButtonToolbar>
                    </Col>
                </Row>
                {view}
            </Grid>
        )

    }
});

MainView.defaultProps = {
    width: 700,
    height: 700
};

export default MainView;