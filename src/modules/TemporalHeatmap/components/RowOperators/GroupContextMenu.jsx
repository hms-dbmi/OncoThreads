import React from 'react';
import {observer} from 'mobx-react';
/*
group context menu. Appears after a right click on the group button
 */
const GroupContextMenu = observer(class GroupContextMenu extends React.Component {
    constructor() {
        super();
        this.applyGroupToAll = this.applyGroupToAll.bind(this);
        this.applyGroupToPrevious = this.applyGroupToPrevious.bind(this);
        this.applyGroupToNext = this.applyGroupToNext.bind(this);
    }

    /**
     * applies grouping of the clicked timepoint to all timepoints
     */
    applyGroupToAll() {
        if (this.props.store.isContinuous(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type)) {
            this.props.openBinningModal(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type, this.props.store.applyGroupingToAll, this.props.clickedTimepoint);
        }
        else {
            this.props.store.applyGroupingToAll(this.props.clickedTimepoint, this.props.clickedVariable);
        }
    }

    /**
     * applies grouping of the clicked timepoint to the previous timepoint
     */
    applyGroupToPrevious() {
        if (this.props.store.isContinuous(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type)) {
            this.props.openBinningModal(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type, this.props.store.applyGroupingToPrevious, this.props.clickedTimepoint);
        }
        else {
            this.props.store.applyGroupingToAll(this.props.clickedTimepoint, this.props.clickedVariable);
        }
    }

    /**
     * applies grouping of the clicked timepoint to the next timepoint
     */
    applyGroupToNext() {
        if (this.props.store.isContinuous(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type)) {
            this.props.openBinningModal(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type, this.props.store.applyGroupingToNext, this.props.clickedTimepoint);
        }
        else {
            this.props.store.applyGroupingToAll(this.props.clickedTimepoint, this.props.clickedVariable);
        }
    }

    render() {
        return (
            <div className="btn-group-vertical" style={{
                visibility: this.props.showContextMenu,
                position: "absolute",
                top: this.props.contextY,
                left: this.props.contextX
            }}>
                <button className="btn btn-secondary" onClick={() => this.applyGroupToPrevious()}>Apply grouping to previous timepoint</button>
                <button className="btn btn-secondary" onClick={() => this.applyGroupToNext()}>Apply grouping to next timepoint</button>
                <button className="btn btn-secondary" onClick={() => this.applyGroupToAll()}>Apply grouping to all timepoints</button>
            </div>
        )
    }
});
export default GroupContextMenu;