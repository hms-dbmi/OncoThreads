import React from 'react';
import {inject, observer, Provider} from 'mobx-react';
import {Button, Col, Grid, Row, Tab, Tabs} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import {Pane, SortablePane} from 'react-sortable-pane';


import RowOperators from "./RowOperators/RowOperators"

import GlobalRowOperators from "./RowOperators/GlobalRowOperators"

import Legend from "./Legend"
import GlobalTimeAxis from "./PlotLabeling/GlobalTimeAxis";
import GlobalBands from "./PlotLabeling/GlobalBands";


import TimeAssign from "./PlotLabeling/TimeAssign";
import TimepointLabels from "./PlotLabeling/TimepointLabels";
import GlobalTimeline from "./GlobalTimeline";
import BlockView from "./BlockView";
import {extendObservable, reaction} from "mobx";

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
        this.updateDimensions = this.updateDimensions.bind(this);
        extendObservable(this, {
            highlightedVariable: '', // variableId of currently highlighted variable
            order: ['labels', 'operators', 'view', 'legend'],
            panes: {
                'labels': {width: (window.innerWidth - 33) / 10, active: false},
                'operators': {width: (window.innerWidth - 33) / 10, active: false},
                'view': {width: ((window.innerWidth - 33) / 10) * 7, active: false},
                'legend': {width: (window.innerWidth - 33) / 10, active: false}
            },
            active: {
                labels: false,
                operators: false,
                view: false,
                legend: false
            }
        });
        reaction(() => this.panes.view.width, width => {
            this.props.rootStore.visStore.setPlotWidth(width - 10)
        })
    }

    /**
     * Add event listener
     */
    componentDidMount() {
        this.updateDimensions();
        window.addEventListener("resize", this.updateDimensions);
    }

    /**
     * Remove event listener
     */
    componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions);

    }

    updateDimensions() {
        const prevWidth = Object.values(this.panes).map(d => d.width).reduce((a, b) =>
            a + b);
        this.panes = {
            'labels': {width: (window.innerWidth - 33) / (prevWidth / this.panes.labels.width)},
            'operators': {width: (window.innerWidth - 33) / (prevWidth / this.panes.operators.width)},
            'view': {width: (window.innerWidth - 33) / (prevWidth / this.panes.view.width)},
            'legend': {width: (window.innerWidth - 33) / (prevWidth / this.panes.legend.width)}
        };
    }

    /**
     * sets a variable to be highlighted
     * @param {string} newHighlighted
     */
    setHighlightedVariable(newHighlighted) {
        this.highlightedVariable = newHighlighted;
    }

    /**
     * removes the highlighted variable
     */
    removeHighlightedVariable() {
        this.highlightedVariable = '';
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
                        <SortablePane direction="horizontal"
                                      margin={10}
                                      order={this.order}
                                      disableEffect={true}
                                      onOrderChange={order => {
                                          this.order = order;
                                      }}
                                      onResizeStop={(e, key, dir, ref, d) => {
                                          this.panes = {
                                              ...this.panes,
                                              [key]: {width: this.panes[key].width + d.width},
                                              [this.order[this.order.length - 1]]: {width: this.panes[this.order[this.order.length - 1]].width - d.width}
                                          };
                                      }}
                                      onDragStart={(e, key) => {
                                          if (e.target.tagName === "svg") {
                                              this.active[key] = true;
                                          }
                                      }}
                                      onDragStop={(e, key) => {
                                          this.active[key] = false;
                                      }}>
                            <Pane className={this.active.labels ? "pane-active" : "pane-inactive"} key={"labels"}
                                  size={{width: this.panes.labels.width}}>
                                <Provider dataStore={this.props.rootStore.dataStore}
                                          visStore={this.props.rootStore.visStore}>
                                    <TimepointLabels{...this.props.tooltipFunctions}
                                                    width={this.panes.labels.width - 10}/>
                                </Provider>
                            </Pane>
                            <Pane className={this.active.operators ? "pane-active" : "pane-inactive"}
                                  key={"operators"}
                                  size={{width: this.panes.operators.width}} style={{paddingTop: 20}}>
                                <RowOperators highlightedVariable={this.highlightedVariable}
                                              width={this.panes.operators.width - 10}
                                              setHighlightedVariable={this.setHighlightedVariable}
                                              removeHighlightedVariable={this.removeHighlightedVariable}
                                              tooltipFunctions={this.props.tooltipFunctions}
                                              showContextMenu={this.props.showContextMenu}
                                              openBinningModal={this.props.openBinningModal}/>
                            </Pane>
                            <Pane className={this.active.view ? "pane-active" : "pane-inactive"} key={"view"}
                                  size={{width: this.panes.view.width}}
                                  style={{paddingTop: 20}}>
                                <BlockView showContextMenuHeatmapRow={this.props.showContextMenuHeatmapRow}
                                           tooltipFunctions={this.props.tooltipFunctions}/>
                            </Pane>
                            <Pane className={this.active.legend ? "pane-active" : "pane-inactive"} key={"legend"}
                                  size={{width: this.panes.legend.width}}
                                  style={{paddingTop: 20}}>
                                <Legend highlightedVariable={this.highlightedVariable}
                                        setHighlightedVariable={this.setHighlightedVariable}
                                        removeHighlightedVariable={this.removeHighlightedVariable}
                                        {...this.props.tooltipFunctions}/>
                            </Pane>
                        </SortablePane>
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
                <Tabs ref="views" mountOnEnter unmountOnExit animation={false}
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