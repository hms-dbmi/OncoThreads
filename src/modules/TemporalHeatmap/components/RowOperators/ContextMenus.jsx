import React from 'react';
import {inject, observer, Provider} from 'mobx-react';
import ContextMenu from "./ContextMenu";
/*
class creating the different sorts of context menus
 */
const ContextMenus = inject("dataStore")(observer(class ContextMenus extends React.Component {
    render() {
        let contextMenu = null;
        if (this.props.type !== "") {
            let timepointType = this.props.dataStore.timepoints[this.props.clickedTimepoint].type;
            let localIndex = this.props.dataStore.timepoints[this.props.clickedTimepoint].localIndex;
            contextMenu =
                <Provider variableStore={this.props.dataStore.variableStores[timepointType]}>
                    <ContextMenu action={this.props.type} contextX={this.props.contextX}
                                 contextY={this.props.contextY}
                                 clickedVariable={this.props.clickedVariable}
                                 clickedTimepoint={this.props.clickedTimepoint}
                                 hideContextMenu={this.props.hideContextMenu}
                                 localIndex={localIndex}
                                 openBinningModal={this.props.openBinningModal}/>
                </Provider>
        }
        return (
            <div>
                {contextMenu}
            </div>
        )
    }
}));
export default ContextMenus;