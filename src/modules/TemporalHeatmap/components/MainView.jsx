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
                                disabled={this.props.store.globalTime || this.props.store.variableStores.between.currentVariables.length > 0}
                                key={"actualTimeline"}>
                            <FontAwesome
                                name="clock"/> {(this.props.store.realTime) ? "Hide relative time" : "Show relative time"}
                        </Button>
                    </Row>
                    <Row>
                        <Col lg={1} md={1} xs={1} style={{padding: 0}}>
                            <TimepointLabels store={this.props.store}
                                             {...this.props.tooltipFunctions}
                                             visMap={this.props.visMap}/>
                        </Col>
                        <Col lg={2} xs={2} md={2} style={{padding: 0}}>
                            <RowOperators highlightedVariable={this.state.highlightedVariable}
                                          setHighlightedVariable={this.setHighlightedVariable}
                                          removeHighlightedVariable={this.removeHighlightedVariable}
                                          visMap={this.props.visMap}
                                          store={this.props.store}
                                          tooltipFunctions={this.props.tooltipFunctions}
                                          showContextMenu={this.props.showContextMenu}
                                          openBinningModal={this.props.openBinningModal}/>

                        </Col>
                        <Col lg={8} xs={7} md={7} style={{padding: 0}}>
                            <Plot width={this.state.plotWidth}
                                  setPlotWidth={this.setPlotWidth}
                                    showContextMenuHeatmapRow={this.props.showContextMenuHeatmapRow}
                                  visMap={this.props.visMap}
                                  store={this.props.store}
                                  transitionStore={this.props.transitionStore}
                                  tooltipFunctions={this.props.tooltipFunctions}/>
                        </Col>
                        <Col lg={1} xs={2} md={2} style={{padding: 0}}>
                            <Legend highlightedVariable={this.state.highlightedVariable}
                                    setHighlightedVariable={this.setHighlightedVariable}
                                    removeHighlightedVariable={this.removeHighlightedVariable}
                                    timepoints={this.props.store.timepoints}
                                    {...this.props.tooltipFunctions}
                                    visMap={this.props.visMap}
                                    store={this.props.store}/>
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
        const globalPrimaryName = this.props.store.variableStores.sample.getCurrentVariables().filter(d1 => d1.id === this.props.store.globalPrimary)[0].name;
        const axisHorizontalZoom = (300 - this.props.horizontalZoom) / (this.props.store.numberOfPatients < 300 ? this.props.store.numberOfPatients : 300);
        return (
            <div>
                <div className="view" id="timeline-view">
                    <Row>
                        <Col xs={2} md={2} style={{padding: 0}}>
                            <TimeAssign store={this.props.store}/>
                            <GlobalRowOperators store={this.props.store}
                                                visMap={this.props.visMap}
                                                tooltipFunctions={this.props.tooltipFunctions}/>

                            <h5>{"Legend of " + globalPrimaryName}</h5>
                            <Legend store={this.props.store} visMap={this.props.visMap}/>
                        </Col>
                        <Col xs={1} md={1} style={{padding: 0, width: 55}}>
                            <GlobalTimeAxis store={this.props.store}
                                            visMap={this.props.visMap}
                                            timeValue={this.props.store.rootStore.timeValue}
                                            width={55}
                                            maxTimeInDays={maxTime}/>
                        </Col>
                        <Col xs={9} md={9} style={{padding: 0, overflow: "hidden"}}>

                            <GlobalBands store={this.props.store}
                                         visMap={this.props.visMap}//timeVar={this.props.store.rootStore.timeVar}
                                         width={this.state.plotWidth / axisHorizontalZoom}
                                         maxTimeInDays={maxTime}/>
                            <Plot width={this.state.plotWidth}
                                  setPlotWidth={this.setPlotWidth}
                                  visMap={this.props.visMap}
                                  store={this.props.store}
                                  transitionStore={this.props.transitionStore}
                                  tooltipFunctions={this.props.tooltipFunctions}/>
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
        if (!this.props.store.globalTime) {
            blockView = this.getBlockView();
        }
        else {
            timelineView = this.getGlobalView();
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