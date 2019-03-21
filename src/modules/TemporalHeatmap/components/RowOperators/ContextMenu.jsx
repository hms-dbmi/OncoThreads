import React from 'react';
import {inject, observer} from 'mobx-react';
import {Button, ButtonGroup} from 'react-bootstrap';

/**
 * Modal for a Context Menu that allows applying sorting, promoting, grouping and ungrouping to mutliple timepoints at once
 * Opens a binning modal if a variable has to be binned before grouping or when a continuous variable is promoted in grouped mode
 */
const ContextMenu = inject("dataStore", "undoRedoStore")(observer(class ContextMenu extends React.Component {
    constructor(props) {
        super();
        this.type = props.dataStore.timepoints[props.clickedTimepoint].type;
        this.variableStore = props.dataStore.variableStores[this.type];
        this.localIndex = props.dataStore.timepoints[props.clickedTimepoint].localIndex;
        this.variable = this.variableStore.getById(props.clickedVariable);
        this.applyActionToAll = this.applyActionToAll.bind(this);
        this.applyActionToPrevious = this.applyActionToPrevious.bind(this);
        this.applyActionToNext = this.applyActionToNext.bind(this);
    }

    /**
     * applies action to all timepoints
     */
    applyActionToAll() {
        if (this.variable.datatype === "NUMBER" && this.props.action !== "UNGROUP") {
            if (this.props.action === "GROUP") {
                this.props.openBinningModal(this.variable,  derivedVariable => {
                    this.variableStore.replaceDisplayedVariable(this.props.clickedVariable, derivedVariable);
                    this.variableStore.childStore.applyActionToAll(this.localIndex, derivedVariable.id, this.props.action);
                    this.props.undoRedoStore.saveTimepointHistory("APPLY " + this.props.action + " TO ALL", this.props.clickedVariable, this.type, this.props.clickedTimepoint);

                });
            } else {
                if (this.variableStore.childStore.atLeastOneGrouped(0, this.variableStore.childStore.timepoints.length - 1)) {
                    this.props.openBinningModal(this.variable,  derivedVariable => {
                        this.variableStore.replaceDisplayedVariable(this.props.clickedVariable, derivedVariable);
                        this.variableStore.childStore.applyActionToAll(this.localIndex, derivedVariable.id, this.props.action);
                        this.props.undoRedoStore.saveTimepointHistory("APPLY " + this.props.action + " TO ALL", this.props.clickedVariable, this.type, this.props.clickedTimepoint);

                    });
                }
                else {
                    this.variableStore.childStore.applyActionToAll(this.localIndex, this.props.clickedVariable, this.props.action);
                    this.props.undoRedoStore.saveTimepointHistory("APPLY " + this.props.action + " TO ALL", this.props.clickedVariable, this.type, this.props.clickedTimepoint);

                }
            }
        }
        else {
            this.variableStore.childStore.applyActionToAll(this.localIndex, this.props.clickedVariable, this.props.action);
            this.props.undoRedoStore.saveTimepointHistory("APPLY " + this.props.action + " TO ALL", this.props.clickedVariable, this.type, this.props.clickedTimepoint);

        }
        this.props.hideContextMenu();
    }

    /**
     * applies action to previous timepoint
     */
    applyActionToPrevious() {
        if (this.variable.datatype === "NUMBER" && this.props.action !== "UNGROUP") {
            if (this.props.action === "GROUP") {
                this.props.openBinningModal(this.variable,  derivedVariable => {
                    this.variableStore.replaceDisplayedVariable(this.props.clickedVariable, derivedVariable);
                    this.variableStore.childStore.applyActionToPrevious(this.localIndex, derivedVariable.id, this.props.action);
                    this.props.undoRedoStore.saveTimepointHistory("APPLY " + this.props.action + " TO PREVIOUS", this.props.clickedVariable, this.type, this.props.clickedTimepoint);
                });
            } else {
                if (this.variableStore.childStore.atLeastOneGrouped(this.localIndex - 1, this.localIndex)) {
                    this.props.openBinningModal(this.variable,  derivedVariable => {
                        this.variableStore.replaceDisplayedVariable(this.props.clickedVariable, derivedVariable);
                        this.variableStore.childStore.applyActionToPrevious(this.localIndex, derivedVariable.id, this.props.action);
                        this.props.undoRedoStore.saveTimepointHistory("APPLY " + this.props.action + " TO PREVIOUS", this.props.clickedVariable, this.type, this.props.clickedTimepoint);
                    });
                }
                else {
                    this.variableStore.childStore.applyActionToPrevious(this.localIndex, this.props.clickedVariable, this.props.action);
                    this.props.undoRedoStore.saveTimepointHistory("APPLY " + this.props.action + " TO PREVIOUS", this.props.clickedVariable, this.type, this.props.clickedTimepoint);
                }
            }
        }
        else {
            this.variableStore.childStore.applyActionToPrevious(this.localIndex, this.props.clickedVariable, this.props.action);
            this.props.undoRedoStore.saveTimepointHistory("APPLY " + this.props.action + " TO PREVIOUS", this.props.clickedVariable, this.type, this.props.clickedTimepoint);
        }
        this.props.hideContextMenu();
    }

    /**
     * applies action to next timepoint
     */
    applyActionToNext() {
        if (this.variable.datatype === "NUMBER" && this.props.action !== "UNGROUP") {
            if (this.props.action === "GROUP") {
                this.props.openBinningModal(this.variable, derivedVariable => {
                    this.variableStore.replaceDisplayedVariable(this.props.clickedVariable, derivedVariable);
                    this.variableStore.childStore.applyActionToNext(this.localIndex, derivedVariable.id, this.props.action);
                    this.props.undoRedoStore.saveTimepointHistory("APPLY " + this.props.action + " TO NEXT", this.props.clickedVariable, this.type, this.props.clickedTimepoint);

                });
            } else {
                if (this.variableStore.childStore.atLeastOneGrouped(this.localIndex, this.localIndex + 1)) {
                    this.props.openBinningModal(this.variable, derivedVariable => {
                        this.variableStore.replaceDisplayedVariable(this.props.clickedVariable, derivedVariable);
                        this.variableStore.childStore.applyActionToNext(this.localIndex, derivedVariable.id, this.props.action);
                        this.props.undoRedoStore.saveTimepointHistory("APPLY " + this.props.action + " TO NEXT", this.props.clickedVariable, this.type, this.props.clickedTimepoint);

                    });
                }
                else {
                    this.variableStore.childStore.applyActionToNext(this.localIndex, this.props.clickedVariable, this.props.action);
                    this.props.undoRedoStore.saveTimepointHistory("APPLY " + this.props.action + " TO NEXT", this.props.clickedVariable, this.type, this.props.clickedTimepoint);

                }
            }
        }
        else {
            this.variableStore.childStore.applyActionToNext(this.localIndex, this.props.clickedVariable, this.props.action);
            this.props.undoRedoStore.saveTimepointHistory("APPLY " + this.props.action + " TO NEXT", this.props.clickedVariable, this.type, this.props.clickedTimepoint);

        }
        this.props.hideContextMenu();

    }

    /**
     * sort all variables in one timepoint hierarchically and relign patients in other timepoints to this sorting
     */
    magicSort() {
        this.variableStore.childStore.timepoints[this.localIndex].magicSort(this.props.clickedVariable);
        this.props.undoRedoStore.saveTimepointHistory("MAGICSORT", this.props.clickedVariable, this.type, this.props.clickedTimepoint);
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
}));
export default ContextMenu;