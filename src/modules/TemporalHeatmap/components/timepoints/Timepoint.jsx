import React from 'react';
import {observer} from 'mobx-react';
import FlowTimepoint from './Group/GroupTimepoint'
import HeatmapTimepoint from './Heatmap/HeatmapTimepoint'

const Timepoint = observer(class Timepoint extends React.Component {

    getTimepoint() {
        if (this.props.groupOrder.isGrouped) {
            return (<FlowTimepoint {...this.props} timepoint={this.props.timepoint.group.data}
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