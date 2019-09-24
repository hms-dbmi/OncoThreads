import { action, createTransformer, extendObservable, toJS } from 'mobx';
import OriginalVariable from './TemporalHeatmap/stores/OriginalVariable';
import DerivedVariable from './TemporalHeatmap/stores/DerivedVariable';

/**
 * handles undoing/redoing actions
 * Principle:
 * save datastructures which describe the state to a stack
 * (variables, timepoints, timepointStructure, uiStore parameters)
 * observable datastructures have to be serialized to be saved.
 * When undoing/redoing saved data structures have to be mapped
 * back to observable data structures (deserializing)
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
                    this.logs.push(`UNDO: ${this.logs[this.currentPointer]}`);
                    this.deserialize(this.currentPointer - 1);
                    this.currentPointer -= 1;
                    // localStorage.setItem(this.rootStore.study.studyId,
                    // JSON.stringify(this.stateStack[this.currentPointer].state));
                    this.undoRedoMode = true;
                }
            }),

            /**
             * redo the undone action, add redo log
             */
            redo: action(() => {
                if (this.currentPointer !== this.stateStack.length - 1) {
                    this.logs.push(`REDO: ${this.logs[this.currentPointer + 1]}`);
                    this.deserialize(this.currentPointer + 1);
                    this.currentPointer += 1;
                    // localStorage.setItem(this.rootStore.study.studyId,
                    // JSON.stringify(this.stateStack[this.currentPointer].state));
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
            saveLoadHistory: action((studyName) => {
                this.logs.push(`LOAD STUDY: ${studyName}`);
                this.saveHistory('load');
            }),
            /**
             * saves the history of a timepoint (in logs and in stateStack)
             * @param {string} operation
             * @param {string} variableId
             * @param {string} timepointType
             * @param {number} timepointIndex
             */
            saveTimepointHistory: action((operation, variableId, timepointType, timepointIndex) => {
                const variableName = this.rootStore.dataStore.variableStores[timepointType]
                    .getById(variableId).name;
                let type = 'Timepoint';
                if (timepointType === 'between') {
                    type = 'Transition';
                }
                this.logs.push(`${operation}: ${variableName} at ${type} ${timepointIndex}`);
                this.saveHistory('timepoint');
            }),

            /**
             * saves the history of a variale (in logs and in stateStack)
             * @param {string} operation
             * @param {string} variable
             */
            saveVariableHistory: action((operation, variable) => {
                this.logs.push(`${operation}: ${variable}`);
                this.saveHistory('variable');
            }),

            /**
             * Saves when the view has been switched
             * @param {boolean} globalTL
             */
            saveSwitchHistory: action((globalTL) => {
                if (globalTL) {
                    this.logs.push('SWITCH TO: global timeline');
                } else {
                    this.logs.push('SWITCH TO: block view');
                }
                this.saveHistory('switch');
            }),
            /**
             * Saves when realTime has been turned on/off
             * @param {boolean} realTime
             */
            saveRealTimeHistory: action((realTime) => {
                if (realTime) {
                    this.logs.push('REAL TIME TURNED ON');
                } else {
                    this.logs.push('REAL TIME TURNED OFF');
                }
                this.saveHistory('real time');
            }),

            /**
             * saves actions happening in the timeline view
             * @param {string} actionType
             */
            saveGlobalHistory: action((actionType) => {
                this.logs.push(`${actionType}: in timeline view`);
                this.saveHistory('timeline');
            }),

            /**
             * saves realigning to the history
             * @param {string} timepointType
             * @param {number} timepointIndex
             */
            saveRealignToHistory: action((timepointIndex) => {
                this.logs.push(`REALIGN PATIENTS: based on block${timepointIndex}`);
                this.saveHistory('timepoint');
            }),

            /**
             * saves moving patients up/down
             * @param {string} direction
             * @param {string} patient
             */
            saveTPMovement: action((direction, patient) => {
                this.logs.push(`MOVE PATIENT: ${patient} ${direction}`);
                this.saveHistory('structure');
            }),
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
        this.rootStore.timepointStructure.replace(this.stateStack[index].state.timepointStructure);
        this.rootStore.dataStore.update(this.rootStore.dataStore.variableStores
            .sample.childStore.timepoints[0].heatmapOrder);

        this.deserializeTimepoints(index);
        this.rootStore.visStore.transitionSpaces
            .replace(this.stateStack[index].state.transitionSpaces);
        this.uiStore.globalTime = this.stateStack[index].state.globalTime;
        this.uiStore.realTime = this.stateStack[index].state.realTime;
    }

    /**
     * deserialize variable related data
     * @param {number} index
     */
    deserializeVariables(index) {
        this.rootStore.dataStore.variableStores.sample.replaceVariables(
            UndoRedoStore.deserializeReferencedVariables(this.stateStack[index].state.allSampleVar),
            this.stateStack[index].state.currentSampleVar,
        );
        this.rootStore.dataStore.variableStores.between.replaceVariables(
            UndoRedoStore.deserializeReferencedVariables(this.stateStack[index]
                .state.allBetweenVar),
            this.stateStack[index].state.currentBetweenVar,
        );
        this.rootStore.dataStore.globalPrimary = this.stateStack[index].state.globalPrimary;
    }

    /**
     * deserialized the state saved in local storage
     */
    deserializeLocalStorage() {
        this.stateStack = [{
            state: JSON.parse(localStorage
                .getItem(this.rootStore.study.studyId)),
        }];
        this.currentPointer = this.stateStack.length - 1;
        this.deserialize(this.currentPointer);
    }


    /**
     * updates observed variables to the state of saved variables.
     * If necessary, new variables are added
     * (if saved contains a variable not contained in observed)
     * @param {{}} savedVariables
     * @returns {*[]}
     */
    static deserializeReferencedVariables(savedVariables) {
        const returnVariables = {};
        Object.keys(savedVariables).forEach((variableId) => {
            if (!savedVariables[variableId].derived) {
                returnVariables[variableId] = new OriginalVariable(
                    savedVariables[variableId].id,
                    savedVariables[variableId].name,
                    savedVariables[variableId].datatype,
                    savedVariables[variableId].description,
                    savedVariables[variableId].range,
                    savedVariables[variableId].domain,
                    savedVariables[variableId].mapper,
                    savedVariables[variableId].profile,
                    savedVariables[variableId].type,
                );
            } else {
                returnVariables[variableId] = new DerivedVariable(
                    savedVariables[variableId].id,
                    savedVariables[variableId].name,
                    savedVariables[variableId].datatype,
                    savedVariables[variableId].description,
                    savedVariables[variableId].originalIds,
                    savedVariables[variableId].modification,
                    savedVariables[variableId].range,
                    savedVariables[variableId].domain,
                    savedVariables[variableId].mapper,
                    savedVariables[variableId].profile,
                    savedVariables[variableId].type,
                );
            }
        });
        return returnVariables;
    }


    /**
     * deserializes the timepoint data structure
     * @return {SingleTimepoint[]}
     * @param index
     */
    deserializeTimepoints(index) {
        this.stateStack[index].state.sampleTimepoints.forEach((savedTimepoint, i) => {
            Object.keys(savedTimepoint).forEach((property) => {
                this.rootStore.dataStore.variableStores
                    .sample.childStore.timepoints[i][property] = savedTimepoint[property];
            });
        });
        this.stateStack[index].state.betweenTimepoints.forEach((savedTimepoint, i) => {
            Object.keys(savedTimepoint).forEach((property) => {
                this.rootStore.dataStore.variableStores
                    .between.childStore.timepoints[i][property] = savedTimepoint[property];
            });
        });
    }


    /**
     * saves the history to the stateStack.
     * For this the datastructures have to be serialized (put into a simple, non-observable object)
     * @param {string} type - type of history entry
     */
    saveHistory(type) {
        const serializeTimepoints = createTransformer(timepoint => ({
            name: timepoint.name,
            heatmapOrder: timepoint.heatmapOrder.slice(),
            groupSortDir: timepoint.groupSortDir,
            isGrouped: timepoint.isGrouped,
            heatmapSorting: toJS(timepoint.heatmapSorting),
            primaryVariableId: timepoint.primaryVariableId,
        }));
        const serializeState = createTransformer(store => (
            {
                sampleTimepoints: store.rootStore.dataStore.variableStores
                    .sample.childStore.timepoints.map(serializeTimepoints),
                betweenTimepoints: store.rootStore.dataStore.variableStores
                    .between.childStore.timepoints.map(serializeTimepoints),
                currentSampleVar: store.rootStore.dataStore.variableStores
                    .sample.currentVariables.slice(),
                currentBetweenVar: store.rootStore.dataStore.variableStores
                    .between.currentVariables.slice(),
                allSampleVar: UndoRedoStore
                    .serializeVariables(store.rootStore.dataStore.variableStores
                        .sample.referencedVariables),
                allBetweenVar: UndoRedoStore
                    .serializeVariables(store.rootStore.dataStore.variableStores
                        .between.referencedVariables),
                globalTime: store.uiStore.globalTime,
                realTime: store.uiStore.realTime,
                globalPrimary: store.rootStore.dataStore.globalPrimary,
                timepointStructure: toJS(store.rootStore.timepointStructure),
                transitionSpaces: toJS(store.rootStore.visStore.transitionSpaces),
            }
        ));
        // delete the top of the stack if we switch
        // from undoRedoMode to the normal saving of the state

        if (this.undoRedoMode) {
            this.stateStack = this.stateStack.slice(0, this.currentPointer + 1);
            this.undoRedoMode = false;
        }
        if (this.stateStack.length > 15) {
            this.stateStack.shift();
        }
        this.stateStack.push({ type, state: serializeState(this) });
        this.currentPointer = this.stateStack.length - 1;
        // storage.setItem(
        // this.rootStore.study.studyId,
        // JSON.stringify(this.stateStack[this.stateStack.length - 1].state),
        // );
    }

    /**
     * makes an observable non-observable by transforming each attribute
     * @param {{}} observable
     * @return {Object[]} serialized version of observable object
     */
    static serializeAttributes(observable) {
        const returnDict = {};
        Object.keys(observable).forEach((attribute) => {
            returnDict[attribute] = toJS(observable[attribute]);
        });
        return returnDict;
    }

    /**
     * creates a serialized version of each variable
     * @param {{}} variables
     */
    static serializeVariables(variables) {
        const serializedVariables = {};
        Object.keys(variables).forEach((variableId) => {
            serializedVariables[variableId] = UndoRedoStore
                .serializeAttributes(variables[variableId]);
        });
        return serializedVariables;
    }
}


export default UndoRedoStore;
