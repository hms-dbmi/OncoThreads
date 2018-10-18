import React from 'react';
import {observer} from 'mobx-react';
import SortContextMenu from './SortContextMenu'
import ContextMenu from "./ContextMenu";
/*
class creating the different sorts of context menus
 */
const ContextMenus = observer(class ContextMenus extends React.Component {
    render() {
        let showSort = this.props.type === "SORT" ? "visible" : "hidden";
        let showAction = this.props.type === "SORT" || this.props.type === "" ? "hidden" : "visible";
        return (
            <div>
                <ContextMenu showContextMenu={showAction} action={this.props.type} contextX={this.props.contextX}
                             contextY={this.props.contextY} clickedTimepoint={this.props.clickedTimepoint}
                             clickedVariable={this.props.clickedVariable}
                             store={this.props.store}
                             openBinningModal={this.props.openBinningModal}/>
                <SortContextMenu showContextMenu={showSort} contextX={this.props.contextX}
                                 contextY={this.props.contextY} clickedTimepoint={this.props.clickedTimepoint}
                                 clickedVariable={this.props.clickedVariable}
                                 store={this.props.store}/>
            </div>
        )
    }
});
export default ContextMenus;