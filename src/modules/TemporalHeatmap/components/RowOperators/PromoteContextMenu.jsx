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
        this.props.store.applyPromotingToAll(this.props.clickedTimepoint, this.props.clickedVariable);
    }

    /**
     * applies primary variable of the clicked timepoint to previous timepoint
     */
    applyPromoteToPrevious() {
        this.props.store.applyPromotingToPrevious(this.props.clickedTimepoint, this.props.clickedVariable);
    }

    /**
     * applies primary variable of the clicked timepoint to next timepoint
     */
    applyPromoteToNext() {
        this.props.store.applyPromotingToNext(this.props.clickedTimepoint, this.props.clickedVariable);
    }

    render() {
        return (
            <div className="context-menu" style={{
                visibility: this.props.showContextMenu,
                position: "absolute",
                top: this.props.contextY,
                left: this.props.contextX
            }}>
                <button onClick={() => this.applyPromoteToPrevious()}>Apply promote to previous timepoint</button>
                <button onClick={() => this.applyPromoteToNext()}>Apply promote to next timepoint</button>
                <button onClick={() => this.applyPromoteToAll()}>Apply promote to all timepoints</button>
            </div>
        )
    }
});
export default PromoteContextMenu;