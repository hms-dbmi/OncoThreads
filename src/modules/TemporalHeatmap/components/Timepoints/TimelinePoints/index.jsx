import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import TimelineRow from './TimelineRow';
import DerivedMapperFunctions from 'modules/UtilityClasses/DeriveMapperFunctions';
import OriginalVariable from 'modules/TemporalHeatmap/stores/OriginalVariable';
import DerivedVariable from 'modules/TemporalHeatmap/stores/DerivedVariable';
import SingleTimepoint from 'modules/TemporalHeatmap/stores/SingleTimepoint';

/**
 * component for a timepoint in the global timeline
 */
const TimelineTimepoint = inject('rootStore')(observer(class TimelineTimepoint extends React.Component {
    /**
     * gets all events associated with an event variable
     * @param {string} variableId
     * @param {number} index
     * @param {Object[]} array
     * @return {Object[]}
     */
    getAllEvents(variableId, index, array) {
        const current = this.props.rootStore.dataStore.variableStores
            .between.referencedVariables[variableId];
        if (current.type === 'event') {
            this.props.rootStore.eventTimelineMap[variableId]
                .filter(d => d.time === index).forEach(d => array.push(d));
            return array;
        }
        if (current.derived) {
            current.originalIds.forEach((f) => {
                this.getAllEvents(f, index, array);
            });
            return array;
        }

        return array;
    }


    /**
     * creates a timepoint
     * @return {g[]}
     */
    getGlobalTimepointWithTransition() {
        const rows = [];
        let globalIndex = 0;

        this.props.timepoint.heatmap.forEach((row, i) => {
            let color;
            if (this.props.timepoint.type === 'between') {
                color = this.props.rootStore.visStore.globalTimelineColors;
                //let events = this.getAllEvents(row.variable, this.props.timepoint.localIndex, []);
                //events = this.filterEvents(row.variable, events);
                //console.log("events for timepoint " + this.props.timepoint.localIndex + " and variable " + row.variable);
                //console.log(events);
                rows.push(
                    <g key={row.variable + i + globalIndex} >
                        <TimelineRow
                            timepointType={this.props.timepoint.type}
                            {...this.props.tooltipFunctions}
                            row={row}
                            color={color}
                            events={this.props.allEvents[row.variable][this.props.timepoint.localIndex]}
                            overlappingEventsMap={this.props.overlappingEventsMap}
                            //opacity={0.8}
                            opacity={0.2}
                            eventNum={i}
                            
                        />

                    </g>,
                );
            } else if (row.variable === this.props.rootStore.dataStore.globalPrimary) {
                color = this.props.currentVariables
                    .filter(d => d.id === this.props.rootStore
                        .dataStore.globalPrimary)[0].colorScale;
                rows.push(
                    <g key={row.variable + i + globalIndex} >
                        <TimelineRow
                            timepointType={this.props.timepoint.type}
                            {...this.props.tooltipFunctions}
                            row={row}
                            color={color}
                            //opacity={0.8}
                            opacity={0.2}
                        />
                    </g>,
                );
            }
            globalIndex += 1;
        });
        return (rows);
    }

    /**
     * filters events to reflect event combinations
     * @param {string} variableId
     * @param {Object[]} events
     * @return {Object[]}
     */
    filterEvents(variableId, events) {
        const variable = this.props.rootStore.dataStore.variableStores.between.getById(variableId);
        let filterMapper = variable.mapper;
        if (variable.derived && variable.modification.type === 'binaryCombine' && variable.modification.datatype === 'STRING') {
            filterMapper = DerivedMapperFunctions.getModificationMapper({
                type: 'binaryCombine',
                operator: variable.modification.operator,
                datatype: 'BINARY',
            }, variable.originalIds.map(d => this.props.rootStore
                .dataStore.variableStores.between.getById(d).mapper));
        }
        return events.filter(d => filterMapper[d.sampleId]);
    }


    render() {
        return (
            this.getGlobalTimepointWithTransition()
        );
    }
}));
TimelineTimepoint.propTypes = {
    timepoint: PropTypes.instanceOf(SingleTimepoint).isRequired,
    currentVariables: PropTypes.arrayOf(PropTypes.oneOfType(
        [PropTypes.instanceOf(OriginalVariable), PropTypes.instanceOf(DerivedVariable)],
    )),
    tooltipFunctions: PropTypes.objectOf(PropTypes.func),
};
export default TimelineTimepoint;
