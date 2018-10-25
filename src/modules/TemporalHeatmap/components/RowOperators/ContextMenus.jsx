import React from 'react';
import {observer} from 'mobx-react';
import ContextMenu from "./ContextMenu";
/*
class creating the different sorts of context menus
 */
const ContextMenus = observer(class ContextMenus extends React.Component {
    render() {
        let contextMenu = null;
        if (this.props.type !== "") {
            let timepointType = this.props.store.timepoints[this.props.clickedTimepoint].type;
            let localIndex = this.props.store.timepoints[this.props.clickedTimepoint].localIndex;
            contextMenu =
                <ContextMenu action={this.props.type} contextX={this.props.contextX}
                             contextY={this.props.contextY}
                             clickedVariable={this.props.clickedVariable}
                             hideContextMenu={this.props.hideContextMenu}
                             store={this.props.store.variableStores[timepointType]}
                             localIndex={localIndex}
                             openBinningModal={this.props.openBinningModal}/>
        }
        return (
            <div>
                {contextMenu}
            </div>
        )
    }
});
export default ContextMenus;