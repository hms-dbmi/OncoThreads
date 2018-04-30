import React from 'react';
import {observer} from 'mobx-react';
import SortContextMenu from './SortContextMenu'
import GroupContextMenu from './GroupContextMenu'
import PromoteContextMenu from './PromoteContextMenu'
/*
class creating the different sorts of context menus
 */
const ContextMenus = observer(class ContextMenus extends React.Component {
    render() {
        return (
            <div>
                <SortContextMenu showContextMenu={this.props.showSortContextMenu} contextX={this.props.contextX}
                                 contextY={this.props.contextY} clickedTimepoint={this.props.clickedTimepoint}
                                 store={this.props.store}/>
                <GroupContextMenu showContextMenu={this.props.showGroupContextMenu} contextX={this.props.contextX}
                                  contextY={this.props.contextY} clickedTimepoint={this.props.clickedTimepoint}
                                  clickedVariable={this.props.clickedVariable}
                                  store={this.props.store}/>
                <PromoteContextMenu showContextMenu={this.props.showPromoteContextMenu} contextX={this.props.contextX}
                                    contextY={this.props.contextY} clickedTimepoint={this.props.clickedTimepoint}
                                    clickedVariable={this.props.clickedVariable}
                                    store={this.props.store}/>
            </div>
        )
    }
});
export default ContextMenus;