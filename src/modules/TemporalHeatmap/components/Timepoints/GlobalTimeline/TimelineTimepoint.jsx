import React from 'react';
import {observer} from 'mobx-react';
import TimelineRow from "./TimelineRow";
//import * as d3 from 'd3';

/*
creates a heatmap timepoint
 */
const TimelineTimepoint = observer(class TimelineTimepoint extends React.Component {

    getGlobalTimepoint() {
        const _self = this;
        let rows = [];
        //let previousYposition=0;

        //let count=0;

        let globalIndex = 0;

        //let ypi=_self.props.ypi;


        //let color2 =  d3.scaleOrdinal(d3.schemeCategory10); ;
        this.props.timepoint.forEach(function (row, i) {
            //get the correct color scale depending on the type of the variable (STRING, continous or binary)
            //let color = _self.props.visMap.getBlockColorScale("Timeline",_self.props.currentVariables[i].type);
            //let color = x => { return "#ffd92f" };


            //color = _self.props.currentVariables.filter(d=>d.id===_self.props.store.rootStore.globalPrimary)[0].colorScale;

            let color = _self.props.currentVariables.filter(d => d.id === _self.props.store.rootStore.globalPrimary)[0].colorScale;

            //if(row.variable===_self.props.store.rootStore.globalPrimary){


            if (row.variable === _self.props.store.rootStore.globalPrimary) {
                rows.push(<g key={row.variable + i + globalIndex}>

                    <TimelineRow {..._self.props} row={row} timepoint={_self.props.index}
                                 height={_self.props.visMap.primaryHeight}
                                 color={color}
                                 x={(_self.props.visMap.sampleRectWidth - _self.props.rectWidth) / 2}
                                 ypi={_self.props.ypi}
                                 ht={_self.props.ht}
                                 dtype={_self.props.currentVariables[i].datatype}/>;

                </g>);

            }


            globalIndex++;
        });
        return (rows)
    }


    getAllEvents(variable, index, array) {
        const _self = this;
        if (variable.type === "event") {
            this.props.store.rootStore.eventTimelineMap[variable.id].filter(d => d.time === index).forEach(d => array.push(d));
        }
        else {
            variable.originalIds.forEach(function (f) {
                _self.getAllEvents(_self.props.store.timepointStores[_self.props.timepointType].variableStore.allVariables[f], index, array);
            });
            return array;
        }
    }

    getGlobalTimepointWithTransition() {
        const _self = this;
        let rows = [];
        //let previousYposition=0;

        //let count=0;

        //let ypi=_self.props.ypi;

        let globalIndex = 0, opacity;
        let index = _self.props.index;


        //let color2 =  d3.scaleOrdinal(d3.schemeCategory10); ;

        if (!(_self.props.store.timepointStores.sample.variableStore.getTotalNumberOfVariables() === 0)) {
            index = Math.floor(_self.props.index / 2);
        }


        //let color2 =  d3.scaleOrdinal(d3.schemeCategory10); ;
        this.props.timepoint.forEach(function (row, i) {
            //get the correct color scale depending on the type of the variable (STRING, continous or binary)
            //let color = _self.props.visMap.getBlockColorScale("Timeline",_self.props.currentVariables[i].type);
            //let color = x => { return "#ffd92f" };

            let color;

            if (_self.props.timepointType === 'between') {
                opacity = 0.5;
                color = _self.props.visMap.globalTimelineColors;
                let events = [];
                let eventVar = _self.props.store.timepointStores[_self.props.timepointType].variableStore.getRelatedVariables("event");
                eventVar.forEach(function (d) {
                    events = _self.getAllEvents(d, index, events);
                });
                rows.push(<g key={row.variable + i + globalIndex}>

                    <TimelineRow {..._self.props} row={row} timepoint={_self.props.index}
                                 height={_self.props.visMap.primaryHeight}
                                 color={color}
                        //x={(_self.props.visMap.primaryHeight-_self.props.rectWidth)/2}
                                 x={(_self.props.visMap.sampleRectWidth - _self.props.rectWidth) / 2}
                                 ypi={_self.props.ypi}
                                 max={_self.props.max}
                                 ht={_self.props.ht}
                                 events={events}
                                 opacity={opacity}
                                 rectWidth={_self.props.visMap.sampleRectWidth / 2}
                                 dtype={_self.props.currentVariables[i].datatype}
                        //fillBin={fillBin}

                    />

                </g>);


            }
            else {

                //color = _self.props.currentVariables.filter(d => d.id === _self.props.store.rootStore.globalPrimary)[0].colorScale;


                color = _self.props.currentVariables.filter(d => d.id === _self.props.store.rootStore.globalPrimary)[0].colorScale;

                //if (row.variable === _self.props.store.rootStore.globalPrimary) {
                if (row.variable === _self.props.store.rootStore.globalPrimary) {
                    rows.push(<g key={row.variable + i + globalIndex}>

                        <TimelineRow {..._self.props} row={row} timepoint={_self.props.index}
                                     height={_self.props.visMap.primaryHeight}
                                     color={color}
                            //x={(_self.props.visMap.primaryHeight-_self.props.rectWidth)/2}
                                     x={(_self.props.visMap.sampleRectWidth - _self.props.rectWidth) / 2}
                                     ypi={_self.props.ypi}
                                     max={_self.props.max}
                                     ht={_self.props.ht}
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
        if (!this.props.store.transitionOn) {
            return (
                this.getGlobalTimepoint()
            )
        }
        else {
            return (
                this.getGlobalTimepointWithTransition()
            )
        }

    }
});
export default TimelineTimepoint;