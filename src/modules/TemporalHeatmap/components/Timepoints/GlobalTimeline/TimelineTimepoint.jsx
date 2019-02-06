import React from 'react';
import {observer} from 'mobx-react';
import TimelineRow from "./TimelineRow";
//import * as d3 from 'd3';

/*
creates a heatmap timepoint
 */
const TimelineTimepoint = observer(class TimelineTimepoint extends React.Component {


    getAllEvents(variableId, index, array) {
        const _self = this;
        let current = this.props.store.variableStores.between.referencedVariables[variableId];
        if (current.type === "event") {
            this.props.store.rootStore.eventTimelineMap[variableId].filter(d => d.time === index).forEach(d => array.push(d));
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



    getGlobalTimepointWithTransition() {
        const _self = this;
        let rows = [];
        //let previousYposition=0;

        //let count=0;

        //let ypi=_self.props.ypi;

        let globalIndex = 0, opacity;
        let index = _self.props.index;


        //let color2 =  d3.scaleOrdinal(d3.schemeCategory10); ;

        if (!(_self.props.store.variableStores.sample.getNumberOfReferencedVariables() === 0)) {
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
                let events = _self.getAllEvents(row.variable, index, []);
                events = events.filter((d) => _self.props.store.variableStores.between.referencedVariables[row.variable].mapper[d.sampleId]);
                rows.push(<g key={row.variable + i + globalIndex}>

                    <TimelineRow {..._self.props} row={row} timepoint={_self.props.index}
                                 height={_self.props.visMap.primaryHeight}
                                 color={color}
                        //x={(_self.props.visMap.primaryHeight-_self.props.rectWidth)/2}
                                 x={(_self.props.visMap.sampleRectWidth - _self.props.rectWidth) / 2}
                                 max={_self.props.max}
                                 events={events}
                                 opacity={opacity}
                                 rectWidth={_self.props.visMap.sampleRectWidth / 2}
                                 dtype={_self.props.currentVariables[i].datatype}
                        //fillBin={fillBin}

                    />

                </g>);


            }
            else {
                if (row.variable === _self.props.store.globalPrimary) {
                    color = _self.props.currentVariables.filter(d => d.id === _self.props.store.globalPrimary)[0].colorScale;
                    rows.push(<g key={row.variable + i + globalIndex}>

                        <TimelineRow {..._self.props} row={row} timepoint={_self.props.index}
                                     height={_self.props.visMap.primaryHeight}
                                     color={color}
                            //x={(_self.props.visMap.primaryHeight-_self.props.rectWidth)/2}
                                     x={(_self.props.visMap.sampleRectWidth - _self.props.rectWidth) / 2}
                                     max={_self.props.max}
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
});
export default TimelineTimepoint;