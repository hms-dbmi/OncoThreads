import {createTransformer, extendObservable, toJS} from "mobx";
import OriginalVariable from "./OriginalVariable";
import EventVariable from "./EventVariable";
import DerivedVariable from "./DerivedVariable";

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
            //localStorage.setItem(this.rootStore.study.studyId, JSON.stringify(this.stateStack[this.currentPointer].state));
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
            //localStorage.setItem(this.rootStore.study.studyId, JSON.stringify(this.stateStack[this.currentPointer].state));
            this.undoRedoMode = true;
        }


    }


    deserialize(index) {
        this.rootStore.timepointStore.variableStores.sample.referencedVariables = UndoRedoStore.deserializeReferencedVariables(this.rootStore.timepointStore.variableStores.sample.referencedVariables, this.stateStack[index].state.allSampleVar);
        this.rootStore.timepointStore.variableStores.between.referencedVariables = UndoRedoStore.deserializeReferencedVariables(this.rootStore.timepointStore.variableStores.between.referencedVariables, this.stateStack[index].state.allBetweenVar);
        this.rootStore.timepointStore.variableStores.sample.currentVariables.replace(this.stateStack[index].state.currentSampleVar);
        this.rootStore.timepointStore.variableStores.between.currentVariables.replace(this.stateStack[index].state.currentBetweenVar);
        this.rootStore.timepointStore.transitionOn = this.stateStack[index].state.transitionOn;
        this.rootStore.eventTimelineMap = this.stateStack[index].state.eventTimelineMap;
        this.rootStore.timepointStructure = this.deserializeTPStructure(this.rootStore.timepointStructure, this.stateStack[index].state.timepointStructure);
        this.rootStore.timepointStore.variableStores.sample.childStore.timepoints = this.deserializeTimepoints(this.rootStore.timepointStore.variableStores.sample.childStore.timepoints.slice(), this.stateStack[index].state.sampleTimepoints);
        this.rootStore.timepointStore.variableStores.between.childStore.timepoints = this.deserializeTimepoints(this.rootStore.timepointStore.variableStores.between.childStore.timepoints.slice(), this.stateStack[index].state.betweenTimepoints);
        this.rootStore.timepointStore.globalTime = this.stateStack[index].state.globalTime;
        this.rootStore.timepointStore.globalPrimary = this.stateStack[index].state.globalPrimary;
        this.rootStore.timepointStore.regroupTimepoints();
    }

    /**
     * deserialized the state saved in local storage
     */
    deserializeLocalStorage() {
        this.stateStack = [{state: JSON.parse(localStorage.getItem(this.rootStore.study.studyId))}];
        this.currentPointer = this.stateStack.length - 1;
        this.deserialize(this.currentPointer);
    }

    /**
     * writes saved attributes to observable datastructure
     * @param observable
     * @param saved
     * @returns {*}
     */
    static deserializeVariables(observable, saved) {
        observable.replace(saved);
        return observable;
    }

    /**
     * updates observed variables to the state of saved variables. If necessary, new variables are added (if saved contains a variable not contained in observed)
     * @param observedVariables
     * @param savedVariables
     * @returns {*}
     */
    static deserializeReferencedVariables(observedVariables, savedVariables) {
        for (let variable in savedVariables) {
            if (variable in observedVariables) {
                UndoRedoStore.remapProperties(observedVariables[variable], savedVariables[variable]);
            }
            else if (!(variable in observedVariables)) {
                switch (savedVariables[variable].type) {
                    case "original":
                        observedVariables[variable] = new OriginalVariable(savedVariables[variable].id, savedVariables[variable].name, savedVariables[variable].datatype, savedVariables[variable].description, savedVariables[variable].range, savedVariables[variable].domain, savedVariables[variable].mapper, savedVariables[variable].profile);
                        break;
                    case "event":
                        observedVariables[variable] = new EventVariable(savedVariables[variable].id, savedVariables[variable].name, savedVariables[variable].datatype, savedVariables[variable].eventType, savedVariables[variable].eventSubType, savedVariables[variable].mapper);
                        break;
                    default:
                        observedVariables[variable] = new DerivedVariable(savedVariables[variable].id, savedVariables[variable].name, savedVariables[variable].datatype, savedVariables[variable].description, savedVariables[variable].originalIds, savedVariables[variable].modificationType, savedVariables[variable].modification, savedVariables[variable].range, savedVariables[variable].domain, savedVariables[variable].mapper, savedVariables[variable].profile)
                }
            }
        }
        return observedVariables;
    }

    /**
     * deserializes the timepoint data structure
     * @param observable
     * @param saved
     */
    deserializeTimepoints(observable, saved) {
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
    saveHistory(type) {
        const serializeState = createTransformer(store => ({
            sampleTimepoints: store.rootStore.timepointStore.variableStores.sample.childStore.timepoints.map(serializeTimepoints),
            betweenTimepoints: store.rootStore.timepointStore.variableStores.between.childStore.timepoints.map(serializeTimepoints),
            currentSampleVar: store.rootStore.timepointStore.variableStores.sample.currentVariables.slice(),
            currentBetweenVar: store.rootStore.timepointStore.variableStores.between.currentVariables.slice(),
            allSampleVar: UndoRedoStore.serializeVariables(store.rootStore.timepointStore.variableStores.sample.referencedVariables),
            allBetweenVar: UndoRedoStore.serializeVariables(store.rootStore.timepointStore.variableStores.between.referencedVariables),
            transitionOn: store.rootStore.timepointStore.transitionOn,
            globalTime: store.rootStore.timepointStore.globalTime,
            globalPrimary: store.rootStore.timepointStore.globalPrimary,
            timepointStructure: toJS(store.rootStore.timepointStructure),
            eventTimelineMap: toJS(store.rootStore.eventTimelineMap)
        }));
        //delete the top of the stack if we switch from undoRedoMode to the normal saving of the state
        const serializeTimepoints = createTransformer(timepoint => ({
                heatmapOrder: timepoint.heatmapOrder,
                groupOrder: timepoint.groupOrder,
                isGrouped: timepoint.isGrouped,
                heatmapSorting: timepoint.heatmapSorting,
                primaryVariableId: timepoint.primaryVariableId,
            })
        );
        if (this.undoRedoMode) {
            this.stateStack = this.stateStack.slice(0, this.currentPointer + 1);
            this.undoRedoMode = false;
        }
        if (this.stateStack.length > 15) {
            this.stateStack.shift();
        }
        this.stateStack.push({type: type, state: serializeState(this)});
        this.currentPointer = this.stateStack.length - 1;
        //storage.setItem(this.rootStore.study.studyId, JSON.stringify(this.stateStack[this.stateStack.length - 1].state));
    }

    /**
     * makes an object non-observable by transforming each attribute
     * @param object
     */
    static serializeAttributes(object) {
        let returnDict = {};
        for (let attribute in object) {
            returnDict[attribute] = toJS(object[attribute]);
        }
        return returnDict;
    }

    /**
     * makes a variable non-observable
     * @param variables
     */
    static serializeVariables(variables) {
        let serializedVariables = {};
        for (let variable in variables) {
            serializedVariables[variable] = UndoRedoStore.serializeAttributes(variables[variable])
        }
        return serializedVariables;
    }

    /**
     * saves the history of a timepoint (in logs and in stateStack)
     * @param operation
     * @param variableId
     * @param timepointType
     * @param timepointIndex
     */
    saveTimepointHistory(operation, variableId, timepointType, timepointIndex) {
        const variableName = this.rootStore.timepointStore.variableStores[timepointType].getById(variableId).name;
        let type = "Timepoint";
        if (timepointType === "between") {
            type = "Transition";
        }
        this.logs.push(operation + ": " + variableName + " at " + type + " " + timepointIndex);
        this.saveHistory("timepoint");
    }

    /**
     * saves the history of a variale (in logs and in stateStack)
     * @param operation
     * @param variable
     * @param saveToStack
     */
    saveVariableHistory(operation, variable, saveToStack) {
        this.logs.push(operation + ": " + variable);
        this.saveHistory("variable");
    }

    /**
     * saves the modification of a variable
     * @param type
     * @param variable
     * @param saveToStack
     */
    saveVariableModification(type, variable, saveToStack) {
        if (saveToStack) {
            this.logs.push("MODIFY VARIABLE: " + variable + ", Type: " + type);
            this.saveHistory("variable");
        }
        else {
            this.logs.push("(MODIFY VARIABLE: " + variable + ", Type: " + type + ")");
        }
    }

    /**
     * Saves when the view has been switched
     * @param globalTL
     */
    saveSwitchHistory(globalTL) {
        if (globalTL) {
            this.logs.push("SWITCH TO: global timeline");
        }
        else {
            this.logs.push("SWITCH TO: block view");
        }
        this.saveHistory("switch");
    }

    /**
     * saves actions happening in the timeline view
     * @param action
     */
    saveGlobalHistory(action) {
        this.logs.push(action + ": in timeline view");
        this.saveHistory("timeline");
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
        this.saveHistory("timepoint");
    }

    /**
     * saves moving patients up/down
     * @param dir
     * @param patient
     */
    saveTPMovement(dir, patient) {
        this.logs.push("MOVE PATIENT: " + patient + " " + dir);
        this.saveHistory("structure");
    }


}


export default UndoRedoStore