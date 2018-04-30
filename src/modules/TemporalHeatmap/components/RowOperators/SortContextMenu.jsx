import React from 'react';
import {observer} from 'mobx-react';
/*
sort context menu, appears after a right click on the sort button
 */
const SortContextMenu = observer(class SortContextMenu extends React.Component {
    constructor() {
        super();
        this.applySortToAll = this.applySortToAll.bind(this);
        this.applySortToPrevious = this.applySortToPrevious.bind(this);
        this.applySortToNext = this.applySortToNext.bind(this);
    }

    /**
     * applies sorting of the clicked timepoint to all timepoints
     */
    applySortToAll() {
        this.props.store.applySortingToAll(this.props.clickedTimepoint);
    }

    /**
     * applies sorting of the clicked timepoint to previous timepoint
     */
    applySortToPrevious() {
        this.props.store.applySortingToPrevious(this.props.clickedTimepoint);
    }

    /**
     * applies sorting of the clicked timepoint to next timepoint
     */
    applySortToNext() {
        this.props.store.applySortingToNext(this.props.clickedTimepoint);
    }

    render() {
        return (
            <div className="context-menu" style={{
                visibility: this.props.showContextMenu,
                position: "absolute",
                top: this.props.contextY,
                left: this.props.contextX
            }}>
                <button onClick={() => this.applySortToPrevious()}>Apply sorting to previous timepoint</button>
                <button onClick={() => this.applySortToNext()}>Apply sorting to next timepoint</button>
                <button onClick={() => this.applySortToAll()}>Apply sorting to all timepoints</button>
            </div>
        )
    }
});
export default SortContextMenu;