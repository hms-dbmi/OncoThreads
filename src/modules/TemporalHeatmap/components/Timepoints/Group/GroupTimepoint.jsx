import React from 'react';
import {observer} from 'mobx-react';

import GroupPartition from './GroupPartition'
/*
creates a grouped timepoint
 */
const GroupTimepoint = observer(class GroupTimepoint extends React.Component {
    constructor() {
        super();
        this.handleMouseClick = this.handleMouseClick.bind(this);
    }

    /**
     * gets the different partitions in the grouped timepoint
     * @returns partitions
     */
    getPartitions() {
        let partitions = [];
        const _self = this;
        let previousXPosition = 0;
        this.props.timepoint.forEach(function (d, i) {
            const transform = "translate(" + previousXPosition + ",0)";
            let stroke = "none";
            if (_self.isSelected(d.patients) && !_self.props.store.advancedSelection) {
                stroke = "black";
            }
            partitions.push(<g key={d.partition} style={{backgroundColor: "darkgray"}}
                               onClick={(e) => _self.handleMouseClick(e, d.patients)}
                               transform={transform}><GroupPartition visMap={_self.props.visMap}
                                                                     store={_self.props.store}
                                                                     heatmap={_self.props.heatmap}
                                                                     currentVariables={_self.props.currentVariables}
                                                                     groupScale={_self.props.groupScale}
                                                                     tooltipFunctions={_self.props.tooltipFunctions}
                                                                     partition={d}
                                                                     partitionIndex={i}
                                                                     stroke={stroke}
                                                                     primaryVariableId={_self.props.primaryVariableId}/>
            </g>);
            for (let j = 0; j < d.rows.length; j++) {
                if (d.rows[j].variable === _self.props.primaryVariableId) {
                    previousXPosition += _self.props.groupScale(d.rows[j].counts[0].value) + 10;
                }
            }
        });
        return partitions;
    }

    handleMouseClick(event, patients) {
        if (event.button === 0) {
            this.props.store.handlePartitionSelection(patients);
        }
    }

    /**
     * checks if the patients in the partition are selected
     * @param patients
     * @returns {boolean}
     */
    isSelected(patients) {
        let isSelected = true;
        for (let i = 0; i < patients.length; i++) {
            if (!this.props.store.selectedPatients.includes(patients[i])) {
                isSelected = false;
                break;
            }
        }
        return isSelected;
    }

    render() {
        return (
            this.getPartitions()
        )
    }
});
export default GroupTimepoint;