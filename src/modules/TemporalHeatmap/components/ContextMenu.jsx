import React from 'react';
import {observer} from 'mobx-react';

const ContextMenu=observer(class ContextMenu extends React.Component{
    constructor(){
        super();
        this.sortAllEqual=this.sortAllEqual.bind(this);
        this.applySortToPrevious=this.applySortToPrevious.bind(this);
        this.applySortToNext=this.applySortToNext.bind(this);
    }
    sortAllEqual(){
        this.props.store.applySortingToAll(this.props.clickedTimepoint);
        this.setState({showContextMenu: "hidden"});
    }
    applySortToPrevious(){
        this.props.store.applySortingToPrevious(this.props.clickedTimepoint);
        this.setState({showContextMenu: "hidden"});
    }
    applySortToNext(){
        this.props.store.applySortingToNext(this.props.clickedTimepoint);
        this.setState({showContextMenu: "hidden"});
    }
   render(){
       return(
            <div className="context-menu" style={{visibility:this.props.showContextMenu, position:"absolute", top:this.props.contextY, left:this.props.contextX}}>
                    <button onClick={()=>this.applySortToPrevious()}>Apply sorting to previous timepoint</button>
                    <button onClick={()=>this.applySortToNext()}>Apply sorting to next timepoint</button>
                    <button onClick={()=>this.sortAllEqual()}>Apply sorting to all timepoints</button>
                </div>
       )
   }
});
export default ContextMenu;