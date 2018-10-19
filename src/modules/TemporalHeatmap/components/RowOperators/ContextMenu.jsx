import React from 'react';
import {observer} from 'mobx-react';
import {Button, ButtonGroup} from 'react-bootstrap';

/*
context menu, appears after a right click on the variables name
 */
const ContextMenu = observer(class ContextMenu extends React.Component {
    constructor(props) {
        super();
        this.type=props.store.timepoints[props.clickedTimepoint].type;
        this.applyActionToAll = this.applyActionToAll.bind(this);
        this.applyActionToPrevious = this.applyActionToPrevious.bind(this);
        this.applyActionToNext = this.applyActionToNext.bind(this);
    }

    /**
     * applies primary variable of the clicked timepoint to all timepoints
     */
    applyActionToAll() {
        const _self = this;
        if (this.props.store.timepointStores[this.type].variableStore.getById(this.props.clickedVariable).dataType==="NUMBER" && this.props.action !== "UNGROUP") {
            if (this.props.action === "GROUP") {
                this.props.openBinningModal(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type, this.props.clickedTimepoint, function (newID) {
                    _self.props.store.applyActionToAll(_self.props.clickedTimepoint, newID, _self.props.action);
                });
            } else {
                if (this.props.store.atLeastOneGrouped(this.props.store.timepoints[this.props.clickedTimepoint].type)) {
                    this.props.openBinningModal(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type, this.props.clickedTimepoint, function (newID) {
                        _self.props.store.applyActionToAll(_self.props.clickedTimepoint, newID, _self.props.action);
                    });
                }
            }
        }
        else {
            this.props.store.applyActionToAll(this.props.clickedTimepoint, this.props.clickedVariable, this.props.action);
        }
    }

    /**
     * applies primary variable of the clicked timepoint to previous timepoint
     */
    applyActionToPrevious() {
        const _self = this;
        if (this.props.store.timepointStores[this.type].variableStore.getById(this.props.clickedVariable).dataType==="NUMBER" && this.props.action !== "UNGROUP") {
            if (this.props.action === "GROUP") {
                this.props.openBinningModal(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type, this.props.clickedTimepoint, function (newID) {
                    _self.props.store.applyActionToPrevious(_self.props.clickedTimepoint, newID, _self.props.action);
                });
            } else {
                if (this.props.store.atLeastOneGrouped(this.props.store.timepoints[this.props.clickedTimepoint].type)) {
                    this.props.openBinningModal(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type, this.props.clickedTimepoint, function (newID) {
                        _self.props.store.applyActionToPrevious(_self.props.clickedTimepoint, newID, this.props.action);
                    });
                }
            }
        }
        else {
            this.props.store.applyActionToPrevious(this.props.clickedTimepoint, this.props.clickedVariable, this.props.action);
        }
    }

    /**
     * applies primary variable of the clicked timepoint to next timepoint
     */
    applyActionToNext() {
        const _self = this;
        if (this.props.store.timepointStores[this.type].variableStore.getById(this.props.clickedVariable).dataType==="NUMBER" && this.props.action !== "UNGROUP") {
            if (this.props.action === "GROUP") {
                this.props.openBinningModal(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type, this.props.clickedTimepoint, function (newID) {
                    _self.props.store.applyActionToNext(_self.props.clickedTimepoint, newID, _self.props.action);
                });
            } else {
                if (this.props.store.atLeastOneGrouped(this.props.store.timepoints[this.props.clickedTimepoint].type)) {
                    this.props.openBinningModal(this.props.clickedVariable, this.props.store.timepoints[this.props.clickedTimepoint].type, this.props.clickedTimepoint, function (newID) {
                        _self.props.store.applyActionToNext(_self.props.clickedTimepoint, newID, _self.props.action);
                    });
                }
            }
        }
        else {
            this.props.store.applyActionToNext(this.props.clickedTimepoint, this.props.clickedVariable, this.props.action);
        }
    }

    render() {
        return (
            <ButtonGroup vertical style={{
                position: "absolute",
                top: this.props.contextY,
                left: this.props.contextX
            }}>
                <Button
                    onClick={() => this.applyActionToPrevious()}>{"Apply " + this.props.action + " to previous timepoint"}</Button>
                <Button
                    onClick={() => this.applyActionToNext()}>{"Apply " + this.props.action + " to next timepoint"}</Button>
                <Button
                    onClick={() => this.applyActionToAll()}>{"Apply " + this.props.action + " to all timepoints"}</Button>
            </ButtonGroup>
        )
    }
});
export default ContextMenu;