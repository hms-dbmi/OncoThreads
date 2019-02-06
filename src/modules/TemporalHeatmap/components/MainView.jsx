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
        this.props.store.toggleRealtime();
    }

    handleGlobalTimeClick(key) {
        if (key !== this.props.globalTime) {
            this.props.store.setGlobalTime(key);
            this.props.store.rootStore.undoRedoStore.saveSwitchHistory(this.props.globalTime);
        }
    }


    /**
     * handles currently selected patients
     * @param patient
     */
    handlePatientSelection(patient) {
        if (this.props.selectedPatients.includes(patient)) {
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
            if (!_self.props.selectedPatients.includes(d)) {
                isContained = false
            }
        });
        //If not all patients are contained, add the patients that are not contained to the selected patients
        if (!isContained) {
            patients.forEach(function (d) {
                if (!_self.props.selectedPatients.includes(d)) {
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


    getBlockView() {
        return (
            <div>
                <div className="view" id="block-view">
                    <Row>
                        <Button bsSize="xsmall" onClick={this.handleTimeClick}
                                disabled={this.props.globalTime || this.props.currentVariables.between.length > 0}
                                key={"actualTimeline"}>
                            <FontAwesome
                                name="clock"/> {(this.props.realTime) ? "Hide relative time" : "Show relative time"}
                        </Button>
                    </Row>
                    <Row>
                        <Col lg={1} md={1} xs={1} style={{padding: 0}}>
                            <TimepointLabels timepoints={this.props.timepoints} height={this.props.visMap.svgHeight}
                                             store={this.props.store}
                                             showTooltip={this.props.showTooltip}
                                             hideTooltip={this.props.hideTooltip}
                                             visMap={this.props.visMap}
                                             sidebarVisible={this.props.sidebarVisible}/>
                        </Col>
                        <Col lg={2} xs={2} md={2} style={{padding: 0}}>
                            <RowOperators {...this.props} height={this.props.visMap.svgHeight}
                                          posY={this.props.visMap.timepointPositions.timepoint}
                                          selectedPatients={this.props.selectedPatients}
                                          highlightedVariable={this.state.highlightedVariable}
                                          setHighlightedVariable={this.setHighlightedVariable}
                                          removeHighlightedVariable={this.removeHighlightedVariable}/>

                        </Col>
                        <Col lg={8} xs={7} md={7} style={{padding: 0}}>
                            <Plot {...this.props}
                                  width={this.state.plotWidth} height={this.props.visMap.svgHeight}
                                  transitionOn={this.props.store.transitionOn}
                                  actualTimeLine={this.props.store.rootStore.actualTimeLine}
                                  showUndefined={this.props.store.rootStore.showUndefined}

                                  timepointY={this.props.visMap.timepointPositions.timepoint}
                                  transY={this.props.visMap.timepointPositions.connection}
                                  setPlotWidth={this.setPlotWidth}

                                  sampleRectWidth={this.props.visMap.sampleRectWidth}
                                  primaryHeight={this.props.visMap.primaryHeight}
                                  secondaryHeight={this.props.visMap.secondaryHeight}
                                  gap={this.props.visMap.gap}

                                  heatmapWidth={this.props.visMap.heatmapWidth}
                                  svgWidth={this.props.visMap.svgWidth}

                                  onDrag={this.handlePatientSelection}
                                  selectPartition={this.handlePartitionSelection}/>
                        </Col>
                        <Col lg={1} xs={2} md={2} style={{padding: 0}}>
                            <Legend {...this.props} height={this.props.visMap.svgHeight}
                                    mainWidth={this.props.visMap.svgWidth}
                                    posY={this.props.visMap.timepointPositions.timepoint}
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

    getGlobalView() {
        let maxTime = this.props.store.rootStore.maxTimeInDays;
        const globalPrimaryName = this.props.currentVariables.sample.filter(d1 => d1.id === this.props.store.globalPrimary)[0].name;
        const axisHorizontalZoom = (300 - this.props.horizontalZoom) / (this.props.numberOfPatients < 300 ? this.props.numberOfPatients : 300);
        return (
            <div>
                <div className="view" id="timeline-view">
                    <Row>
                        <Col xs={2} md={2} style={{padding: 0}}>
                            <TimeAssign {...this.props} //timeVar={this.timeVar} timeValue={this.timeValue}
                                        width={250} height={this.props.visMap.svgHeight} maxTimeInDays={maxTime}/>
                            <GlobalRowOperators {...this.props} width={300}
                                                timepointVarHeight={(this.props.currentVariables.sample.length + 1) * 19}
                                                eventVarHeight={this.props.store.variableStores.between.getVariablesOfType("event").length * 19}
                                                posY={this.props.visMap.timepointPositions.timepoint}
                                                selectedPatients={this.props.selectedPatients}/>

                            <h5>{"Legend of " + globalPrimaryName}</h5>
                            <Legend {...this.props} height={this.props.visMap.svgHeight / 4}
                                    mainWidth={this.props.visMap.svgWidth}/>
                        </Col>
                        <Col xs={1} md={1} style={{padding: 0, width: 55}}>
                            <GlobalTimeAxis {...this.props} //timeVar={this.props.store.rootStore.timeVar}
                                            timeValue={this.props.store.rootStore.timeValue}
                                //width={this.state.plotWidth / axisHorizontalZoom}
                                            width={55}
                                            height={this.props.visMap.svgHeight} maxTimeInDays={maxTime}/>
                        </Col>
                        <Col xs={9} md={9} style={{padding: 0, overflow: "hidden"}}>

                            <GlobalBands {...this.props} //timeVar={this.props.store.rootStore.timeVar}
                                         timeValue={this.props.store.rootStore.timeValue}
                                         width={this.state.plotWidth / axisHorizontalZoom}
                                         height={this.props.visMap.svgHeight} maxTimeInDays={maxTime}/>
                            <Plot {...this.props}
                                 heatmapWidth={this.props.visMap.heatmapWidth}
                                  svgWidth={this.props.visMap.svgWidth}
                                  transitionOn={this.props.store.transitionOn}
                                  actualTimeLine={this.props.store.rootStore.actualTimeLine}
                                  height={this.props.visMap.svgHeight}
                                  width={this.state.plotWidth / axisHorizontalZoom}
                                  sampleRectWidth={this.props.visMap.sampleRectWidth}
                                  primaryHeight={this.props.visMap.primaryHeight}
                                  secondaryHeight={this.props.visMap.secondaryHeight}
                                  gap={this.props.visMap.gap}
                                  setPlotWidth={this.setPlotWidth}
                                  horizontalZoom={300 - this.props.horizontalZoom}
                                  timepointY={this.props.visMap.timepointPositions.timepoint}
                                  transY={this.props.visMap.timepointPositions.connection}
                                  selectedPatients={this.props.selectedPatients}
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
        this.props.visMap.setVisParameters(this.state.plotWidth, 300 - this.props.horizontalZoom, this.props.maxPartitions);
        let blockView = null;
        let timelineView = null;
        if (!this.props.globalTime) {
            blockView = this.getBlockView();
        }
        else {
            timelineView = this.getGlobalView();
        }
        return (
            <Grid fluid={true} onClick={this.closeContextMenu}>
                <Tabs mountOnEnter unmountOnExit animation={false}
                      activeKey={this.props.globalTime}
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