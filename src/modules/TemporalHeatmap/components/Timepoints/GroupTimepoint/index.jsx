import React from 'react';
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react';
import PropTypes from 'prop-types';
import GroupPartition from './GroupPartition';
import OriginalVariable from '../../../stores/OriginalVariable';
import DerivedVariable from '../../../stores/DerivedVariable';

const GroupTimepoint = inject('dataStore', 'uiStore', 'visStore')(observer(class GroupTimepoint extends React.Component {
    /**
     * gets the different partitions in the grouped timepoint
     */
    getPartitions() {
        const partitions = [];
        let previousXPosition = 0;

        let stageLabels = this.props.dataStore.variableStores.sample.stageLabels

        this.props.group.forEach((d, i) => {
            const transform = `translate(${previousXPosition},0)`;
            let stroke = 'none';
            if (this.isSelected(d.patients) && !this.props.uiStore.advancedSelection) {
                stroke = 'black';
            }
            partitions.push(
                <g
                    key={String(d.partition)}
                    style={{ backgroundColor: 'darkgray' }}
                    transform={transform}
                >
                    <GroupPartition
                        heatmap={this.props.heatmap}
                        currentVariables={this.props.currentVariables}
                        tooltipFunctions={this.props.tooltipFunctions}
                        partition={d}
                        partitionIndex={i}
                        stroke={stroke}
                        primaryVariableId={this.props.primaryVariableId}
                        stageLabels={stageLabels}
                    />
                </g>,
            );
            previousXPosition += this.props.visStore.groupScale(d.patients.length) + 10;
        });
        return partitions;
    }

    /**
     * checks if the patients in the partition are selected
     * @param {string[]} patients
     * @returns {boolean}
     */
    isSelected(patients) {
        let isSelected = true;
        for (let i = 0; i < patients.length; i++) {
            if (!this.props.dataStore.selectedPatients.includes(patients[i])) {
                isSelected = false;
                break;
            }
        }
        return isSelected;
    }

    render() {
        return (
            this.getPartitions()
        );
    }
}));
GroupTimepoint.propTypes = {
    group: PropTypes.arrayOf(PropTypes.object).isRequired,
    heatmap: MobxPropTypes.observableArray.isRequired,
    currentVariables: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.instanceOf(DerivedVariable),
        PropTypes.instanceOf(OriginalVariable),
    ])).isRequired,
    tooltipFunctions: PropTypes.objectOf(PropTypes.func).isRequired,
    primaryVariableId: PropTypes.string.isRequired,
};
export default GroupTimepoint;
