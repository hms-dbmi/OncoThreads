import { action, extendObservable, observe } from 'mobx';
import VariableStore from './VariableStore';
import { PCA } from 'ml-pca';
import { getUniqueKeyName, prefixSpan, clusterfck  } from 'modules/TemporalHeatmap/UtilityClasses/'

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
            stateLabels: {}, // key & label pairs
            pointGroups: {}, // the group of this.points: pointIdx[][]
            pointClusterTHR: 0.08, // the initial threshold to group points

            /**
             * get the maximum number of currently displayed partitions
             * @returns {number}
             */
            get maxPartitions() {
                let maxPartitions = 0;
                const groupedTP = this.timepoints.filter(d => d.isGrouped);
                if (this.rootStore.uiStore.globalTime === 'block') {
                    maxPartitions = Math.max(...groupedTP.map(d => d.grouped.length), 0);
                } else {
                    maxPartitions = Math.max(...groupedTP.map(d => d.customGrouped.length), 0);
                }
                return maxPartitions;

            },
            get maxTPPartitions() {
                let maxPartitions = 0;
                const groupedTP = this.timepoints.filter(d => d.isGrouped).filter(d=>d.type=="sample");
                if (this.rootStore.uiStore.globalTime === 'block') {
                    maxPartitions = Math.max(...groupedTP.map(d => d.grouped.length), 0);
                } else {
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
                if (this.hasEvent === false || eventPoints.length === 0) {
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
            // return number[][]
            get normValues() {
                let { points, referencedVariables, currentVariables } = this
                if (points.length === 0) return []
                let normValues = points.map(point => {
                    let normValue = point.value.map((value, i) => {
                        let ref = referencedVariables[currentVariables[i]]
                        if (value === undefined) {
                            return 0
                        } else if (typeof (value) == "number") {
                            let domain = ref.domain
                            return (value - domain[0]) / (domain[1] - domain[0])
                        } else if (ref.domain.length === 1) {
                            return 0
                        } else {
                            let domain = ref.domain
                            return domain.findIndex((d) => d === value) / (domain.length - 1)
                        }
                    })
                    return normValue
                })
                return normValues
            },

            // normalize points to [0,1]
            get normPoints() {
                let { normValues } = this
                if (normValues.length == 0) return []
                let pca = new PCA(normValues)
                let norm2dValues = []

                if (this.normValues[0].length > 2) {
                    // only calculate pca when dimension is larger than 2
                    norm2dValues = pca.predict(normValues, { nComponents: 2 }).to2DArray()
                    // console.info('pca points', newPoints)            
                } else {
                    norm2dValues = normValues
                }


                var normPoints = normValues.map((d, i) => {
                    return {
                        ...this.points[i],
                        normValue: d,
                        pos: norm2dValues[i]
                    }
                })

                return normPoints
            },

            // the importance score of each feature
            get importanceScores() {
                if (this.normValues.length == 0 || this.normValues[0].length <= 1) return []
                let { currentVariables } = this
                let pca = new PCA(this.normValues)
                let egiVector = pca.getEigenvectors()
                let importanceScores = egiVector.getColumn(0).map((d, i) => Math.abs(d) + Math.abs(egiVector.getColumn(1)[i]))
                return importanceScores.map((score, i) => {
                    return {
                        name: currentVariables[i],
                        score
                    }
                })
            },

            get patientStates (){
                let {points, pointGroups} = this
                let patients = {}
                
                points.sort((a,b)=>a.timeIdx-b.timeIdx)
                points.forEach(point=>{
                    let {idx, patient, timeIdx} = point
                    let stateKey = Object.values(pointGroups).find(pointGroup=>pointGroup.pointIdx.includes(idx)).stateKey
                    // if (!patients[patient]){
                    //     patients[patient] = [...new Array(maxTimeIdx+1).keys()].map(d=>'')
                    // }
                    // patients[patient][timeIdx] = stateKey
                    if (!patients[patient]){
                        patients[patient] = []
                    }
                    if(patients[patient].length!=timeIdx) console.info('something wrong')
                    patients[patient].push(stateKey)

                })
                
                return patients
            },
            get maxTime(){
                let {points} = this
                let maxTimeIdx = Math.max(...points.map(d=>d.timeIdx))
                return maxTimeIdx + 1
            },

            get frequentPatterns (){
                let {patientStates} = this
                // const minSupport =2, minLen = 2

                let sequences = Object.values(patientStates)
                let patients = Object.keys(patientStates)
                let results = prefixSpan.frequentPatterns(sequences)

                return results
            },

            changeClusterTHR: action((thr)=>{
                this.pointClusterTHR = thr
                this.autoGroup()
                this.applyCustomGroups()
            }),

            toggleHasEvent: action(() => {
                this.hasEvent = !this.hasEvent
            }),
            setStateLabel: action((stateKey, stateLabel) => {
                this.stateLabels[stateKey] = stateLabel
            }),
            resetStateLabel: action(() => {
                this.stateLabels = {}
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
            }),
            autoGroup: action(() => {
                let normPoints = this.normPoints
                if (normPoints.length == 0) return
                let { pointClusterTHR } = this
                var clusters = clusterfck.hcluster(normPoints.map(d => d.pos), "euclidean", "single", pointClusterTHR);
                // console.info(tree)
                let pointGroups = {}
                clusters.forEach((d, i) => {
                    let stateKey = getUniqueKeyName(i, [])
                    pointGroups[stateKey] = {
                        stateKey,
                        pointIdx: d.itemIdx
                    }
                })
                this.pointGroups = pointGroups
            }),

            updatePointGroups: action((pointGroups) => {
                
                this.pointGroups = pointGroups
                this.applyCustomGroups()
            }),

            deletePointGroup: action((stateKey)=>{
                const NONAME ="undefined"
                if (!this.pointGroups[NONAME]){
                    this.pointGroups[NONAME] = {...this.pointGroups[stateKey], stateKey: NONAME}
                    
                }else{
                    let pointIdx1 = this.pointGroups[stateKey].pointIdx, pointIdx2 = this.pointGroups[NONAME].pointIdx
                    this.pointGroups[NONAME] = {
                        pointIdx: pointIdx1.concat(pointIdx2), 
                        stateKey: NONAME
                    }
                }
                delete this.pointGroups[stateKey]
                
                this.applyCustomGroups()
            }), 

            groupPatients: action((groupNum)=>{
                //hierarchically cluster patients based on their sequences in a divisive manner 

            }),

            applyCustomGroups: action(()=>{
                let { points, pointGroups } = this
        
                // check whether has unselected nodes
                let allSelected = Object.values(pointGroups).map(d => d.pointIdx).flat()
                if (allSelected.length < points.length) {
                    let leftNodes = points.map((_, i) => i)
                        .filter(i => !allSelected.includes(i))
        
                    let newStateKey = getUniqueKeyName(Object.keys(pointGroups).length, Object.keys(pointGroups))
        
                    pointGroups[newStateKey] = {
                        stateKey: newStateKey,
                        pointIdx: leftNodes
                    }
                    // message.info('All unselected nodes are grouped as one state')
                }
        
        
        
                let timeStates = []
                let uniqueTimeIds = [...new Set(points.map(p => p.timeIdx))]
        
                uniqueTimeIds.forEach(timeIdx => {
                    timeStates.push({
                        timeIdx,
                        partitions: []
                    })
                })
        
                // push points to corresponding time state
                Object.values(pointGroups).forEach((state) => {
        
                    let stateKey = state.stateKey
        
                    state.pointIdx.forEach(id => {
                        let { patient, timeIdx } = points[id]
                        // get the timestate is stored
                        let timeState = timeStates[timeIdx]
        
                        // check whether the partition in the timestate
                        let partitionIdx = timeState.partitions.map(d => d.partition).indexOf(stateKey)
                        if (partitionIdx > -1) {
        
                            let partition = timeState.partitions[partitionIdx],
                                { points, patients } = partition
                            points.push(id)
                            patients.push(patient)
                        } else {
                            timeState.partitions.push({
                                partition: stateKey,
                                points: [id],
                                rows: [],
                                patients: [patient]
                            })
                        }
                    })
                })
        
                // creat event states
                let eventStates = [timeStates[0]]
                for (let i = 0; i < timeStates.length - 1; i++) {
                    let eventState = { timeIdx: i + 1, partitions: [] }
                    let curr = timeStates[i], next = timeStates[i + 1]
        
        
                    next.partitions.forEach(nextPartition => {
                        let {
                            partition: nextName,
                            patients: nextPatients,
                            points: nextPoints,
                        } = nextPartition
        
                        curr.partitions.forEach((currPartition) => {
                            let {
                                partition: currName,
                                patients: currPatients,
                                points: currPoints
                            } = currPartition
        
                            let intersection = currPatients.filter(d => nextPatients.includes(d))
                            if (intersection.length > 0) {
                                eventState.partitions.push({
                                    partition: `${currName}-${nextName}`,
                                    patients: intersection,
                                    points: nextPoints.map(id => points[id])
                                        .filter(p => intersection.includes(p.patient))
                                        .map(p => p.idx),
                                    rows: []
                                }
                                )
                            }
                        })
                    })
                    eventStates.push(eventState)
        
                }
                eventStates.push(
                    {
                        ...timeStates[timeStates.length - 1],
                        timeIdx: timeStates.length
                    }
                )
        
                let sampleTimepoints = this.variableStores.sample.childStore.timepoints,
                    eventTimepoints = this.variableStores.between.childStore.timepoints
        
                sampleTimepoints.forEach((TP, i) => {
                    TP.applyCustomState(timeStates[i].partitions)
                })
        
                eventTimepoints.forEach((TP, i) => {
                    TP.applyCustomState(eventStates[i].partitions)
                })
        
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

   


    // applyCustomStates(timeStates, eventStates) {
    //     let sampleTimepoints = this.variableStores.sample.childStore.timepoints,
    //         eventTimepoints = this.variableStores.between.childStore.timepoints

    //     sampleTimepoints.forEach((TP, i) => {
    //         TP.applyCustomState(timeStates[i].partitions)
    //     })

    //     eventTimepoints.forEach((TP, i) => {
    //         TP.applyCustomState(eventStates[i].partitions)
    //     })

    // }

    removeVariable(variableID) {
        let sampleVariables = this.variableStores.sample.currentVariables
        if (sampleVariables.includes(variableID)) {
            this.variableStores['sample'].removeVariable(variableID);
        } else {
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
