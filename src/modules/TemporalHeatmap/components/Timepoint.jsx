import React from 'react';
import {observer} from 'mobx-react';
import FlowTimepoint from './FlowTimepoint'
import HeatmapTimepoint from './HeatmapTimepoint'

const Timepoint = observer(class Timepoint extends React.Component {
    getTimepoint() {
        if(this.props.isGrouped){
            return(<FlowTimepoint {...this.props} timepoint={this.props.timepoint.group}/>)
        }
        else{
            return(<HeatmapTimepoint {...this.props} timepoint={this.props.timepoint.heatmap}/>);
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