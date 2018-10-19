import {createTransformer, extendObservable, toJS} from "mobx";
import DerivedVariable from "./DerivedVariable";
import OriginalVariable from "./OriginalVariable";
import SingleTimepoint from "./SingleTimepoint";

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
        this.rootStore.timepointStore.timepointStores.sample.timepoints = this.deserializeTimepoints(this.rootStore.timepointStore.timepointStores.sample.timepoints.slice(), this.stateStack[index].sampleTimepoints);
        this.rootStore.timepointStore.timepointStores.between.timepoints = this.deserializeTimepoints(this.rootStore.timepointStore.timepointStores.between.timepoints.slice(), this.stateStack[index].betweenTimepoints);
        this.rootStore.timepointStore.timepointStores.sample.variableStore.currentVariables = this.deserializeVariables(this.rootStore.timepointStore.timepointStores.sample.variableStore.currentVariables.slice(), this.stateStack[index].currentSampleVar);
        this.rootStore.timepointStore.timepointStores.between.variableStore.currentVariables = this.deserializeVariables(this.rootStore.timepointStore.timepointStores.between.variableStore.currentVariables.slice(), this.stateStack[index].currentBetweenVar);
        this.rootStore.timepointStore.timepointStores.sample.variableStore.allVariables = this.stateStack[index].allSampleVar;
        this.rootStore.timepointStore.timepointStores.between.variableStore.allVariables = this.stateStack[index].allBetweenVar;
        this.rootStore.timepointStore.transitionOn = this.stateStack[index].transitionOn;
        this.rootStore.timepointStore.globalTime = this.stateStack[index].globalTime;
        this.rootStore.eventDetails = this.stateStack[index].eventDetails;
        this.rootStore.timepointStructure = this.deserializeTPStructure(this.rootStore.timepointStructure, this.stateStack[index].timepointStructure);
        this.rootStore.timepointStore.initialize();
    }

    deserializeLocalStorage() {
        this.stateStack = JSON.parse(localStorage.getItem(this.rootStore.study.studyId)).states;
        this.logs = JSON.parse(localStorage.getItem(this.rootStore.study.studyId)).logs;
        this.currentPointer = this.stateStack.length - 1;
        this.deserialize(this.currentPointer)
    }

    /**
     * deserializes the timepoint data structure
     * @param observable
     * @param saved
     */
    deserializeTimepoints(observable, saved) {
        const _self = this;
        observable = [];
        saved.forEach(function (d) {
            observable.push(new SingleTimepoint(_self.rootStore, d.primaryVariableId, d.patients, d.type, d.localIndex, d.heatmapOrder))
        });
        saved.forEach(function (d, i) {
            UndoRedoStore.remapProperties(observable[i], d);
        });
        return observable;
    }

    deserializeTPStructure(observable, saved) {
        observable = [];
        saved.forEach(function (d) {
            observable.push(d)
        });
        saved.forEach(function (d, i) {
            UndoRedoStore.remapProperties(observable[i], d);
        });
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
                observable.splice(toAdd[i], 0, new DerivedVariable(currItem.id, currItem.name, currItem.datatype, currItem.originalIds, currItem.modificationType, currItem.modification, currItem.domain, currItem.range))
            }
            else {
                observable.splice(toAdd[i], 0, new OriginalVariable(currItem.id, currItem.name, currItem.datatype, currItem.domain, currItem.range))
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
        const serializeState = createTransformer(store => ({
            sampleTimepoints: store.rootStore.timepointStore.timepointStores.sample.timepoints.map(serializeTimepoints),
            betweenTimepoints: store.rootStore.timepointStore.timepointStores.between.timepoints.map(serializeTimepoints),
            currentSampleVar: toJS(store.rootStore.timepointStore.timepointStores.sample.variableStore.currentVariables),
            currentBetweenVar: toJS(store.rootStore.timepointStore.timepointStores.between.variableStore.currentVariables),
            allSampleVar: store.rootStore.timepointStore.timepointStores.sample.variableStore.allVariables,
            allBetweenVar: store.rootStore.timepointStore.timepointStores.between.variableStore.allVariables,
            transitionOn: store.rootStore.timepointStore.transitionOn,
            globalTime: store.rootStore.timepointStore.globalTime,
            timepointStructure: toJS(store.rootStore.timepointStructure),
            eventDetails: store.rootStore.eventDetails.slice()
        }));
        //delete the top of the stack if we switch from undoRedoMode to the normal saving of the state
        const serializeTimepoints = createTransformer(timepoint => ({
            type: timepoint.type,
            patients: timepoint.patients.map(d => d),
            globalIndex: timepoint.globalIndex,
            localIndex: timepoint.localIndex,
            previousOrder: timepoint.previousOrder,
            heatmap: toJS(timepoint.heatmap),
            grouped: toJS(timepoint.grouped),
            heatmapOrder: timepoint.heatmapOrder,
            groupOrder: timepoint.groupOrder,
            isGrouped: timepoint.isGrouped,
            primaryVariableId: timepoint.primaryVariableId
        }));
        if (this.undoRedoMode) {
            this.stateStack = this.stateStack.slice(0, this.currentPointer + 1);
            this.undoRedoMode = false;
        }
        if (this.stateStack.length > 15) {
            this.stateStack.shift();
        }
        this.stateStack.push(serializeState(this));
        this.currentPointer = this.stateStack.length - 1;
        //localStorage.setItem(this.rootStore.study.studyId, JSON.stringify({states: this.stateStack, logs: this.logs}));
    }

    /**
     * saves the history of a timepoint (in logs and in stateStack)
     * @param operation
     * @param variableId
     * @param timepointType
     * @param timepointIndex
     */
    saveTimepointHistory(operation, variableId, timepointType, timepointIndex) {
        const variableName = this.rootStore.timepointStore.timepointStores[timepointType].variableStore.getById(variableId).name;
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
    saveVariableHistory(operation, variable, saveToStack) {
        this.logs.push(operation + ": " + variable);
        this.saveHistory();
    }

    saveVariableModification(type, variable, saveToStack) {
        if (saveToStack) {
            this.logs.push("MODIFY VARIABLE: " + variable + ", Type: " + type);
            this.saveHistory();
        }
        else {
            this.logs.push("(MODIFY VARIABLE: " + variable + ", Type: " + type + ")");
        }
    }

    saveSwitchHistory(globalTL) {
        if (globalTL) {
            this.logs.push("SWITCH TO: global timeline");
        }
        else {
            this.logs.push("SWITCH TO: block view");
        }
        this.saveHistory();
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

    saveTPMovement(dir, patient) {
        this.logs.push("MOVE PATIENT: " + patient + " " + dir);
        this.saveHistory();
    }


}


export default UndoRedoStore