import React from 'react';
import {observer} from 'mobx-react';
import {Button, ButtonGroup} from 'react-bootstrap';

/*
context menu, appears after a right click on the variables name
 */
const ContextMenu = observer(class ContextMenu extends React.Component {
    constructor(props) {
        super();
        this.type = props.store.type;
        this.applyActionToAll = this.applyActionToAll.bind(this);
        this.applyActionToPrevious = this.applyActionToPrevious.bind(this);
        this.applyActionToNext = this.applyActionToNext.bind(this);
    }

    /**
     * applies primary variable of the clicked timepoint to all timepoints
     */
    applyActionToAll() {
        const _self = this;
        if (this.props.store.getById(this.props.clickedVariable).dataType === "NUMBER" && this.props.action !== "UNGROUP") {
            if (this.props.action === "GROUP") {
                this.props.openBinningModal(this.props.clickedVariable, this.type, this.props.clickedTimepoint, function (newID) {
                    _self.props.store.childStore.applyActionToAll(_self.props.localIndex, newID, _self.props.action);
                });
            } else {
                if (this.props.store.childStore.atLeastOneGrouped()) {
                    this.props.openBinningModal(this.props.clickedVariable, this.type, this.props.clickedTimepoint, function (newID) {
                        _self.props.store.childStore.applyActionToAll(_self.props.localIndex, newID, _self.props.action);
                    });
                }
            }
        }
        else {
            this.props.store.childStore.applyActionToAll(this.props.localIndex, this.props.clickedVariable, this.props.action);
        }
        this.props.hideContextMenu();
        this.props.store.rootStore.undoRedoStore.saveTimepointHistory("APPLY " + this.props.action + " TO ALL", this.props.clickedVariable, this.type, this.props.localIndex)
    }

    /**
     * applies primary variable of the clicked timepoint to previous timepoint
     */
    applyActionToPrevious() {
        const _self = this;
        if (this.props.store.getById(this.props.clickedVariable).dataType === "NUMBER" && this.props.action !== "UNGROUP") {
            if (this.props.action === "GROUP") {
                this.props.openBinningModal(this.props.clickedVariable, this.type, this.props.clickedTimepoint, function (newID) {
                    _self.props.store.childStore.applyActionToPrevious(_self.props.localIndex, newID, _self.props.action);
                });
            } else {
                if (this.props.store.childStore.atLeastOneGrouped()) {
                    this.props.openBinningModal(this.props.clickedVariable, this.type, this.props.clickedTimepoint, function (newID) {
                        _self.props.store.childStore.applyActionToPrevious(_self.props.localIndex, newID, this.props.action);
                    });
                }
            }
        }
        else {
            this.props.store.childStore.applyActionToPrevious(_self.props.localIndex, this.props.clickedVariable, this.props.action);
        }
        this.props.hideContextMenu();
        this.props.store.rootStore.undoRedoStore.saveTimepointHistory("APPLY " + this.props.action + " TO PREVIOUS", this.props.clickedVariable, this.type, this.props.localIndex)
    }

    /**
     * applies primary variable of the clicked timepoint to next timepoint
     */
    applyActionToNext() {
        const _self = this;
        if (this.props.store.getById(this.props.clickedVariable).dataType === "NUMBER" && this.props.action !== "UNGROUP") {
            if (this.props.action === "GROUP") {
                this.props.openBinningModal(this.props.clickedVariable, this.type, this.props.clickedTimepoint, function (newID) {
                    _self.props.store.childStore.applyActionToNext(_self.props.localIndex, newID, _self.props.action);
                });
            } else {
                if (this.props.store.childStore.atLeastOneGrouped()) {
                    this.props.openBinningModal(this.props.clickedVariable, this.type, this.props.clickedTimepoint, function (newID) {
                        _self.props.store.childStore.applyActionToNext(_self.props.localIndex, newID, _self.props.action);
                    });
                }
            }
        }
        else {
            this.props.store.childStore.applyActionToNext(this.props.localIndex, this.props.clickedVariable, this.props.action);
        }
        this.props.hideContextMenu();
        this.props.store.rootStore.undoRedoStore.saveTimepointHistory("APPLY " + this.props.action + " TO NEXT", this.props.clickedVariable, this.type, this.props.localIndex)

    }

    magicSort() {
        this.props.store.childStore.timepoints[this.props.localIndex].magicSort(this.props.clickedVariable);
        this.props.hideContextMenu();
        this.props.store.rootStore.undoRedoStore.saveTimepointHistory("MAGICSORT", this.props.clickedVariable, this.type, this.props.localIndex)

    }

    render() {
        let magicSort = null;
        if (this.props.action === "SORT") {
            magicSort = <Button
                onClick={() => this.magicSort()}>{"MagicSort"}</Button>
        }
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
                {magicSort}
            </ButtonGroup>
        )
    }
});
export default ContextMenu;