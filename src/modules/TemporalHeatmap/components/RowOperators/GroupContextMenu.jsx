import React from 'react';
import {observer} from 'mobx-react';
/*
group context menu. Appears after a right click on the group button
 */
const GroupContextMenu=observer(class GroupContextMenu extends React.Component{
    constructor(){
        super();
        this.applyGroupToAll=this.applyGroupToAll.bind(this);
        this.applyGroupToPrevious=this.applyGroupToPrevious.bind(this);
        this.applyGroupToNext=this.applyGroupToNext.bind(this);
    }

    /**
     * applies grouping of the clicked timepoint to all timepoints
     */
    applyGroupToAll(){
        this.props.store.applyGroupingToAll(this.props.clickedTimepoint,this.props.clickedVariable);
    }

    /**
     * applies grouping of the clicked timepoint to the previous timepoint
     */
    applyGroupToPrevious(){
        this.props.store.applyGroupingToPrevious(this.props.clickedTimepoint,this.props.clickedVariable);
    }

    /**
     * applies grouping of the clicked timepoint to the next timepoint
     */
    applyGroupToNext(){
        this.props.store.applyGroupingToNext(this.props.clickedTimepoint,this.props.clickedVariable);
    }
   render(){
       return(
            <div className="context-menu" style={{visibility:this.props.showContextMenu, position:"absolute", top:this.props.contextY, left:this.props.contextX}}>
                    <button onClick={()=>this.applyGroupToPrevious()}>Apply grouping to previous timepoint</button>
                    <button onClick={()=>this.applyGroupToNext()}>Apply grouping to next timepoint</button>
                    <button onClick={()=>this.applyGroupToAll()}>Apply grouping to all timepoints</button>
                </div>
       )
   }
});
export default GroupContextMenu;