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
        if (this.props.timepoint.isGrouped) {
            return (<GroupTimepoint {...this.props} timepoint={this.props.timepoint.grouped}
                                    primaryVariable={this.props.timepoint.primaryVariable}/>)
        }
        else {
            return (<HeatmapTimepoint {...this.props}
                                      ypi={this.props.ypi}
                                      ht={this.props.ht}
                                      eventStartEnd={this.props.eventStartEnd}
                                      timepoint={this.props.timepoint.heatmap}
                                      patientOrder={this.props.timepoint.heatmapOrder}
                                      primaryVariable={this.props.timepoint.primaryVariable}/>);
        }

    }

    render() {
        return (
            this.getTimepoint()
        )
    }
});
export default Timepoint;