import React from 'react';
import {observer} from 'mobx-react';
import SortContextMenu from './SortContextMenu'
import ContextMenu from "./ContextMenu";
/*
class creating the different sorts of context menus
 */
const ContextMenus = observer(class ContextMenus extends React.Component {
    render() {
        let contextMenu = null;
        if (this.props.type === 'SORT') {
            contextMenu = <SortContextMenu contextX={this.props.contextX}
                                           contextY={this.props.contextY} clickedTimepoint={this.props.clickedTimepoint}
                                           clickedVariable={this.props.clickedVariable}
                                           store={this.props.store}/>
        }
        else if (this.props.type !== "") {
            contextMenu =
                <ContextMenu action={this.props.type} contextX={this.props.contextX}
                             contextY={this.props.contextY} clickedTimepoint={this.props.clickedTimepoint}
                             clickedVariable={this.props.clickedVariable}
                             store={this.props.store}
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