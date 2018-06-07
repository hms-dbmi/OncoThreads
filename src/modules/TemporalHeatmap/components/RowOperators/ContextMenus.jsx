import React from 'react';
import {observer} from 'mobx-react';
import SortContextMenu from './SortContextMenu'
import GroupContextMenu from './GroupContextMenu'
import PromoteContextMenu from './PromoteContextMenu'
import UnGroupContextMenu from './UnGroupContextMenu'
/*
class creating the different sorts of context menus
 */
const ContextMenus = observer(class ContextMenus extends React.Component {
    render() {
        let show={sort:"hidden",group:"hidden",promote:"hidden",ungroup:"hidden"};
        show[this.props.type]="visible";
        return (
            <div>
                <SortContextMenu showContextMenu={show.sort} contextX={this.props.contextX}
                                  contextY={this.props.contextY} clickedTimepoint={this.props.clickedTimepoint}
                                  clickedVariable={this.props.clickedVariable}
                                  store={this.props.store}/>
                <GroupContextMenu showContextMenu={show.group} contextX={this.props.contextX}
                                  contextY={this.props.contextY} clickedTimepoint={this.props.clickedTimepoint}
                                  clickedVariable={this.props.clickedVariable}
                                  store={this.props.store}
                                  openBinningModal={this.props.openBinningModal}/>
                <PromoteContextMenu showContextMenu={show.promote} contextX={this.props.contextX}
                                    contextY={this.props.contextY} clickedTimepoint={this.props.clickedTimepoint}
                                    clickedVariable={this.props.clickedVariable}
                                    store={this.props.store}
                                    openBinningModal={this.props.openBinningModal}/>
                <UnGroupContextMenu showContextMenu={show.ungroup} contextX={this.props.contextX}
                                  contextY={this.props.contextY} clickedTimepoint={this.props.clickedTimepoint}
                                  clickedVariable={this.props.clickedVariable}
                                  store={this.props.store}
                                  openBinningModal={this.props.openBinningModal}/>
            </div>
        )
    }
});
export default ContextMenus;