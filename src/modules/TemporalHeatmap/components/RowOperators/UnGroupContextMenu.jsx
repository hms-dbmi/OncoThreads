import React from 'react';
import {observer} from 'mobx-react';
import {Button,ButtonGroup} from 'react-bootstrap';

/*
group context menu. Appears after a right click on the group button
 */
const UnGroupContextMenu = observer(class GroupContextMenu extends React.Component {
    constructor() {
        super();
        this.applyUnGroupToAll = this.applyUnGroupToAll.bind(this);
        this.applyUnGroupToPrevious = this.applyUnGroupToPrevious.bind(this);
        this.applyUnGroupToNext = this.applyUnGroupToNext.bind(this);
    }

    /**
     * applies grouping of the clicked timepoint to all timepoints
     */
    applyUnGroupToAll() {
        if (this.props.store.isContinuous(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type)) {
            this.props.openBinningModal(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type, this.props.store.applyUnGroupingToAll, this.props.clickedTimepoint);
        }
        else {
            this.props.store.applyUnGroupingToAll(this.props.clickedTimepoint, this.props.clickedVariable);
        }
    }

    /**
     * applies grouping of the clicked timepoint to the previous timepoint
     */
    applyUnGroupToPrevious() {
        if (this.props.store.isContinuous(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type)) {
            this.props.openBinningModal(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type, this.props.store.applyUnGroupingToPrevious, this.props.clickedTimepoint);
        }
        else {
            this.props.store.applyUnGroupingToPrevious(this.props.clickedTimepoint, this.props.clickedVariable);
        }
    }

    /**
     * applies grouping of the clicked timepoint to the next timepoint
     */
    applyUnGroupToNext() {
        if (this.props.store.isContinuous(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type)) {
            this.props.openBinningModal(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type, this.props.store.applyUnGroupingToNext, this.props.clickedTimepoint);
        }
        else {
            this.props.store.applyUnGroupingToNext(this.props.clickedTimepoint, this.props.clickedVariable);
        }
    }

    render() {
        return (
            <ButtonGroup vertical style={{
                visibility: this.props.showContextMenu,
                position: "absolute",
                top: this.props.contextY,
                left: this.props.contextX
            }}>
                <Button onClick={() => this.applyUnGroupToPrevious()}>Apply ungrouping to
                    previous timepoint
                </Button>
                <Button onClick={() => this.applyUnGroupToNext()}>Apply ungrouping to next
                    timepoint
                </Button>
                <Button onClick={() => this.applyUnGroupToAll()}>Apply ungrouping to all
                    timepoints
                </Button>
            </ButtonGroup>
        )
    }
});
export default UnGroupContextMenu;