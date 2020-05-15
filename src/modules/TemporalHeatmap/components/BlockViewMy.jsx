import React from 'react';
import PropTypes from 'prop-types';
import { inject, observer, Provider } from 'mobx-react';
import FontAwesome from 'react-fontawesome';
import { extendObservable, reaction } from 'mobx';
import { Button, Row } from 'react-bootstrap';
import { Pane, SortablePane } from 'react-sortable-pane';
import HeatmapGroupTransition from './Transitions/HeatmapGroupTransition/HeatmapGroupTransition';
import LineTransition from './Transitions/LineTransition/LineTransition';
import SankeyTransition from './Transitions/SankeyTransition/SankeyTransition';
import HeatmapTimepoint from './Timepoints/Heatmap';
import GroupTimepoint from './Timepoints/GroupTimepoint/';
import TimepointLabels from './PlotLabeling/TimepointLabels';
import RowOperators from './RowOperators/RowOperators';
import Legend from './Legend';


/**
 * Component for the Block view
 */
const BlockView = inject('rootStore', 'uiStore', 'undoRedoStore')(observer(class BlockView extends React.Component {
    constructor(props) {
        super(props);
        this.padding = 20;
        this.blockView = React.createRef();

        this.handleTimeClick = this.handleTimeClick.bind(this);
        this.setHighlightedVariable = this.setHighlightedVariable.bind(this);
        this.removeHighlightedVariable = this.removeHighlightedVariable.bind(this);
        this.updateDimensions = this.updateDimensions.bind(this);
        extendObservable(this, {
            highlightedVariable: '', // variableId of currently highlighted variable
            order: ['labels', 'operators', 'view', 'legend'],
            width:window.innerWidth,
            panes: {
                labels: { width: (window.innerWidth - 40) / 10 * 0.5, active: false },
                operators: { width: ((window.innerWidth - 40) / 10) * 1.5, active: false },
                view: { width: ((window.innerWidth - 40) / 10) * 6.5, active: false },
                legend: { width: (window.innerWidth - 40) / 10 * 1.5, active: false },
            },
            ref: React.createRef(),
            active: {
                labels: false,
                operators: false,
                view: false,
                legend: false,
            },
        });
        reaction(() => this.panes.view.width, (width) => {
            this.props.rootStore.visStore.setPlotWidth(width - 10);
        });
    }

    /**
     * Add event listener
     */
    componentDidMount() {

        this.width = this.ref.current.getBoundingClientRect().width
        this.updateDimensions()

        this.props.rootStore.visStore.setPlotWidth(this.panes.view.width - 10);
        this.props.rootStore.visStore
            .setPlotHeight(window.innerHeight - this.blockView
                .current.getBoundingClientRect().top);
        window.addEventListener('resize', this.updateDimensions);

    }

    /**
     * Remove event listener
     */
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateDimensions);
    }

    /**
     * updates view dimensions
     */
    updateDimensions() {
        const prevWidth = Object.values(this.panes).map(d => d.width).reduce((a, b) => a + b);
        this.panes = {
            labels: {
                width: (this.width - 40) / (prevWidth / this.panes.labels.width),
            },
            operators: {
                width: (this.width - 40) / (prevWidth / this.panes.operators.width),
            },
            view: {
                width: (this.width- 40) / (prevWidth / this.panes.view.width),
            },
            legend: {
                width: (this.width - 40) / (prevWidth / this.panes.legend.width),
            },
        };
        this.props.rootStore.visStore
            .setPlotHeight(window.innerHeight - this.blockView
                .current.getBoundingClientRect().top);
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
     * gets timepoints and transitions
     * @return {*[]}
     */
    getTimepointAndTransitions() {
        const timepoints = [];
        const transitions = [];
        this.props.rootStore.dataStore.timepoints.forEach((d, i) => {
            let rectWidth;
            // check the type of the timepoint to get the correct width of the heatmap rectangles
            if (d.type === 'between') {
                rectWidth = this.props.rootStore.visStore.sampleRectWidth / 2;
            } else {
                rectWidth = this.props.rootStore.visStore.sampleRectWidth;
            }
            // create timepoints
            if (d.heatmap) {
                if (d.isGrouped) {
                    const transformTP = `translate(
                        ${this.props.rootStore.visStore.getTpXTransform(i)},
                        ${this.props.rootStore.visStore.timepointPositions.timepoint[i]}
                        )`;
                    timepoints.push(
                        <g key={d.globalIndex} transform={transformTP}>
                            <Provider
                                dataStore={this.props.rootStore.dataStore}
                                visStore={this.props.rootStore.visStore}
                            >
                                <GroupTimepoint
                                    group={d.customPartitions.length===0?d.grouped:d.customGrouped}
                                    heatmap={d.heatmap}
                                    index={i}
                                    currentVariables={this.props.rootStore.dataStore
                                        .variableStores[d.type].fullCurrentVariables}
                                    rectWidth={rectWidth}
                                    tooltipFunctions={this.props.tooltipFunctions}
                                    primaryVariableId={d.primaryVariableId}
                                />
                            </Provider>
                        </g>,
                    );
                } else {
                    const transformTP = `translate(0,${this.props.rootStore.visStore.timepointPositions.timepoint[i]})`;
                    timepoints.push(
                        <g key={d.globalIndex} transform={transformTP}>
                            <Provider
                                dataStore={this.props.rootStore.dataStore}
                                visStore={this.props.rootStore.visStore}
                            >
                                <HeatmapTimepoint
                                    tooltipFunctions={this.props.tooltipFunctions}
                                    showContextMenuHeatmapRow={this.props.showContextMenuHeatmapRow}
                                    xOffset={(this.props.rootStore.visStore
                                        .sampleRectWidth - rectWidth) / 2}
                                    timepoint={d}
                                    rectWidth={rectWidth}
                                    heatmapScale={this.props.rootStore.visStore.heatmapScales[i]}
                                />
                            </Provider>
                        </g>,
                    );
                }
            }
            // create transitions
            if (i !== this.props.rootStore.dataStore.timepoints.length - 1) {
                const transformTR = `translate(0,${this.props.rootStore.visStore.timepointPositions.connection[i]})`;
                const firstTP = d;
                const secondTP = this.props.rootStore.dataStore.timepoints[i + 1];
                let transition;
                if (firstTP.customPartitions.length>0) {
                    if (secondTP.customPartitions.length>0) {
                        transition = (
                            <Provider
                                dataStore={this.props.rootStore.dataStore}
                                visStore={this.props.rootStore.visStore}
                            >
                                <SankeyTransition
                                    index={i}
                                    firstGrouped={firstTP.customGrouped}
                                    secondGrouped={secondTP.customGrouped}
                                    firstPrimary={this.props.rootStore.dataStore
                                        .variableStores[firstTP.type]
                                        .getById(firstTP.primaryVariableId)}
                                    secondPrimary={this.props.rootStore.dataStore
                                        .variableStores[secondTP.type]
                                        .getById(secondTP.primaryVariableId)}
                                    tooltipFunctions={this.props.tooltipFunctions}
                                />
                            </Provider>
                        );
                    } else {
                        transition = (
                            <Provider
                                dataStore={this.props.rootStore.dataStore}
                                visStore={this.props.rootStore.visStore}
                            >
                                <HeatmapGroupTransition
                                    inverse={false}
                                    index={firstTP.globalIndex}
                                    partitions={firstTP.grouped}
                                    nonGrouped={secondTP}
                                    heatmapScale={this.props.rootStore.visStore
                                        .heatmapScales[i + 1]}
                                    colorScale={this.props.rootStore.dataStore
                                        .variableStores[firstTP.type]
                                        .getById(firstTP.primaryVariableId).colorScale}
                                />
                            </Provider>
                        );
                    }
                } else if (secondTP.isGrouped) {
                    transition = (
                        <Provider
                            dataStore={this.props.rootStore.dataStore}
                            visStore={this.props.rootStore.visStore}
                        >
                            <HeatmapGroupTransition
                                inverse
                                index={secondTP.globalIndex}
                                partitions={secondTP.grouped}
                                nonGrouped={firstTP}
                                heatmapScale={this.props.rootStore.visStore.heatmapScales[i]}
                                colorScale={this.props.rootStore.dataStore
                                    .variableStores[secondTP.type]
                                    .getById(secondTP.primaryVariableId).colorScale}
                            />
                        </Provider>
                    );
                } else {
                    transition = (
                        <Provider
                            dataStore={this.props.rootStore.dataStore}
                            visStore={this.props.rootStore.visStore}
                        >
                            <LineTransition
                                index={firstTP.globalIndex}
                                from={firstTP.patients}
                                to={secondTP.patients}
                                firstHeatmapScale={this.props.rootStore.visStore.heatmapScales[i]}
                                secondHeatmapScale={this.props.rootStore
                                    .visStore.heatmapScales[i + 1]}
                                secondTimepoint={secondTP}
                                timeGapMapper={this.props.rootStore
                                    .staticMappers[this.props.rootStore.timeDistanceId]}
                                colorScale={this.props.rootStore.dataStore
                                    .variableStores[secondTP.type]
                                    .getById(secondTP.primaryVariableId).colorScale}
                                tooltipFunctions={this.props.tooltipFunctions}    
                            />
                        </Provider>
                    );
                }
                transitions.push(
                    <g
                        key={firstTP.globalIndex}
                        transform={transformTR}
                    >
                        {transition}
                    </g>,
                );
            }
        });
        return [transitions, timepoints];
    }


    render() {
        return (
            <div className="blockView" ref={this.ref}>
                <div className="view" id="block-view">
                    <Row style={{marginLeft: '0'}}>
                        <Button
                            bsSize="xsmall"
                            onClick={this.handleTimeClick}
                            disabled={this.props.uiStore.globalTime==='line'
                            || this.props.rootStore.dataStore.variableStores
                                .between.currentVariables.length > 0}
                            key="actualTimeline"
                        >
                            <FontAwesome
                                name="clock"
                            />
                            {' '}
                            {(this.props.uiStore.realTime) ? 'Hide Relative Time' : 'Show Relative Time'}
                        </Button>
                    </Row>
                    <Row>
                        <SortablePane
                            direction="horizontal"
                            margin={10}
                            order={this.order}
                            disableEffect
                            onOrderChange={(order) => {
                                this.order = order;
                            }}
                            onResizeStop={(e, key, dir, ref, d) => {
                                this.panes = {
                                    ...this.panes,
                                    [key]: { width: this.panes[key].width + d.width },
                                    [this.order[this.order.length - 1]]: {
                                        width: this.panes[this.order[this.order.length - 1]].width
                                            - d.width,
                                    },
                                };
                            }}
                            onDragStart={(e, key) => {
                                if (e.target.tagName === 'svg') {
                                    this.active[key] = true;
                                }
                            }}
                            onDragStop={(e, key) => {
                                this.active[key] = false;
                            }}
                        >
                            <Pane
                                className={`${this.active.labels ? 'pane-active' : 'pane-inactive'} timepointLabel`}
                                key="labels"
                                size={{ width: this.panes.labels.width }}
                            >
                                <Provider
                                    dataStore={this.props.rootStore.dataStore}
                                    visStore={this.props.rootStore.visStore}
                                >
                                    <TimepointLabels
                                        width={this.panes.labels.width - 10}
                                        padding={this.padding}
                                    />
                                </Provider>
                            </Pane>
                            <Pane
                                className={`${this.active.operators ? 'pane-active' : 'pane-inactive'} variableOperator`}
                                key="operators"
                                size={{ width: this.panes.operators.width }}
                                style={{ paddingTop: this.padding }}
                            >
                                <RowOperators
                                    highlightedVariable={this.highlightedVariable}
                                    width={this.panes.operators.width - 10}
                                    setHighlightedVariable={this.setHighlightedVariable}
                                    removeHighlightedVariable={this.removeHighlightedVariable}
                                    tooltipFunctions={this.props.tooltipFunctions}
                                    showContextMenu={this.props.showContextMenu}
                                    openBinningModal={this.props.openBinningModal}
                                    openSaveVarModal={this.props.openSaveVarModal}
                                />
                            </Pane>
                            <Pane
                                className={this.active.view ? 'pane-active' : 'pane-inactive'}
                                key="view"
                                size={{ width: this.panes.view.width }}
                                style={{ paddingTop: this.padding }}
                            >
                                <div ref={this.blockView} className="scrollableX">
                                    <svg
                                        width={this.props.rootStore.visStore.svgWidth}
                                        height={this.props.rootStore.visStore.svgHeight}
                                    >
                                        {this.getTimepointAndTransitions()}
                                    </svg>
                                </div>
                            </Pane>
                            <Pane
                                className={this.active.legend ? 'pane-active' : 'pane-inactive'}
                                key="legend"
                                size={{ width: this.panes.legend.width }}
                                style={{ paddingTop: this.padding }}
                            >
                                <Legend
                                    highlightedVariable={this.highlightedVariable}
                                    setHighlightedVariable={this.setHighlightedVariable}
                                    removeHighlightedVariable={this.removeHighlightedVariable}
                                    {...this.props.tooltipFunctions}
                                />
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
}));
BlockView.propTypes = {
    tooltipFunctions: PropTypes.objectOf(PropTypes.func).isRequired,
    showContextMenuHeatmapRow: PropTypes.func.isRequired,
};
export default BlockView;
