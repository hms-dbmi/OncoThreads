import React from 'react';
import {observer} from 'mobx-react';

import GroupPartition from './GroupPartition'
/*
creates a grouped timepoint
 */
const GroupTimepoint = observer(class GroupTimepoint extends React.Component {
    /**
     * gets the different partitions in the grouped timepoint
     * @returns partitions
     */
    getPartitions(){
        let partitions=[];
         const _self = this;
        let previousXPosition = 0;
        this.props.timepoint.forEach(function (d, i) {
            const transform = "translate(" + previousXPosition + ",0)";
            partitions.push(<g key={d.partition} transform={transform}><GroupPartition key={d.partition}{..._self.props} partition={d} partitionIndex={i}/></g>);
            for (let j = 0; j < d.rows.length; j++) {
                if (d.rows[j].variable === _self.props.primaryVariable) {
                    previousXPosition += _self.props.groupScale(d.rows[j].counts[0].value) + 10;
                }
            }
        });
        return partitions;
    }

    render() {
        return (
            this.getPartitions()
        )
    }
});
export default GroupTimepoint;