import {action, createTransformer, extendObservable, toJS} from "mobx";
import OriginalVariable from "./TemporalHeatmap/stores/OriginalVariable";
import DerivedVariable from "./TemporalHeatmap/stores/DerivedVariable";

/**
 * handles undoing/redoing actions
 * Principle:
 * save datastructures which describe the state to a stack (variables, timepoints, timepointStructure, uiStore parameters)
 * observable datastructures have to be serialized to be saved
 * when undoing/redoing map saved datastructures back to observable datastructures (deserializing)
 */
class UndoRedoStore {
    constructor(rootStore, uiStore) {
        this.rootStore = rootStore;
        this.uiStore = uiStore;
        this.undoRedoMode = false;
        this.stateStack = []; // array to save states
        extendObservable(this, {
            logs: [], // current logs
            currentPointer: -1, // currently displayed state in stateStack
            /**
             * undo the last action, add undo log
             */
            undo: action(() => {
                if (this.currentPointer !== 0) {
                    this.logs.push("UNDO: " + this.logs[this.currentPointer]);
                    this.deserialize(this.currentPointer - 1);
                    this.currentPointer--;
                    //localStorage.setItem(this.rootStore.study.studyId, JSON.stringify(this.stateStack[this.currentPointer].state));
                    this.undoRedoMode = true;
                }
            }),

            /**
             * redo the undone action, add redo log
             */
            redo: action(() => {
                if (this.currentPointer !== this.stateStack.length - 1) {
                    this.logs.push("REDO: " + this.logs[this.currentPointer + 1]);
                    this.deserialize(this.currentPointer + 1);
                    this.currentPointer++;
                    //localStorage.setItem(this.rootStore.study.studyId, JSON.stringify(this.stateStack[this.currentPointer].state));
                    this.undoRedoMode = true;
                }
            }),
            /**
             * resets undoRedo parameters
             */
            reset: action(() => {
                this.stateStack = [];
                this.logs.clear();
                this.currentPointer = -1;
            }),
            /**
             * saves state when loading a new dataset
             * @param {string} studyName - name of displayed study/dataset
             */
            saveLoadHistory: action(studyName => {
                this.logs.push("LOAD STUDY: " + studyName);
                this.saveHistory("load");
            }),
            /**
             * saves the history of a timepoint (in logs and in stateStack)
             * @param {string} operation
             * @param {string} variableId
             * @param {string} timepointType
             * @param {number} timepointIndex
             */
            saveTimepointHistory: action((operation, variableId, timepointType, timepointIndex) => {
                const variableName = this.rootStore.dataStore.variableStores[timepointType].getById(variableId).name;
                let type = "Timepoint";
                if (timepointType === "between") {
                    type = "Transition";
                }
                this.logs.push(operation + ": " + variableName + " at " + type + " " + timepointIndex);
                this.saveHistory("timepoint");
            }),

            /**
             * saves the history of a variale (in logs and in stateStack)
             * @param {string} operation
             * @param {string} variable
             */
            saveVariableHistory: action((operation, variable) => {
                this.logs.push(operation + ": " + variable);
                this.saveHistory("variable");
            }),

            /**
             * Saves when the view has been switched
             * @param {boolean} globalTL
             */
            saveSwitchHistory: action(globalTL => {
                if (globalTL) {
                    this.logs.push("SWITCH TO: global timeline");
                }
                else {
                    this.logs.push("SWITCH TO: block view");
                }
                this.saveHistory("switch");
            }),
            /**
             * Saves when realTime has been turned on/off
             * @param {boolean} realTime
             */
            saveRealTimeHistory: action(realTime => {
                if (realTime) {
                    this.logs.push("REAL TIME TURNED ON");
                }
                else {
                    this.logs.push("REAL TIME TURNED OFF");
                }
                this.saveHistory("real time");
            }),

            /**
             * saves actions happening in the timeline view
             * @param {string} action
             */
            saveGlobalHistory: action(action => {
                this.logs.push(action + ": in timeline view");
                this.saveHistory("timeline");
            }),

            /**
             * saves realigning to the history
             * @param {string} timepointType
             * @param {number} timepointIndex
             */
            saveRealignToHistory: action((timepointIndex) => {
                this.logs.push("REALIGN PATIENTS: based on block" + timepointIndex);
                this.saveHistory("timepoint");
            }),

            /**
             * saves moving patients up/down
             * @param {string} direction
             * @param {string} patient
             */
            saveTPMovement: action((direction, patient) => {
                this.logs.push("MOVE PATIENT: " + patient + " " + direction);
                this.saveHistory("structure");
            })
        });
        this.undo = this.undo.bind(this);
        this.redo = this.redo.bind(this);
    }


    /**
     * deserializes the state at index
     * @param {number} index
     */
    deserialize(index) {
        this.deserializeVariables(index);
        this.rootStore.timepointStructure = UndoRedoStore.deserializeTPStructure(this.rootStore.timepointStructure, this.stateStack[index].state.timepointStructure);
        this.rootStore.dataStore.update(this.rootStore.dataStore.variableStores.sample.childStore.timepoints[0].heatmapOrder);
        this.rootStore.dataStore.variableStores.sample.childStore.timepoints = UndoRedoStore.deserializeTimepoints(this.rootStore.dataStore.variableStores.sample.childStore.timepoints.slice(), this.stateStack[index].state.sampleTimepoints);
        this.rootStore.dataStore.variableStores.between.childStore.timepoints = UndoRedoStore.deserializeTimepoints(this.rootStore.dataStore.variableStores.between.childStore.timepoints.slice(), this.stateStack[index].state.betweenTimepoints);
        this.uiStore.globalTime = this.stateStack[index].state.globalTime;
        this.uiStore.realTime = this.stateStack[index].state.realTime;
    }

    /**
     * deserialize variable related data
     * @param {number} index
     */
    deserializeVariables(index) {
        this.rootStore.dataStore.variableStores.sample.replaceVariables(UndoRedoStore.deserializeReferencedVariables(this.stateStack[index].state.allSampleVar),
            this.stateStack[index].state.currentSampleVar);
        this.rootStore.dataStore.variableStores.between.replaceVariables(UndoRedoStore.deserializeReferencedVariables(this.stateStack[index].state.allBetweenVar),
            this.stateStack[index].state.currentBetweenVar);
        this.rootStore.eventTimelineMap.replace(this.stateStack[index].state.eventTimelineMap);
        this.rootStore.dataStore.globalPrimary = this.stateStack[index].state.globalPrimary;
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
     * updates observed variables to the state of saved variables. If necessary, new variables are added (if saved contains a variable not contained in observed)
     * @param {{}} savedVariables
     * @returns {*[]}
     */
    static deserializeReferencedVariables(savedVariables) {
        let returnVariables = {};
        for (let variable in savedVariables) {
            if (!savedVariables[variable].derived) {
                returnVariables[variable] = new OriginalVariable(savedVariables[variable].id, savedVariables[variable].name, savedVariables[variable].datatype, savedVariables[variable].description, savedVariables[variable].range, savedVariables[variable].domain, savedVariables[variable].mapper, savedVariables[variable].profile, savedVariables[variable].type);
            }
            else {
                returnVariables[variable] = new DerivedVariable(savedVariables[variable].id, savedVariables[variable].name, savedVariables[variable].datatype, savedVariables[variable].description, savedVariables[variable].originalIds, savedVariables[variable].modification, savedVariables[variable].range, savedVariables[variable].domain, savedVariables[variable].mapper, savedVariables[variable].profile, savedVariables[variable].type)
            }
        }
        return returnVariables;
    }


    /**
     * deserializes the timepoint data structure
     * @param {SingleTimepoint[]} observable
     * @param {Object[]} saved
     * @return {SingleTimepoint[]}
     */
    static deserializeTimepoints(observable, saved) {
        saved.forEach(function (d, i) {
            UndoRedoStore.remapProperties(observable[i], d);
        });
        return observable;
    }

    /**
     *
     * @param {observable[]} observable
     * @param {Object[]} saved
     * @return {Array}
     */
    static deserializeTPStructure(observable, saved) {
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
     * @param {observable} observableEntry
     * @param {Object} savedEntry
     */
    static remapProperties(observableEntry, savedEntry) {
        for (let property in savedEntry) {
            observableEntry[property] = savedEntry[property];
        }
    }


    /**
     * saves the history to the stateStack. For this the datastructures have to be serialized (put into a simple, non-observable object)
     * @param {string} type - type of history entry
     */
    saveHistory(type) {
        const serializeState = createTransformer(store => ({
            sampleTimepoints: store.rootStore.dataStore.variableStores.sample.childStore.timepoints.map(serializeTimepoints),
            betweenTimepoints: store.rootStore.dataStore.variableStores.between.childStore.timepoints.map(serializeTimepoints),
            currentSampleVar: store.rootStore.dataStore.variableStores.sample.currentVariables.slice(),
            currentBetweenVar: store.rootStore.dataStore.variableStores.between.currentVariables.slice(),
            allSampleVar: UndoRedoStore.serializeVariables(store.rootStore.dataStore.variableStores.sample.referencedVariables),
            allBetweenVar: UndoRedoStore.serializeVariables(store.rootStore.dataStore.variableStores.between.referencedVariables),
            globalTime: store.uiStore.globalTime,
            realTime: store.uiStore.realTime,
            globalPrimary: store.rootStore.dataStore.globalPrimary,
            timepointStructure: toJS(store.rootStore.timepointStructure),
            eventTimelineMap: toJS(store.rootStore.eventTimelineMap)
        }));
        //delete the top of the stack if we switch from undoRedoMode to the normal saving of the state
        const serializeTimepoints = createTransformer(timepoint => ({
                name: timepoint.name,
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
     * makes an observable non-observable by transforming each attribute
     * @param {{}} observable
     * @return {Object[]} serialized version of observable object
     */
    static serializeAttributes(observable) {
        let returnDict = {};
        for (let attribute in observable) {
            returnDict[attribute] = toJS(observable[attribute]);
        }
        return returnDict;
    }

    /**
     * creates a serialized version of each variable
     * @param {{}} variables
     */
    static serializeVariables(variables) {
        let serializedVariables = {};
        for (let variable in variables) {
            serializedVariables[variable] = UndoRedoStore.serializeAttributes(variables[variable])
        }
        return serializedVariables;
    }
}


export default UndoRedoStore