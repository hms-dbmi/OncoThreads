import {createTransformer, extendObservable} from "mobx";
import DerivedVariable from "./DerivedVariable";
import OriginalVariable from "./OriginalVariable";

/**
 * handles undoing/redoing actions
 * Principle:
 * save datastructures which describe the state to a stack (variables, timepoints)
 * observable datastructures have to be serialized to be saved
 * when undoing/redoing map saved datastructures back to observable datastructures (deserializing)
 */
class UndoRedoStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.undoRedoMode = false;
        this.stateStack = [];
        extendObservable(this, {
            logs: [],
            currentPointer: -1
        });
        /*
        autorun(() => {
            console.log(this.currentPointer);
        });
        */
        this.undo = this.undo.bind(this);
        this.redo = this.redo.bind(this);
    }

    /**
     * undo the last action, add undo log
     */
    undo() {
        if (this.currentPointer !== 0) {
            if (this.rootStore.realTime) {
                this.rootStore.realTime = false;
            }
            this.logs.push("UNDO: " + this.logs[this.currentPointer]);
            this.deserialize(this.currentPointer - 1);
            this.currentPointer--;
            this.undoRedoMode = true;
        }
    }

    /**
     * redo the undone action, add redo log
     */
    redo() {
        if (this.currentPointer !== this.stateStack.length - 1) {
            this.logs.push("REDO: " + this.logs[this.currentPointer + 1]);
            this.deserialize(this.currentPointer + 1);
            this.currentPointer++;
            this.undoRedoMode = true;
        }


    }

    /**
     * deserializes the saved state: map saved state to original datastructures to keep them observable
     * @param index: current index in state stack
     */
    deserialize(index) {
        this.rootStore.sampleTimepointStore.timepoints = this.deserializeTimepoints(this.rootStore.sampleTimepointStore.timepoints.slice(), this.stateStack[index].sampleTimepoints);
        this.rootStore.betweenTimepointStore.timepoints = this.deserializeTimepoints(this.rootStore.betweenTimepointStore.timepoints.slice(), this.stateStack[index].betweenTimepoints);
        this.rootStore.sampleTimepointStore.variableStore.currentVariables = this.deserializeVariables(this.rootStore.sampleTimepointStore.variableStore.currentVariables.slice(), this.stateStack[index].currentSampleVar);
        this.rootStore.betweenTimepointStore.variableStore.currentVariables = this.deserializeVariables(this.rootStore.betweenTimepointStore.variableStore.currentVariables.slice(), this.stateStack[index].currentBetweenVar);
        this.rootStore.sampleTimepointStore.variableStore.allVariables = this.stateStack[index].allSampleVar;
        this.rootStore.betweenTimepointStore.variableStore.allVariables = this.stateStack[index].allBetweenVar;
        this.rootStore.transitionOn = this.stateStack[index].transitionOn;
        this.rootStore.timepointStore.initialize();
    }

    /**
     * deserializes the timepoint data structure
     * @param observable
     * @param saved
     */
    deserializeTimepoints(observable, saved) {
        if (saved.length === 0) {
            observable = [];
        }
        else {
            saved.forEach(function (d, i) {
                UndoRedoStore.remapProperties(observable[i], d);
            });
        }
        return observable;
    }


    /**
     * deserializes variables (maps saved state to the observable datastructure)
     * @param observable
     * @param saved
     */
    deserializeVariables(observable, saved) {
        let toAdd = [];
        let toDelete = [];
        //map the properties of the saved array to the observable array
        observable.forEach(function (d, i) {
            let idIndex = saved.map(function (g) {
                return g.id;
            }).indexOf(d.id);
            //index to delete
            if (idIndex === -1) {
                toDelete.push(i);
            }
            else {
                UndoRedoStore.remapProperties(d, saved[idIndex]);
            }
        });
        //delete variable
        for (let i = toDelete.length - 1; i >= 0; i--) {
            observable.splice(toDelete[i], 1);
        }
        //add variable if the saved variable array is longer than the observed variable array
            saved.forEach(function (d, i) {
                let idIndex = observable.map(function (g) {
                    return g.id;
                }).indexOf(d.id);
                if (idIndex === -1) {
                    toAdd.push(i);
                }
            });
            for (let i = 0; i < toAdd.length; i++) {
                let currItem = saved[toAdd[i]];
                if (currItem.derived) {
                    observable.splice(toAdd[i], 0, new DerivedVariable(currItem.id, currItem.name, currItem.datatype, currItem.originalIds, currItem.modificationType, currItem.modification))
                }
                else {
                    observable.splice(toAdd[i], 0, new OriginalVariable(currItem.id, currItem.name, currItem.datatype))
                }
        }
        return observable;
    }

    /**
     * remaps the property the saved entry to the observable entry
     * @param observableEntry
     * @param savedEntry
     */
    static remapProperties(observableEntry, savedEntry) {
        for (let property in savedEntry) {
            observableEntry[property] = savedEntry[property];
        }
    }

    /**
     * saves the history to the stateStack. For this the datastructures have to be serialized (put into a simple, non-observable object)
     */
    saveHistory() {
        const serialize = createTransformer(a => ({...a}));
        const serializeState = createTransformer(store => ({
            sampleTimepoints: store.rootStore.sampleTimepointStore.timepoints.map(serializeTimepoints),
            betweenTimepoints: store.rootStore.betweenTimepointStore.timepoints.map(serializeTimepoints),
            currentSampleVar: store.rootStore.sampleTimepointStore.variableStore.currentVariables.map(serialize),
            currentBetweenVar: store.rootStore.betweenTimepointStore.variableStore.currentVariables.map(serialize),
            allSampleVar: store.rootStore.sampleTimepointStore.variableStore.allVariables,
            allBetweenVar: store.rootStore.betweenTimepointStore.variableStore.allVariables,
            transitionOn: store.rootStore.transitionOn
        }));
        const serializeTimepoints = createTransformer(timepoint => ({
            type: timepoint.type,
            patients: timepoint.patients,
            globalIndex: timepoint.globalIndex,
            localIndex: timepoint.localIndex,
            heatmap: timepoint.heatmap.map(serialize),
            grouped: timepoint.grouped.map(serialize),
            heatmapOrder: timepoint.heatmapOrder,
            groupOrder: timepoint.groupOrder,
            isGrouped: timepoint.isGrouped,
            primaryVariableId: timepoint.primaryVariableId
        }));
        //delete the top of the stack if we switch from undoRedoMode to the normal saving of the state
        if (this.undoRedoMode) {
            this.stateStack = this.stateStack.slice(0, this.currentPointer + 1);
            this.undoRedoMode = false;
        }
        this.stateStack.push(serializeState(this));
        this.currentPointer = this.stateStack.length - 1;
    }

    /**
     * saves the history of a timepoint (in logs and in stateStack)
     * @param operation
     * @param variableId
     * @param timepointType
     * @param timepointIndex
     */
    saveTimepointHistory(operation, variableId, timepointType, timepointIndex) {
        const variableName = this.rootStore.timepointStore.variableStore[timepointType].getById(variableId).name;
        let type = "Timepoint";
        if (timepointType === "between") {
            type = "Transition";
        }
        this.logs.push(operation + ": " + variableName + " at " + type + " " + timepointIndex);
        this.saveHistory();
    }

    /**
     * saves the history of a variale (in logs and in stateStack)
     * @param operation
     * @param variable
     * @param saveToStack
     */
    saveVariableHistory(operation, variable,saveToStack) {
        this.logs.push(operation + ": " + variable);
            this.saveHistory();

    }
    saveVariableModification(type,variable,saveToStack){
        if(saveToStack){
            this.logs.push("MODIFY VARIABLE: "+variable+", Type: "+type);
            this.saveHistory();
        }
        else{
            this.logs.push("(MODIFY VARIABLE: "+variable+", Type: "+type+")");
        }
    }

    /**
     * saves realigning to the history
     * @param timepointType
     * @param timepointIndex
     */
    saveRealignToHistory(timepointType, timepointIndex) {
        let type = "Timepoint";
        if (timepointType === "between") {
            type = "Transition";
        }
        this.logs.push("REALIGN PATIENTS: based on " + type + " " + timepointIndex);
        this.saveHistory();
    }


}


export default UndoRedoStore