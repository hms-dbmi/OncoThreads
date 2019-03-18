import React from 'react';
import {inject, observer, Provider} from 'mobx-react';
import {Button, Col, Grid, Row, Tab, Tabs} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';


import RowOperators from "./RowOperators/RowOperators"

import GlobalRowOperators from "./RowOperators/GlobalRowOperators"

import Legend from "./Legend"
import GlobalTimeAxis from "./PlotLabeling/GlobalTimeAxis";
import GlobalBands from "./PlotLabeling/GlobalBands";


import TimeAssign from "./PlotLabeling/TimeAssign";
import TimepointLabels from "./PlotLabeling/TimepointLabels";
import GlobalTimeline from "./GlobalTimeline";
import BlockView from "./BlockView";

/**
 * Component containing the main visualization
 */
const MainView = inject("rootStore", "uiStore", "undoRedoStore")(observer(class MainView extends React.Component {
    constructor(props) {
        super(props);
        this.handleTimeClick = this.handleTimeClick.bind(this);
        this.handleSwitchView = this.handleSwitchView.bind(this);
        this.setHighlightedVariable = this.setHighlightedVariable.bind(this);
        this.removeHighlightedVariable = this.removeHighlightedVariable.bind(this);
        this.state = {
            highlightedVariable: '', // variableId of currently highlighted variable
        }
    }

    /**
     * sets a variable to be highlighted
     * @param {string} newHighlighted
     */
    setHighlightedVariable(newHighlighted) {
        this.setState({highlightedVariable: newHighlighted});
    }

    /**
     * removes the highlighted variable
     */
    removeHighlightedVariable() {
        this.setState({highlightedVariable: ''});
    }

    /**
     * handle visualizing real time
     */
    handleTimeClick() {
        this.props.rootStore.dataStore.applyPatientOrderToAll(0);
        this.props.uiStore.setRealTime(!this.props.uiStore.realTime);
        this.props.undoRedoStore.saveRealTimeHistory(this.props.uiStore.realTime);
    }

    /**
     * handles switching to global timeline and back
     * @param {boolean} key - global timeline (true) or block view (false)
     */
    handleSwitchView(key) {
        if (key !== this.props.uiStore.globalTime) {
            this.props.uiStore.setGlobalTime(key);
            this.props.undoRedoStore.saveSwitchHistory(this.props.uiStore.globalTime);
        }
    }

    /**
     * Gets block view
     * @return {div}
     */
    getBlockView() {
        return (
            <div>
                <div className="view" id="block-view">
                    <Row>
                        <Button bsSize="xsmall" onClick={this.handleTimeClick}
                                disabled={this.props.uiStore.globalTime || this.props.rootStore.dataStore.variableStores.between.currentVariables.length > 0}
                                key={"actualTimeline"}>
                            <FontAwesome
                                name="clock"/> {(this.props.uiStore.realTime) ? "Hide relative time" : "Show relative time"}
                        </Button>
                    </Row>
                    <Row>
                        <Col lg={1} md={1} xs={1} style={{padding: 0}}>
                            <Provider dataStore={this.props.rootStore.dataStore}
                                      visStore={this.props.rootStore.visStore}>
                                <TimepointLabels{...this.props.tooltipFunctions}/>
                            </Provider>
                        </Col>
                        <Col lg={2} xs={2} md={2} style={{padding: 0, marginTop: 20}}>
                            <RowOperators highlightedVariable={this.state.highlightedVariable}
                                          setHighlightedVariable={this.setHighlightedVariable}
                                          removeHighlightedVariable={this.removeHighlightedVariable}
                                          tooltipFunctions={this.props.tooltipFunctions}
                                          showContextMenu={this.props.showContextMenu}
                                          openBinningModal={this.props.openBinningModal}/>

                        </Col>
                        <Col lg={8} xs={7} md={7} style={{padding: 0, marginTop: 20}}>
                            <BlockView showContextMenuHeatmapRow={this.props.showContextMenuHeatmapRow}
                                       tooltipFunctions={this.props.tooltipFunctions}/>
                        </Col>
                        <Col lg={1} xs={2} md={2} style={{padding: 0, marginTop: 20}}>
                            <Legend highlightedVariable={this.state.highlightedVariable}
                                    setHighlightedVariable={this.setHighlightedVariable}
                                    removeHighlightedVariable={this.removeHighlightedVariable}
                                    {...this.props.tooltipFunctions}/>
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

    /**
     * gets global timeline view
     * @return {div}
     */
    getGlobalView() {
        const globalPrimaryName = this.props.rootStore.dataStore.variableStores.sample.fullCurrentVariables.filter(d1 => d1.id === this.props.rootStore.dataStore.globalPrimary)[0].name;
        return (
            <div>
                <div className="view" id="timeline-view">
                    <Row>
                        <Col xs={2} md={2} style={{padding: 0}}>
                            <TimeAssign/>
                            <Provider dataStore={this.props.rootStore.dataStore}
                                      visStore={this.props.rootStore.visStore}>
                                <GlobalRowOperators tooltipFunctions={this.props.tooltipFunctions}/>
                            </Provider>

                            <h5>{"Legend of " + globalPrimaryName}</h5>
                            <Legend  {...this.props.tooltipFunctions}/>
                        </Col>
                        <Col xs={1} md={1} style={{padding: 0, width: 55}}>
                            <GlobalTimeAxis timeValue={this.props.rootStore.timeValue}
                                            width={55}/>
                        </Col>
                        <Col xs={9} md={9} style={{padding: 0, overflow: "hidden"}}>
                            <GlobalBands timeValue={this.props.rootStore.timeValue}/>
                            <GlobalTimeline showContextMenuHeatmapRow={this.props.showContextMenuHeatmapRow}
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
        //create  views
        let blockView = null;
        let timelineView = null;
        if (!this.props.uiStore.globalTime) {
            blockView = this.getBlockView();
        }
        else {
            timelineView = this.getGlobalView();
        }
        return (
            <Grid fluid={true}>
                <Tabs mountOnEnter unmountOnExit animation={false}
                      activeKey={this.props.uiStore.globalTime}
                      onSelect={this.handleSwitchView} id={"viewTab"}>
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
}));
export default MainView;