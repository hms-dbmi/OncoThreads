import React from 'react';
import {observer} from 'mobx-react';
/*
tooltip for hovering over Sankey Transition
 */
const SankeyTransitionTooltip=observer(class SankeyTransitionTooltip extends React.Component{

   render(){
       return(
            <div className="customTooltip" style={{visibility:this.props.visibility, position:"absolute", top:this.props.y, left:this.props.x}}>
                    <p>{this.props.content}</p>
                </div>
       )
   }
});
export default SankeyTransitionTooltip;