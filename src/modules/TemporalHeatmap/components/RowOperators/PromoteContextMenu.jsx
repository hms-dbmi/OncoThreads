import React from 'react';
import {observer} from 'mobx-react';
/*
promote context menu, appears after a right click on the variables name
 */
const PromoteContextMenu = observer(class PromoteContextMenu extends React.Component {
    constructor() {
        super();
        this.applyPromoteToAll = this.applyPromoteToAll.bind(this);
        this.applyPromoteToPrevious = this.applyPromoteToPrevious.bind(this);
        this.applyPromoteToNext = this.applyPromoteToNext.bind(this);
    }

    /**
     * applies primary variable of the clicked timepoint to all timepoints
     */
    applyPromoteToAll() {
        if (this.props.store.timepoints[this.props.clickedTimepoint].isGrouped && this.props.store.isContinuous(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type)) {
            this.props.openBinningModal(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type, this.props.store.applyPromotingToAll, this.props.clickedTimepoint);
        }
        else {
            this.props.store.applyPromotingToAll(this.props.clickedTimepoint, this.props.clickedVariable);
        }
    }

    /**
     * applies primary variable of the clicked timepoint to previous timepoint
     */
    applyPromoteToPrevious() {
        if (this.props.store.timepoints[this.props.clickedTimepoint].isGrouped && this.props.store.isContinuous(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type)) {
            this.props.openBinningModal(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type, this.props.store.applyPromotingToPrevious, this.props.clickedTimepoint);
        }
        else {
            this.props.store.applyPromoteToPrevious(this.props.clickedTimepoint, this.props.clickedVariable);
        }
    }

    /**
     * applies primary variable of the clicked timepoint to next timepoint
     */
    applyPromoteToNext() {
        if (this.props.store.timepoints[this.props.clickedTimepoint].isGrouped && this.props.store.isContinuous(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type)) {
            this.props.openBinningModal(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type, this.props.store.applyPromotingToNext, this.props.clickedTimepoint);
        }
        else {
            this.props.store.applyPromotingToNext(this.props.clickedTimepoint, this.props.clickedVariable);
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
                <button className="btn btn-secondary" onClick={() => this.applyPromoteToPrevious()}>Apply promote to previous timepoint</button>
                <button className="btn btn-secondary" onClick={() => this.applyPromoteToNext()}>Apply promote to next timepoint</button>
                <button className="btn btn-secondary" onClick={() => this.applyPromoteToAll()}>Apply promote to all timepoints</button>
            </div>
        )
    }
});
export default PromoteContextMenu;