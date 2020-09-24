import { action, extendObservable, observe } from 'mobx';
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
            hasEvent: false, // whether event attributes are included in custom grouping
            stageLabels: {}, // key & label pairs

            /**
             * get the maximum number of currently displayed partitions
             * @returns {number}
             */
            get maxPartitions() {
                let maxPartitions = 0;
                const groupedTP = this.timepoints.filter(d => d.isGrouped);
                if (this.rootStore.uiStore.globalTime==='block') {
                    maxPartitions = Math.max(...groupedTP.map(d => d.grouped.length), 0);    
                }else{
                    maxPartitions = Math.max(...groupedTP.map(d => d.customGrouped.length), 0);    
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
            get sampleOn() {
                return this.variableStores.sample.currentVariables.length > 0;
            },
            get points() {
                let samplePoints = this.variableStores.sample.points,
                    eventPoints = this.variableStores.between.points
                if (this.hasEvent === false || eventPoints.length===0) {
                    return samplePoints
                } else {

                    return this.variableStores.sample.points.map((p, i) => {
                        let newPoint = { ...p }
                        newPoint.value = newPoint.value.concat(eventPoints[i].value)

                        return newPoint
                    })
                }
            },
            get colorScales() {
                let sampleScales = this.variableStores.sample.fullCurrentVariables.map(d => d.colorScale),
                    eventScales = this.variableStores.between.fullCurrentVariables.map(d => d.colorScale)

                if (this.hasEvent === false) {
                    return sampleScales
                } else {
                    return sampleScales.concat(eventScales)
                }
            },
            get currentVariables() {
                if (this.hasEvent === false) {
                    return this.variableStores.sample.currentVariables
                } else {
                    return this.variableStores.sample.currentVariables.concat(
                        this.variableStores.between.currentVariables
                    )
                }
            },
            get referencedVariables() {
                if (this.hasEvent === false) {
                    return this.variableStores.sample.referencedVariables
                } else {
                    return {
                        ...this.variableStores.sample.referencedVariables,
                        ...this.variableStores.between.referencedVariables
                    }
                }
            },
            toggleHasEvent: action(() => {
                this.hasEvent = !this.hasEvent
            }),
            setStageLabel: action((stageKey, stageLabel) => {
                this.stageLabels[stageKey] = stageLabel
            }),
            resetStageLabel: action(() => {
                this.stageLabels = {}
            }),

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
            combineTimepoints: action((sampleOn, transitionOn) => {
                const betweenTimepoints = this.variableStores.between.childStore.timepoints;
                const sampleTimepoints = this.variableStores.sample.childStore.timepoints;
                let timepoints = [];
                if (!transitionOn) {
                    timepoints = sampleTimepoints;
                } else {
                    if (sampleOn) {
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
                    else {
                        timepoints = betweenTimepoints;
                    }
                }
                timepoints.forEach((timepoint, i) => {
                    timepoints[i].globalIndex = i;
                    // default grouped
                    let variableId = this.variableStores[timepoint.type].currentVariables[0]
                    timepoints[i].setPrimaryVariable(variableId)
                    // timepoints[i].setIsGrouped(true)
                });
                this.timepoints.replace(timepoints);
            }),

            /**
             * initializes the datastructures
             */
            initialize: action(() => {
                this.numberOfPatients = this.rootStore.patients.length;
                this.variableStores.sample.resetVariables();
                this.variableStores.sample.update(this.rootStore.timepointStructure,
                    this.rootStore.patients);
                this.variableStores.between.resetVariables();
                this.variableStores.between.update(this.rootStore.eventBlockStructure,
                    this.rootStore.patients);
                this.combineTimepoints(true, false);
                this.rootStore.visStore.resetTransitionSpaces();
            }),

            /**
             * updates timepoints after structures are changed
             * @param {string[]} order - order of patients
             */
            update: action((order) => {
                this.variableStores.sample.update(this.rootStore.timepointStructure, order);
                this.variableStores.between.update(this.rootStore.eventBlockStructure, order);
                this.combineTimepoints(this.sampleOn, this.transitionOn);
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
            recombine: action(() => {
                const sampleOn = this.variableStores.sample.currentVariables.length > 0;
                const transOn = this.variableStores.between.currentVariables.length > 0;
                this.combineTimepoints(sampleOn, transOn);
                if (transOn) {
                    this.rootStore.uiStore.setRealTime(false);
                }
                if (sampleOn || transOn) {
                    this.rootStore.visStore.resetTransitionSpaces();
                }
            })
        });
        // combines/uncombines timepoints if variables of type "between" are displayed/removed
        observe(this.variableStores.between.currentVariables, () => {
            this.recombine();
        });
        // combines/uncombines timepoints if variables of type "sample" are displayed/removed
        observe(this.variableStores.sample.currentVariables, () => {
            this.recombine();
        })
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


    applyCustomStages(timeStages, eventStages) {
        let sampleTimepoints = this.variableStores.sample.childStore.timepoints,
            eventTimepoints = this.variableStores.between.childStore.timepoints

        sampleTimepoints.forEach((TP, i) => {
            TP.applyCustomStage(timeStages[i].partitions)
        })

        eventTimepoints.forEach((TP, i) => {
            TP.applyCustomStage(eventStages[i].partitions)
        })

    }

    removeVariable(variableID){
        let sampleVariables = this.variableStores.sample.currentVariables
        if (sampleVariables.includes(variableID)){
            this.variableStores['sample'].removeVariable(variableID);
        }else{
            this.variableStores['between'].removeVariable(variableID);
        }
        // currentVariables() {
        //     if (this.hasEvent === false) {
        //         return this.variableStores.sample.currentVariables
        //     } else {
        //         return this.variableStores.sample.currentVariables.concat(
        //             this.variableStores.between.currentVariables
        //         )
        //     }
        // }
    }
}


export default DataStore;
