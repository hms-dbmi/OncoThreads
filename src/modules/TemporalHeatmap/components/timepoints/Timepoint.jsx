import React from 'react';
import {observer} from 'mobx-react';
import FlowTimepoint from './FlowTimepoint'
import HeatmapTimepoint from './HeatmapTimepoint'
import * as d3 from "d3";

const Timepoint = observer(class Timepoint extends React.Component {

    getTimepoint() {
        if(this.props.store.isGrouped[this.props.index]){
            return(<FlowTimepoint {...this.props} timepoint={this.props.timepoint.group} primaryVariable={this.props.store.primaryVariables[this.props.index]}/>)
        }
        else{
            return(<HeatmapTimepoint {...this.props} timepoint={this.props.timepoint.heatmap} patientOrder={this.props.store.patientOrderPerTimepoint[this.props.index]}
            primaryVariable={this.props.store.primaryVariables[this.props.index]}/>);
        }

    }

    render() {
        return (
            <g>
                {this.getTimepoint()}
            </g>
        )
    }
});
export default Timepoint;