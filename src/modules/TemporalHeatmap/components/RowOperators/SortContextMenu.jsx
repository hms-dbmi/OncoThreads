import React from 'react';
import {observer} from 'mobx-react';
import {Button, ButtonGroup} from 'react-bootstrap';

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
            <ButtonGroup vertical style={{
                visibility: this.props.showContextMenu,
                position: "absolute",
                top: this.props.contextY,
                left: this.props.contextX
            }}>
                <Button onClick={() => this.applySortToPrevious()}>Apply patient order to previous timepoint</Button>
                <Button onClick={() => this.applySortToNext()}>Apply patient order to next timepoint</Button>
                <Button onClick={() => this.applySortToAll()}>Apply patient order to all timepoints</Button>
            </ButtonGroup>
        )
    }
});
export default SortContextMenu;