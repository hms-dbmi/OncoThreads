import React from 'react';
import {observer} from 'mobx-react';
import {Button, Col, Grid, Row, Tab, Tabs} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';


import RowOperators from "./RowOperators/RowOperators"

import GlobalRowOperators from "./RowOperators/GlobalRowOperators"

import Legend from "./Legend"
import Plot from "./Plot";
import GlobalTimeAxis from "./PlotLabeling/GlobalTimeAxis";
import GlobalBands from "./PlotLabeling/GlobalBands";


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
        this.setHighlightedVariable = this.setHighlightedVariable.bind(this);
        this.removeHighlightedVariable = this.removeHighlightedVariable.bind(this);
        this.setPlotWidth = this.setPlotWidth.bind(this);
        this.state = {
            highlightedVariable: '',
            plotWidth: 700
        }
    }

    setPlotWidth(width) {
        this.setState({plotWidth: width});
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

    handleGlobalTimeClick(key) {
        if (key !== this.props.store.globalTime) {
            this.props.store.globalTime =key;
            this.props.store.rootStore.undoRedoStore.saveSwitchHistory(this.props.store.globalTime);
        }
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


    getBlockView(svgHeight, svgWidth, heatmapWidth, timepointPositions) {
        return (
            <div>
                <div className="view" id="block-view">
                    <Row>
                        <Button bsSize="xsmall" onClick={this.handleTimeClick}
                                disabled={this.props.store.globalTime || this.props.store.timepoints.length === 0 || this.props.currentVariables.between.length > 0}
                                key={"actualTimeline"}>
                            <FontAwesome
                                name="clock"/> {(this.props.store.realTime) ? "Hide relative time" : "Show relative time"}
                        </Button>
                    </Row>
                    <Row>
                        <Col lg={1} md={1} xs={1} style={{padding: 0}}>
                            <TimepointLabels timepoints={this.props.store.timepoints} height={svgHeight}
                                             store={this.props.store}
                                             showTooltip={this.props.showTooltip}
                                             hideTooltip={this.props.hideTooltip}
                                             visMap={this.props.visMap}
                                             sidebarVisible={this.props.sidebarVisible}/>
                        </Col>
                        <Col lg={2} xs={2} md={2} style={{padding: 0}}>
                            <RowOperators {...this.props} height={svgHeight}
                                          posY={timepointPositions.timepoint}
                                          selectedPatients={this.props.store.selectedPatients}
                                          highlightedVariable={this.state.highlightedVariable}
                                          setHighlightedVariable={this.setHighlightedVariable}
                                          removeHighlightedVariable={this.removeHighlightedVariable}/>

                        </Col>
                        <Col lg={8} xs={7} md={7} style={{padding: 0}}>
                            <Plot
                                {...this.props} width={this.state.plotWidth} height={svgHeight}
                                horizontalZoom={300 - this.props.horizontalZoom}
                                timepointY={timepointPositions.timepoint}
                                transY={timepointPositions.connection}
                                setPlotWidth={this.setPlotWidth}
                                selectedPatients={this.props.store.selectedPatients}
                                onDrag={this.handlePatientSelection} selectPartition={this.handlePartitionSelection}/>
                        </Col>
                        <Col lg={1} xs={2} md={2} style={{padding: 0}}>
                            <Legend {...this.props} height={svgHeight} mainWidth={svgWidth}
                                    posY={timepointPositions.timepoint}
                                    highlightedVariable={this.state.highlightedVariable}
                                    setHighlightedVariable={this.setHighlightedVariable}
                                    removeHighlightedVariable={this.removeHighlightedVariable}/>
                        </Col>
                    </Row>
                </div>
                <form id="svgform" method="post">
                    <input type="hidden" id="output_format" name="output_format" value=""/>
                    <input type="hidden" id="data" name="data" value=""/>
                </form>
            </div>
        );
    }

    getGlobalView(timepointPositions, svgHeight, svgWidth) {
        let maxTime = this.props.store.rootStore.maxTimeInDays;
        const globalPrimaryName = this.props.currentVariables.sample.filter(d1 => d1.id === this.props.store.globalPrimary)[0].name;
        const axisHorizontalZoom = (300 - this.props.horizontalZoom) / (this.props.store.numberOfPatients < 300 ? this.props.store.numberOfPatients : 300);
        return (
            <div>
                <div className="view" id="timeline-view">
                    <Row>
                        <Col xs={2} md={2} style={{padding: 0}}>
                            <TimeAssign {...this.props} //timeVar={this.timeVar} timeValue={this.timeValue}
                                        width={250} height={svgHeight} maxTimeInDays={maxTime}/>
                            <GlobalRowOperators {...this.props} width={300}
                                                timepointVarHeight={(this.props.currentVariables.sample.length + 1) * 19}
                                                eventVarHeight={this.props.store.variableStores.between.getVariablesOfType("event").length * 19}
                                                posY={timepointPositions.timepoint}
                                                selectedPatients={this.props.store.selectedPatients}/>

                            <h5>{"Legend of " + globalPrimaryName}</h5>
                            <Legend {...this.props} height={svgHeight / 4}
                                    mainWidth={svgWidth}/>
                        </Col>
                        <Col xs={1} md={1} style={{padding: 0, width: 55}}>
                            <GlobalTimeAxis {...this.props} //timeVar={this.props.store.rootStore.timeVar}
                                            timeValue={this.props.store.rootStore.timeValue}
                                //width={this.state.plotWidth / axisHorizontalZoom}
                                            width={55}
                                            height={svgHeight} maxTimeInDays={maxTime}/>
                        </Col>
                        <Col xs={9} md={9} style={{padding: 0, overflow: "hidden"}}>

                            <GlobalBands {...this.props} //timeVar={this.props.store.rootStore.timeVar}
                                         timeValue={this.props.store.rootStore.timeValue}
                                         width={this.state.plotWidth / axisHorizontalZoom}
                                         height={svgHeight} maxTimeInDays={maxTime}/>
                            <Plot {...this.props}
                                  height={svgHeight}
                                  width={this.state.plotWidth / axisHorizontalZoom}
                                  setPlotWidth={this.setPlotWidth}
                                  horizontalZoom={300 - this.props.horizontalZoom}
                                  timepointY={timepointPositions.timepoint}
                                  transY={timepointPositions.connection}
                                  selectedPatients={this.props.store.selectedPatients}
                                  onDrag={this.handlePatientSelection}/>
                        </Col>
                    </Row>
                </div>
                <form id="svgform" method="post">
                    <input type="hidden" id="output_format" name="output_format" value=""/>
                    <input type="hidden" id="data" name="data" value=""/>
                </form>
            </div>
        );
    }


    render() {
        let rectWidth = this.state.plotWidth / 300;
        if (this.props.store.numberOfPatients < 300) {
            rectWidth = this.state.plotWidth / this.props.store.numberOfPatients - 1;
        }
        this.setVisualParameters(rectWidth);


        const heatmapWidth = this.props.store.numberOfPatients * (rectWidth + 1);
        const svgWidth = heatmapWidth + (this.props.store.maxPartitions - 1) * this.props.visMap.partitionGap + 0.5 * rectWidth;
        let blockView = null;
        let timelineView = null;
        if (!this.props.store.globalTime) {
            blockView = this.getBlockView(this.props.visMap.svgHeight, svgWidth, heatmapWidth, this.props.visMap.timepointPositions);
        }
        else {
            timelineView = this.getGlobalView(this.props.visMap.timepointPositions, this.props.visMap.svgHeight, svgWidth, heatmapWidth);
        }
        return (
            <Grid fluid={true} onClick={this.closeContextMenu}>
                <Tabs mountOnEnter unmountOnExit animation={false}
                      activeKey={this.props.store.globalTime}
                      onSelect={this.handleGlobalTimeClick} id={"viewTab"}>
                    <Tab eventKey={false} style={{paddingTop: 10}} title="Block view">
                        {blockView}
                    </Tab>
                    <Tab eventKey={true} style={{paddingTop: 10}} title="Timeline">
                        {timelineView}
                    </Tab>
                </Tabs>
            </Grid>
        )

    }
});

MainView.defaultProps = {
    width: 700,
    height: 700
};

export default MainView;