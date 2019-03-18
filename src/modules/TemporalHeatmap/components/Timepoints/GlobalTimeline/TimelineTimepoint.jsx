import React from 'react';
import {observer,inject} from 'mobx-react';
import TimelineRow from "./TimelineRow";
import DerivedMapperFunctions from "../../../UtilityClasses/DeriveMapperFunctions";

/**
 * component for a timepoint in the global timeline
 */
const TimelineTimepoint = inject("rootStore")(observer(class TimelineTimepoint extends React.Component {
    /**
     * gets all events associated with an event variable
     * @param {string} variableId
     * @param {number} index
     * @param {Object[]} array
     * @return {Object[]}
     */
    getAllEvents(variableId, index, array) {
        const _self = this;
        let current = this.props.rootStore.dataStore.variableStores.between.referencedVariables[variableId];
        if (current.type === "event") {
            this.props.rootStore.eventTimelineMap.get(variableId).filter(d => d.time === index).forEach(d => array.push(d));
            return array;
        }
        else if (current.type === "derived") {
            current.originalIds.forEach(function (f) {
                _self.getAllEvents(f, index, array);
            });
            return array;
        }
        else {
            return array;
        }
    }

    /**
     * filters events to reflect event combinations
     * @param {string} variableId
     * @param {Object[]} events
     * @return {Object[]}
     */
    filterEvents(variableId, events) {
        let variable = this.props.rootStore.dataStore.variableStores.between.getById(variableId);
        let filterMapper = {};
        if (variable.datatype === "BINARY") {
            filterMapper = variable.mapper;
        }
        if (variable.derived && variable.modificationType === "binaryCombine" && variable.modification.datatype === "STRING") {
            filterMapper = DerivedMapperFunctions.createBinaryCombinedMapper(variable.originalIds.map(d => this.props.rootStore.dataStore.variableStores.between.getById(d).mapper),
                {operator: variable.modification.operator, datatype: "BINARY"}, []);
        }
        return events.filter((d) => filterMapper[d.sampleId]);
    }

    /**
     * creates a timepoint
     * @return {g[]}
     */
    getGlobalTimepointWithTransition() {
        const _self = this;
        let rows = [];
        //let previousYposition=0;

        //let count=0;

        //let ypi=_self.props.ypi;

        let globalIndex = 0, opacity;
        let index = _self.props.index;


        //let color2 =  d3.scaleOrdinal(d3.schemeCategory10); ;

        if (!(_self.props.rootStore.dataStore.variableStores.sample.getNumberOfReferencedVariables() === 0)) {
            index = Math.floor(_self.props.index / 2);
        }


        //let color2 =  d3.scaleOrdinal(d3.schemeCategory10); ;
        this.props.timepoint.forEach(function (row, i) {
            //get the correct color scale depending on the type of the variable (STRING, continous or binary)
            //let color = _self.props.rootStore.visStore.getBlockColorScale("Timeline",_self.props.currentVariables[i].type);
            //let color = x => { return "#ffd92f" };

            let color;

            if (_self.props.timepointType === 'between') {
                opacity = 0.5;
                color = _self.props.rootStore.visStore.globalTimelineColors;
                let events = _self.getAllEvents(row.variable, index, []);
                events = _self.filterEvents(row.variable, events);
                rows.push(<g key={row.variable + i + globalIndex}>

                    <TimelineRow {..._self.props} row={row} timepoint={_self.props.index}
                                 color={color}
                        //x={(_self.props.rootStore.visStore.primaryHeight-_self.props.rectWidth)/2}
                                 x={_self.props.rootStore.visStore.timelineRectSize / 2}
                                 max={_self.props.max}
                                 events={events}
                                 opacity={opacity}
                                 rectWidth={_self.props.rootStore.visStore.timelineRectSize}
                                 dtype={_self.props.currentVariables[i].datatype}
                        //fillBin={fillBin}

                    />

                </g>);


            }
            else {
                if (row.variable === _self.props.rootStore.dataStore.globalPrimary) {
                    color = _self.props.currentVariables.filter(d => d.id === _self.props.rootStore.dataStore.globalPrimary)[0].colorScale;
                    rows.push(<g key={row.variable + i + globalIndex}>

                        <TimelineRow {..._self.props} row={row} timepoint={_self.props.index}
                                     color={color}
                            //x={(_self.props.rootStore.visStore.primaryHeight-_self.props.rectWidth)/2}
                                     x={_self.props.rootStore.visStore.timelineRectSize / 2}
                                     max={_self.props.max}
                                     rectWidth={_self.props.rootStore.visStore.timelineRectSize}
                                     opacity={opacity}
                                     dtype={_self.props.currentVariables[i].datatype}
                            //fillBin={fillBin}
                        />
                    </g>);
                }
            }
            globalIndex++;
        });
        return (rows)
    }


    render() {
        return (
            this.getGlobalTimepointWithTransition()
        )

    }
}));
export default TimelineTimepoint;