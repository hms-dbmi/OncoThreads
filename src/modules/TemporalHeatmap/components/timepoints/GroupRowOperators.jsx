import React from 'react';
import {observer} from 'mobx-react';

const GroupRowOperators=observer(class GroupRowOperators extends React.Component{
    constructor(){
        super();
        this.unGroup=this.unGroup.bind(this);
        this.promote=this.promote.bind(this);
    }
    unGroup(){
        this.props.store.unGroupTimepoint(this.props.timepoint,this.props.variable);
    }
    promote(){
        this.props.store.setPrimaryVariable(this.props.timepoint,this.props.variable);
        this.props.store.groupTimepoint(this.props.timepoint,this.props.variable)
    }
    render(){
        const transform="translate("+this.props.x+","+(this.props.y+2)+")";
        return(
            <g transform={transform}>
                <text onClick={this.unGroup}>U</text>
                <text x={10} onClick={this.promote}>P</text>
            </g>
        )
    }
});
export default GroupRowOperators;