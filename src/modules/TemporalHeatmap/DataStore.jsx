import {action, extendObservable, reaction} from "mobx";
import VariableStore from "./VariableStore";

/*
stores information about timepoints. Combines betweenTimepoints and sampleTimepoints
 */
class DataStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.numberOfPatients = 300;
        this.variableStores = {
            sample: null,
            between: null
        };
        //this.timepoints = [];
        //this.timelineStore=null;
        extendObservable(this, {
            timepoints: [],
            selectedPatients: [],
            continuousRepresentation: 'gradient',
            globalPrimary: '',
            realTime: false,
            globalTime: false,
            transitionOn: false,
            advancedSelection: true,
            showUndefined: true,
            get maxPartitions() {
                return Math.max(...this.timepoints.filter(d => d.isGrouped).map(d => d.grouped.length));
            },
            setGlobalPrimary: action(function (varId) {
                this.globalPrimary = varId;
            }),
            toggleRealtime: action(function () {
                this.realTime = !this.realTime;
            }),
            setGlobalTime: action(function (boolean) {
                this.globalTime = boolean;
            }),
            /**
             * handles currently selected patients
             * @param patient
             */
            handlePatientSelection: action(function (patient) {
                if (this.selectedPatients.includes(patient)) {
                    this.selectedPatients.remove(patient)
                }
                else {
                    this.selectedPatients.push(patient);
                }
            }),
            /**
             * handles the selection of patients in a partition
             * @param patients
             */
            handlePartitionSelection: action(function (patients) {
                //isContained: true if all patients are contained
                let isContained = true;
                patients.forEach(d => {
                    if (!this.selectedPatients.includes(d)) {
                        isContained = false
                    }
                });
                //If not all patients are contained, add the patients that are not contained to the selected patients
                if (!isContained) {
                    patients.forEach(d => {
                        if (!this.selectedPatients.includes(d)) {
                            this.selectedPatients.push(d);
                        }
                    });
                }
                //If all the patients are already contained, remove them from selected patients
                else {
                    patients.forEach(d => {
                        this.selectedPatients.remove(d);
                    });
                }
            }),
            reset: action(function () {
                this.globalTime = false;
                this.realTime = false;
                this.selectedPatients = [];
                this.transitionOn = false;
            })
        });
        reaction(() => this.transitionOn, isOn => {
            this.timepoints.replace(this.combineTimepoints(isOn));
            //this.rootStore.transitionStore.initializeTransitions(this.timepoints.length - 1);
        });
    }


    setNumberOfPatients(numP) {
        this.numberOfPatients = numP;
    }


    /**
     * initializes the datastructures
     */
    initialize(numPatients) {
        this.numberOfPatients = numPatients;
        this.variableStores = {
            sample: new VariableStore(this.rootStore, this.rootStore.timepointStructure, "sample"),
            between: new VariableStore(this.rootStore, this.rootStore.transitionStructure, "between")
        };
        //this.timelineStore=new TimelineStore(this.rootStore,this.rootStore.sampleStructure,this.rootStore.sampleTimelineMap,this.rootStore.survivalData);
        this.timepoints.replace(this.combineTimepoints(false));
    }


    update(order) {
        this.variableStores.sample.update(this.rootStore.timepointStructure, order);
        this.variableStores.between.update(this.rootStore.transitionStructure, order);
        this.combineTimepoints(this.transitionOn);

    }

    /*
    updateTimeline(type){
        if(type==="sample"){
            this.timelineStore.changeSampleTimelineData(this.globalPrimary)
        }
        else{
            this.timelineStore.changeEventTimelineData(this.variableStores.between.currentVariables)
        }
    }
    */

    //action
    combineTimepoints(isOn) {
        let betweenTimepoints = this.variableStores.between.childStore.timepoints.slice();
        let sampleTimepoints = this.variableStores.sample.childStore.timepoints.slice();
        let timepoints = [];
        if (!isOn) {
            timepoints = sampleTimepoints;
        }
        else {
            for (let i = 0; i < sampleTimepoints.length; i++) {
                timepoints.push(betweenTimepoints[i]);
                betweenTimepoints[i].heatmapOrder = sampleTimepoints[i].heatmapOrder;
                timepoints.push(sampleTimepoints[i]);
            }
            betweenTimepoints[betweenTimepoints.length - 1].heatmapOrder = sampleTimepoints[sampleTimepoints.length - 1].heatmapOrder;
            timepoints.push(betweenTimepoints[betweenTimepoints.length - 1]);

        }
        timepoints.forEach((d, i) => d.globalIndex = i);
        return timepoints;

    }

    /**
     * gets all values of a variable, indepently of their timepoint
     * @param mapper
     * @param type
     * @returns {Array}
     */
    getAllValues(mapper, type) {
        let allValues = [];
        let structure = type === "sample" ? this.rootStore.timepointStructure : this.rootStore.transitionStructure;
        structure.forEach(d => d.forEach(f => allValues.push(mapper[f.sample])));
        return allValues;
    }

    /**
     * applies the patient order of the current timepoint to all the other timepoints
     * @param timepointIndex
     * @param saveRealign
     */
    applyPatientOrderToAll(timepointIndex, saveRealign) {
        let sorting = this.timepoints[timepointIndex].heatmapOrder;
        this.timepoints.forEach(function (d) {
            d.heatmapOrder = sorting;
        });
        if (saveRealign) {
            this.rootStore.undoRedoStore.saveRealignToHistory(this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)
        }
        //this.rootStore.visStore.resetTransitionSpace();
    }


}


export default DataStore;