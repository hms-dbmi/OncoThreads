import React from 'react';
import {observer} from 'mobx-react';
import GroupTimepoint from './Group/GroupTimepoint'
import HeatmapTimepoint from './Heatmap/HeatmapTimepoint'
/*
basic timepoint class
 */
const Timepoint = observer(class Timepoint extends React.Component {
    /**
     * gets the timepoint. Creates a GroupTimepoint or a HeatmapTimepoint.
     * @returns Timepoint
     */
    getTimepoint() {
        if (this.props.groupOrder.isGrouped) {
            return (<GroupTimepoint {...this.props} timepoint={this.props.timepoint.group.data}
                                    primaryVariable={this.props.store.primaryVariables[this.props.index]}/>)
        }
        else {
            return (<HeatmapTimepoint {...this.props} timepoint={this.props.timepoint.heatmap}
                                      patientOrder={this.props.store.patientOrderPerTimepoint[this.props.index]}
                                      primaryVariable={this.props.store.primaryVariables[this.props.index]}/>);
        }

    }

    render() {
        return (
            this.getTimepoint()
        )
    }
});
export default Timepoint;