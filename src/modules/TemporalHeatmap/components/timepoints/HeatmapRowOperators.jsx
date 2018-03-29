import React from 'react';
import {observer} from 'mobx-react';

const HeatmapRowOperators=observer(class HeatmapRowOperators extends React.Component{
    constructor(){
        super();
        this.sort=this.sort.bind(this);
        this.group=this.group.bind(this);
    }
    group(){
        this.props.store.setPrimaryVariable(this.props.timepoint,this.props.variable);
        this.props.store.groupTimepoint(this.props.timepoint,this.props.variable);
    }
    sort(){
        this.props.store.setPrimaryVariable(this.props.timepoint,this.props.variable);
        this.props.store.sortHeatmapTimepoint(this.props.timepoint,this.props.variable);
    }
    render(){
        const transform="translate("+this.props.x+","+(this.props.y+2)+")";
        return(
            <g transform={transform}>
                <text onClick={this.group}>G</text>
                <text x={10} onClick={this.sort}>S</text>
            </g>
        )
    }
});
export default HeatmapRowOperators;