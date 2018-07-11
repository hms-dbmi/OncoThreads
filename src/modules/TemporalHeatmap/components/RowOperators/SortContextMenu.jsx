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
        this.magicSort=this.magicSort.bind(this);
    }

    /**
     * applies sorting of the clicked timepoint to all timepoints
     */
    applySortToAll() {
        this.props.store.applySortingToAll(this.props.clickedTimepoint, this.props.clickedVariable);
    }

    /**
     * applies sorting of the clicked timepoint to previous timepoint
     */
    applySortToPrevious() {
        this.props.store.applySortingToPrevious(this.props.clickedTimepoint, this.props.clickedVariable);
    }

    /**
     * applies sorting of the clicked timepoint to next timepoint
     */
    applySortToNext() {
        this.props.store.applySortingToNext(this.props.clickedTimepoint, this.props.clickedVariable);
    }
    magicSort(){
        this.props.store.magicSort(this.props.clickedTimepoint,this.props.clickedVariable);
    }

    render() {
        return (
            <ButtonGroup vertical style={{
                visibility: this.props.showContextMenu,
                position: "absolute",
                top: this.props.contextY,
                left: this.props.contextX
            }}>
                <Button onClick={() => this.applySortToPrevious()}>Apply sorting to previous timepoint</Button>
                <Button onClick={() => this.applySortToNext()}>Apply sorting to next timepoint</Button>
                <Button onClick={() => this.applySortToAll()}>Apply sorting to all timepoints</Button>
                <Button onClick={()=> this.magicSort()}>Magic Sort</Button>
            </ButtonGroup>
        )
    }
});
export default SortContextMenu;