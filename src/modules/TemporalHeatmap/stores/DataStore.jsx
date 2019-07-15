import { action, extendObservable, reaction } from 'mobx';
import VariableStore from './VariableStore';

/*
 stores information about timepoints. Combines betweenTimepoints and sampleTimepoints
 */
class DataStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.numberOfPatients = 300; // default number of patients
        this.variableStores = { // one store for the two different type of blocks (sample/between)
            sample: new VariableStore(rootStore, 'sample'),
            between: new VariableStore(rootStore, 'between'),
        };
        extendObservable(this, {
            timepoints: [], // all timepoints
            selectedPatients: [], // currently selected patients
            globalPrimary: '', // global primary for sample timepoints of global timeline
            /**
             * get the maximum number of currently displayed partitions
             * @returns {number}
             */
            get maxPartitions() {
                let maxPartitions = 0;
                const groupedTP = this.timepoints.filter(d => d.isGrouped);
                if (groupedTP.length > 0) {
                    maxPartitions = Math.max(...groupedTP.map(d => d.grouped.length));
                }
                return maxPartitions;
            },
            /**
             * are variables of type "between" displayed
             * @return {boolean}
             */
            get transitionOn() {
                return this.variableStores.between.currentVariables.length > 0;
            },
            /**
             * set global primary
             * @param {string} varId
             */
            setGlobalPrimary: action((varId) => {
                this.globalPrimary = varId;
            }),
            /**
             * changes display realtime
             */
            toggleRealtime: action(() => {
                this.realTime = !this.realTime;
            }),
            /**
             * changes display global timeline
             * @param {boolean} globalTime
             */
            setGlobalTime: action((globalTime) => {
                this.globalTime = globalTime;
            }),
            /**
             * handles selecting/removing a patient
             * @param {string} patient
             */
            handlePatientSelection: action((patient) => {
                if (this.selectedPatients.includes(patient)) {
                    this.selectedPatients.remove(patient);
                } else {
                    this.selectedPatients.push(patient);
                }
            }),
            /**
             * handles the selection of patients in a partition
             * @param {string[]} patients
             */
            handlePartitionSelection: action((patients) => {
                // isContained: true if all patients are contained
                let isContained = true;
                patients.forEach((d) => {
                    if (!this.selectedPatients.includes(d)) {
                        isContained = false;
                    }
                });
                // If not all patients are contained, add the patients
                // that are not contained to the selected patients
                if (!isContained) {
                    patients.forEach((d) => {
                        if (!this.selectedPatients.includes(d)) {
                            this.selectedPatients.push(d);
                        }
                    });
                    // If all the patients are already contained, remove them from selected patients
                } else {
                    patients.forEach((d) => {
                        this.selectedPatients.remove(d);
                    });
                }
            }),
            /**
             * resets selected patients
             */
            resetSelection: action(() => {
                this.selectedPatients.clear();
            }),
            /**
             * resets variables
             */
            reset: action(() => {
                this.globalTime = false;
                this.realTime = false;
                this.selectedPatients = [];
            }),
            /**
             * combines the two sets of timepoints (samples, events)
             * @param {boolean} isOn - between variables contained/not contained
             */
            combineTimepoints: action((isOn) => {
                const betweenTimepoints = this.variableStores.between.childStore.timepoints;
                const sampleTimepoints = this.variableStores.sample.childStore.timepoints;
                let timepoints = [];
                if (!isOn) {
                    timepoints = sampleTimepoints;
                } else {
                    for (let i = 0; i < sampleTimepoints.length; i += 1) {
                        timepoints.push(betweenTimepoints[i]);
                        betweenTimepoints[i].setHeatmapOrder(sampleTimepoints[i].heatmapOrder);
                        timepoints.push(sampleTimepoints[i]);
                    }
                    betweenTimepoints[betweenTimepoints.length - 1]
                        .setHeatmapOrder(sampleTimepoints[sampleTimepoints.length - 1]
                            .heatmapOrder);
                    timepoints.push(betweenTimepoints[betweenTimepoints.length - 1]);
                }
                timepoints.forEach((d, i) => {
                    timepoints[i].globalIndex = i;
                });
                this.timepoints.replace(timepoints);
                this.rootStore.visStore.fitToScreenHeight();
            }),

            /**
             * initializes the datastructures
             */
            initialize: action(() => {
                this.numberOfPatients = this.rootStore.patients.length;
                this.variableStores.sample.resetVariables();
                this.variableStores.sample.resetVariables();
                this.variableStores.sample.update(this.rootStore.timepointStructure,
                    this.rootStore.patients);
                this.variableStores.between.update(this.rootStore.eventBlockStructure,
                    this.rootStore.patients);
                this.combineTimepoints(false);
            }),

            /**
             * updates timepoints after structures are changed
             * @param {string[]} order - order of patients
             */
            update: action((order) => {
                this.variableStores.sample.update(this.rootStore.timepointStructure, order);
                this.variableStores.between.update(this.rootStore.eventBlockStructure, order);
                this.combineTimepoints(this.transitionOn);
            }),
            /**
             * applies the patient order of the current timepoint to all the other timepoints
             * @param {number} timepointIndex
             */
            applyPatientOrderToAll: action((timepointIndex) => {
                if (this.timepoints[timepointIndex].isGrouped) {
                    this.timepoints[timepointIndex].sortHeatmapLikeGroup();
                }
                const sorting = this.timepoints[timepointIndex].heatmapOrder;
                this.timepoints.forEach((d) => {
                    d.setHeatmapOrder(sorting);
                });
            }),
        });
        // combines/uncombines timepoints if variables of type "between" are displayed/removed
        reaction(() => this.transitionOn, (isOn) => {
            this.combineTimepoints(isOn);
        });
    }

    /**
     * sets number of patients
     * @param {number} numP
     */
    setNumberOfPatients(numP) {
        this.numberOfPatients = numP;
    }

    /**
     * get number of partitions of a timepoint
     * @param {number} index - timepoint index
     * @return {number}
     */
    getNumTPPartitions(index) {
        if (this.timepoints[index].isGrouped) {
            return this.timepoints[index].grouped.length;
        }
        return 0;
    }

    /**
     * get the number of patients in a timepoint
     * @param {number} index -  timepoint index
     * @return {number}
     */
    getNumTPPatients(index) {
        return this.timepoints[index].patients.length;
    }

    /**
     * gets all values of a variable, indepently of their timepoint
     * @param {Object} mapper
     * @param {string} type - "sample" or "between"
     * @returns {Array}
     */
    getAllValues(mapper, type) {
        const allValues = [];
        const structure = type === 'sample' ? this.rootStore.timepointStructure : this.rootStore.eventBlockStructure;
        structure.forEach(d => d.forEach(f => allValues.push(mapper[f.sample])));
        return allValues;
    }
}


export default DataStore;
