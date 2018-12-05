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
        this.variable = props.store.getById(props.clickedVariable);
        this.applyActionToAll = this.applyActionToAll.bind(this);
        this.applyActionToPrevious = this.applyActionToPrevious.bind(this);
        this.applyActionToNext = this.applyActionToNext.bind(this);
    }

    /**
     * applies primary variable of the clicked timepoint to all timepoints
     */
    applyActionToAll() {
        if (this.variable.datatype === "NUMBER" && this.props.action !== "UNGROUP") {
            if (this.props.action === "GROUP") {
                this.props.openBinningModal(this.variable, this.type, derivedVariable => {
                    this.props.store.replaceDisplayedVariable(this.props.clickedVariable, derivedVariable);
                    this.props.store.childStore.applyActionToAll(this.props.localIndex, derivedVariable.id, this.props.action);
                });
            } else {
                if (this.props.store.childStore.atLeastOneGrouped(0, this.props.store.childStore.timepoints.length - 1)) {
                    this.props.openBinningModal(this.variable, this.type, derivedVariable=> {
                        this.props.store.replaceDisplayedVariable(this.props.clickedVariable, derivedVariable);
                        this.props.store.childStore.applyActionToAll(this.props.localIndex, derivedVariable.id, this.props.action);
                    });
                }
                else {
                    this.props.store.childStore.applyActionToAll(this.props.localIndex, this.props.clickedVariable, this.props.action);
                }
            }
        }
        else {
            this.props.store.childStore.applyActionToAll(this.props.localIndex, this.props.clickedVariable, this.props.action);
        }
        this.props.hideContextMenu();
    }

    /**
     * applies primary variable of the clicked timepoint to previous timepoint
     */
    applyActionToPrevious() {
        if (this.variable.datatype === "NUMBER" && this.props.action !== "UNGROUP") {
            if (this.props.action === "GROUP") {
                this.props.openBinningModal(this.variable, this.type, derivedVariable => {
                    this.props.store.replaceDisplayedVariable(this.props.clickedVariable, derivedVariable);
                    this.props.store.childStore.applyActionToPrevious(this.props.localIndex, derivedVariable.id, this.props.action);
                });
            } else {
                if (this.props.store.childStore.atLeastOneGrouped(this.props.localIndex - 1, this.props.localIndex)) {
                    this.props.openBinningModal(this.variable, this.type, derivedVariable => {
                        this.props.store.replaceDisplayedVariable(this.props.clickedVariable, derivedVariable);
                        this.props.store.childStore.applyActionToPrevious(this.props.localIndex, derivedVariable.id, this.props.action);
                    });
                }
                else {
                    this.props.store.childStore.applyActionToPrevious(this.props.localIndex, this.props.clickedVariable, this.props.action);
                }
            }
        }
        else {
            this.props.store.childStore.applyActionToPrevious(this.props.localIndex, this.props.clickedVariable, this.props.action);
        }
        this.props.hideContextMenu();
    }

    /**
     * applies primary variable of the clicked timepoint to next timepoint
     */
    applyActionToNext() {
        if (this.variable.datatype === "NUMBER" && this.props.action !== "UNGROUP") {
            if (this.props.action === "GROUP") {
                this.props.openBinningModal(this.variable, this.type, derivedVariable => {
                    this.props.store.replaceDisplayedVariable(this.props.clickedVariable, derivedVariable);

                    this.props.store.childStore.applyActionToNext(this.props.localIndex, derivedVariable.id, this.props.action);
                });
            } else {
                if (this.props.store.childStore.atLeastOneGrouped(this.props.localIndex, this.props.localIndex + 1)) {
                    this.props.openBinningModal(this.variable, this.type, derivedVariable => {
                        this.props.store.replaceDisplayedVariable(this.props.clickedVariable, derivedVariable);
                        this.props.store.childStore.applyActionToNext(this.props.localIndex, derivedVariable.id, this.props.action);
                    });
                }
                else {
                    this.props.store.childStore.applyActionToNext(this.props.localIndex, this.props.clickedVariable, this.props.action);
                }
            }
        }
        else {
            this.props.store.childStore.applyActionToNext(this.props.localIndex, this.props.clickedVariable, this.props.action);
        }
        this.props.hideContextMenu();

    }

    magicSort() {
        this.props.store.childStore.timepoints[this.props.localIndex].magicSort(this.props.clickedVariable);
        this.props.hideContextMenu();

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