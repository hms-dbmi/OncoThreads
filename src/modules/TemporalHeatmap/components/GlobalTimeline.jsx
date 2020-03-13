import React from 'react';
import PropTypes from 'prop-types';
import { inject, observer, Provider } from 'mobx-react';
import TimelineTimepoint from './Timepoints/GlobalTimeline/TimelineTimepoint';
import GlobalTransition from './Transitions/GlobalTransition';
import { Col, Row } from 'react-bootstrap';
import GlobalRowOperators from './RowOperators/GlobalRowOperators';
import Legend from './PlotLabeling/Legend';
import TimeVarConfig from './PlotLabeling/TimeVarConfig';
import GlobalTimeAxis from './PlotLabeling/GlobalTimeAxis';
import GlobalBands from './PlotLabeling/GlobalBands';
import UtilityFunctions from '../UtilityClasses/UtilityFunctions';
import DerivedMapperFunctions from '../UtilityClasses/DeriveMapperFunctions';



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
        const allTimepoints = this.props.rootStore.dataStore.timepoints.filter(d => !!d.heatmap.length);
        const allEvents = this.getAllEvents(allTimepoints.filter(timepoint => timepoint.type === 'between'));
        const overlappingEventsMap = this.getOverlappingEventsMap(allTimepoints, allEvents);
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
                                allEvents={allEvents}
                                overlappingEventsMap={overlappingEventsMap}
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

    getAllEvents(allEventTimepoints) {
        const allEvents = {};
        allEventTimepoints.forEach(timepoint => {
            timepoint.heatmap.map(row => row.variable).forEach(eventId => {
                if (!allEvents[eventId]) {
                    allEvents[eventId] = {};
                }
                const filterMapper = this.getFilterMapper(eventId);
                allEvents[eventId][timepoint.localIndex] = this
                    .getEvents(eventId, timepoint.localIndex)
                    .filter(event => filterMapper[event.sampleId]);
            });
        });
        return allEvents;
    }

    /**
     * gets all events associated with an event variable in a timepoint
     * @param {string} eventId
     * @param {number} timepointIndex
     * @return {Object[]}
     */
    getEvents(eventId, timepointIndex) {
        const reference = this.props.rootStore.dataStore.variableStores.between.referencedVariables[eventId];
        if (reference.type === 'event') {
            return this.props.rootStore.eventTimelineMap[eventId].filter(d => d.time === timepointIndex);
        } else if (reference.derived) {
            return reference.originalIds
                    .map(originalId => this.getEvents(originalId, timepointIndex))
                    .reduce((cumulative, current) => cumulative.concat(current), []);
        }
    }

    getFilterMapper(eventId) {
        const variable = this.props.rootStore.dataStore.variableStores.between.getById(eventId);
        if (variable.derived && variable.modification.type === 'binaryCombine' && variable.modification.datatype === 'STRING') {
            return DerivedMapperFunctions.getModificationMapper(
                {
                    type: 'binaryCombine',
                    operator: variable.modification.operator,
                    datatype: 'BINARY'
                },
                variable.originalIds.map(originalId => this.getFilterMapper(originalId)));
        } else {
            return variable.mapper;
        }
    }

    getOverlappingEventsMap(allTimepoints, allEvents) {
        const overlappingEvents = {};
        const globalPrimaryRows = allTimepoints
                .filter(d => d.type!=='between')
                .map(d => d.heatmap
                    .find(row => row.variable === this.props.rootStore.dataStore.globalPrimary));
        //const eventTimepoints = allTimepoints.filter(d => d.type==='between');
        Object.keys(allEvents).forEach((eventId, i) => {
            Object.values(allEvents[eventId]).flatMap(event => event).forEach(event => {
                globalPrimaryRows
                        .map(row => row.data.find(d => d.patient === event.patientId))
                        .filter(sampleData => sampleData)
                        .forEach(sampleData => {
                            if (this.isOverlappingEventSample(event, sampleData)) {
                                if (!overlappingEvents[sampleData.patient]) {
                                    overlappingEvents[sampleData.patient] = [];
                                }
                                if (overlappingEvents[sampleData.patient].indexOf(eventId) === -1) {
                                    overlappingEvents[sampleData.patient] = overlappingEvents[sampleData.patient].concat([eventId]);
                                }
                            }
                        });
                Object.keys(allEvents).slice(0, i).forEach(eventId2 => {
                    Object.values(allEvents[eventId2])
                            .flatMap(event2 => event2)
                            .filter(event2 => event.patientId === event2.patientId)
                            .forEach(event2 => {
                        if (this.isOverlappingEventPair(event, event2)) {
                            if (!overlappingEvents[event.patientId]) {
                                overlappingEvents[event.patientId] = [];
                            }
                            if (overlappingEvents[event.patientId].indexOf(eventId) === -1) {
                                overlappingEvents[event.patientId] = overlappingEvents[event.patientId].concat([eventId]);
                            }
                        }
                    })
                })
            })
        })
        return overlappingEvents;

        /**
         *
            time: 1
            patientId: "P01"
            sampleId: "P01_Rec"
            eventStartDate: 124
            eventEndDate: 124
         */
    }

    isOverlappingEventSample(event, sampleData) {
        const sampleY = this.props.rootStore.visStore.timeScale(this.props.rootStore.sampleTimelineMap[sampleData.sample]);
        const eventHeight = this.props.rootStore.visStore.timeScale(event.eventEndDate - event.eventStartDate);
        const eventStartY = this.props.rootStore.visStore.timeScale(event.eventStartDate);
        const eventEndY = this.props.rootStore.visStore.timeScale(event.eventEndDate);
        let dis = this.props.rootStore.visStore.sampleRadius;
        if (eventHeight === 0) {
            dis = dis + this.props.rootStore.visStore.eventRadius;
        }
        return (sampleY-eventEndY<dis && eventStartY-sampleY<dis);
    }

    isOverlappingEventPair(event1, event2) {
        const eventHeight1 = this.props.rootStore.visStore.timeScale(event1.eventEndDate - event1.eventStartDate);
        let eventStartY1 = this.props.rootStore.visStore.timeScale(event1.eventStartDate);
        let eventEndY1 = this.props.rootStore.visStore.timeScale(event1.eventEndDate);
        if (eventHeight1 !== 0) {
            eventStartY1 = eventStartY1 - this.props.rootStore.visStore.eventRadius;
            eventEndY1 = eventEndY1 + this.props.rootStore.visStore.eventRadius;
        }
        const eventHeight2 = this.props.rootStore.visStore.timeScale(event2.eventEndDate - event2.eventStartDate);
        let eventStartY2 = this.props.rootStore.visStore.timeScale(event2.eventStartDate);
        let eventEndY2 = this.props.rootStore.visStore.timeScale(event2.eventEndDate);
        if (eventHeight2 !== 0) {
            eventStartY2 = eventStartY2 - this.props.rootStore.visStore.eventRadius;
            eventEndY2 = eventEndY2 + this.props.rootStore.visStore.eventRadius;
        }
        return (eventEndY1>eventStartY2 && eventEndY2>eventStartY1);
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

    getLegend(){
        if(this.props.rootStore.dataStore.variableStores.sample.currentVariables.length>0){
            let globalPrimaryName = this.props.rootStore.dataStore
                .variableStores.sample.fullCurrentVariables
                .filter(d1 => d1.id === this.props.rootStore.dataStore.globalPrimary)[0].name;

            let fontSize=10;
            let fontWeight = 'bold';
            return  <div>
                <h5>{`${UtilityFunctions.cropText(globalPrimaryName, fontSize,
                fontWeight, this.state.rowOperatorsWidth-fontSize)} Legend`}</h5>
                <Legend {...this.props.tooltipFunctions} />
            </div>
        }
        else return null;
    }


    render() {
        let transitions = this.getGlobalTransitions();
        let timepoints = this.getGlobalTimepoints();

        
        
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


                            
                            {this.getLegend()}

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
                                    <g transform={`translate(10,${this.props.rootStore.visStore.timelineRectSize / 2})`}>
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
