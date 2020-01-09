import React from 'react';
import PropTypes from 'prop-types';
import { inject, observer, Provider } from 'mobx-react';
import TimelineTimepoint from './Timepoints/GlobalTimeline/TimelineTimepoint';
import GlobalTransition from './Transitions/GlobalTransition';
import { Col, Row } from 'react-bootstrap';
//import TimeAssign from './PlotLabeling/TimeAssign';
import GlobalRowOperators from './RowOperators/GlobalRowOperators';
import Legend from './PlotLabeling/Legend';
import TimeVarConfig from './PlotLabeling/TimeVarConfig';
import GlobalTimeAxis from './PlotLabeling/GlobalTimeAxis';
import GlobalBands from './PlotLabeling/GlobalBands';
import UtilityFunctions from '../UtilityClasses/UtilityFunctions';


/**
 * Component for global timeline
 */
const GlobalTimeline = inject('rootStore')(observer(class GlobalTimeline extends React.Component {
    constructor() {
        super();
        this.state = { rowOperatorsWidth: 100 };
        this.globalTime = React.createRef();
        this.globalRowOperators = React.createRef();
        this.updateDimensions = this.updateDimensions.bind(this);
    }

    /**
     * Add event listener
     */
    componentDidMount() {
        this.updateDimensions();
        //this.props.rootStore.visStore.resetTransitionSpaces();
        window.addEventListener('resize', this.updateDimensions);
    }

    /**
     * Remove event listener
     */
    componentWillUnmount() {
        this.props.rootStore.visStore.currentVerticalZoomLevel = undefined;
        window.removeEventListener('resize', this.updateDimensions);
    }

    getGlobalTransitions() {
        return (
            <Provider
                dataStore={this.props.rootStore.dataStore}
                visStore={this.props.rootStore.visStore}
            >
                <GlobalTransition
                    key="globalTransition"
                    patients={this.props.rootStore.patients}
                    minMax={this.props.rootStore.minMax}
                    heatmapScale={this.props.rootStore.visStore.heatmapScales[0]}
                    {...this.props.tooltipFunctions}
                />
            </Provider>
        );
    }

    getGlobalTimepoints() {
        const timepoints_between = [];
        const timepoints_sample = [];
        this.props.rootStore.dataStore.timepoints.forEach((d, i) => {
            if (d.heatmap.length > 0) {
                if (d.type==='between') {
                    timepoints_between.push(
                        <g key={d.globalIndex}>
                            <TimelineTimepoint
                                timepoint={d}
                                currentVariables={this.props.rootStore.dataStore
                                    .variableStores[d.type].fullCurrentVariables}
                                tooltipFunctions={this.props.tooltipFunctions}
                            />
                        </g>
                    );    
                } else {
                    timepoints_sample.push(
                        <g key={d.globalIndex}>
                            <TimelineTimepoint
                                timepoint={d}
                                currentVariables={this.props.rootStore.dataStore
                                    .variableStores[d.type].fullCurrentVariables}
                                tooltipFunctions={this.props.tooltipFunctions}
                            />
                        </g>
                    );    
                }
            }
        });
        return timepoints_sample.concat(timepoints_between);
    }

    updateDimensions() {
        this.props.rootStore.visStore
            .setPlotWidth(this.globalTime.current.getBoundingClientRect().width);
        this.props.rootStore.visStore
            .setPlotHeight(window.innerHeight - this.globalTime
                .current.getBoundingClientRect().top);
        this.setState({
            rowOperatorsWidth: this.globalRowOperators.current.rowOperators.current.parentNode.clientWidth,
        });
    }


    render() {
        let transitions = this.getGlobalTransitions();
        let timepoints = this.getGlobalTimepoints();
        let globalPrimaryName = this.props.rootStore.dataStore
            .variableStores.sample.fullCurrentVariables
            .filter(d1 => d1.id === this.props.rootStore.dataStore.globalPrimary)[0].name;

        let fontSize=10;
        let fontWeight = 'bold';  
        
        
        return (
            <div>
                <div className="view" id="timeline-view">
                    <Row>
                        <Col xs={2} md={2} style={{ padding: 0 }}>
                            
                            <Provider
                                dataStore={this.props.rootStore.dataStore}
                                visStore={this.props.rootStore.visStore}
                            >
                                <GlobalRowOperators ref={this.globalRowOperators}
                                    openSaveVarModal={this.props.openSaveVarModal}
                                    tooltipFunctions={this.props.tooltipFunctions}
                                />
                            </Provider>


                            
                            <h5>{`${UtilityFunctions.cropText(globalPrimaryName, fontSize,
                        fontWeight, this.state.rowOperatorsWidth-fontSize)} Legend`}</h5>
                            <Legend {...this.props.tooltipFunctions} />

                            <hr/>
                            <h5>{`Timeline Configurations`}</h5>
                            
                            
                            <TimeVarConfig {...this.props.tooltipFunctions} />

                            
                        </Col>
                        <Col xs={1} md={1} style={{ padding: 0, width: 55 }}>
                            <GlobalTimeAxis
                                timeValue={this.props.rootStore.timeValue}
                                width={55}
                            />
                        </Col>
                        <Col xs={9} md={9} style={{ padding: 0, overflow: 'hidden' }}>
                            <GlobalBands timeValue={this.props.rootStore.timeValue}/>
                            <div ref={this.globalTime} className="scrollableX">
                                <svg
                                    width={this.props.rootStore.visStore.svgWidth}
                                    height={this.props.rootStore.visStore.svgHeight}
                                >
                                    <g transform={`translate(0,${this.props.rootStore.visStore.timelineRectSize / 2})`}>
                                        {transitions}
                                        {timepoints}
                                    </g>
                                </svg>
                            </div>
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
}));
GlobalTimeline.propTypes = {
    tooltipFunctions: PropTypes.objectOf(PropTypes.func).isRequired,
};
export default GlobalTimeline;

//<h5>{`${globalPrimaryName} Legend`}</h5>

//<h5>{`${UtilityFunctions.cropText(globalPrimaryName, fontSize, fontWeight, 40)} Legend`}</h5>
