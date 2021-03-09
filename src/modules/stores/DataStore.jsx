import { action, extendObservable, observe, toJS } from 'mobx';
import VariableStore from './VariableStore';
import { PCA } from 'ml-pca';
import { UMAP } from 'umap-js';
import TSNE from 'tsne-js';

import { getUniqueKeyName, PrefixSpan, clusterfck } from 'modules/UtilityClasses'
import { message } from 'antd';
import NGram from '../UtilityClasses/ngram';

/*
 stores information about timepoints. Combines betweenTimepoints and sampleTimepoints
 */
class DataStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.numberOfPatients = 300; // default number of patients
        this.encodingMetric = 'ngram' // ngram or prefix
        this.ngram = new NGram([], [], 1)
        this.variableStores = { // one store for the two different type of blocks (sample/between)
            sample: new VariableStore(rootStore, 'sample'),
            between: new VariableStore(rootStore, 'between'),
        };
        extendObservable(this, {

            DRMethod: 'pca', // 'pca', 'umap', 'tsne'
            timepoints: [], // all timepoints
            selectedPatients: [], // currently selected patients
            globalPrimary: '', // global primary for sample timepoints of global timeline
            hasEvent: false, // whether event attributes are included in custom grouping
            stateLabels: {}, // key & label pairs
            pointGroups: {}, // the group of this.points: pointIdx[][]
            numofStates: 3, // the initial threshold to group points
            patientGroups: [[...rootStore.patients]],

            /**
             * get the maximum number of currently displayed partitions
             * @returns {number}
             */
            get maxPartitions() {
                let maxPartitions = 0;
                const {patientGroups} = this
                const groupedTP = this.timepoints.filter(d => d.isGrouped);
                if (this.rootStore.uiStore.selectedTab === 'block') {
                    maxPartitions = Math.max(...groupedTP.map(d => d.grouped.length), 0);
                } else {
                    patientGroups.forEach((patientGroup) => {
                        let partitions = []
                        groupedTP.forEach(tp => {
                            let count = 0
                            tp.customGrouped.forEach((customGroup, i) => {
                                const numPatients = customGroup.patients.filter(p => patientGroup.includes(p))
                                if (numPatients.length > 0) count += 1
                            })
                            partitions.push(count)
                        })
                        maxPartitions += ( Math.max(...partitions, 0) + 1 );
                    })
                }
                return maxPartitions;

            },
            get patientGroupNum() {
                return this.patientGroups.length
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
            get sampleFeatureDomains() {
                let sampleDomains = this.currentNonPatientVariables
                    .map(id=>{
                        return this.variableStores.sample.referencedVariables[id].domain
                    }),
                
                    eventDomains = this.variableStores.between.fullCurrentVariables.map(d => d.domain)

                if (this.hasEvent === false) {
                    return sampleDomains
                } else {
                    return sampleDomains.concat(eventDomains)
                }
            },
            get patientDomains(){
                const patientVars = this.rootStore.clinicalPatientCategories.map(d=>d.id)
                const domains = this.currentVariables.filter(
                    id=>patientVars.includes(id)
                ).map(id=>{
                    const {domain} = this.variableStores.sample.referencedVariables[id]
                    return domain
                })
                return domains
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
            get currentNonPatientVariables (){
                const patientVars = this.rootStore.clinicalPatientCategories.map(d=>d.id)
                return this.currentVariables.filter(
                    id=>!patientVars.includes(id)
                )
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
                let { points, referencedVariables, currentNonPatientVariables } = this
                if (points.length === 0) return []
                let normValues = points.map(point => {
                    let normValue = point.value.map((value, i) => {
                        let ref = referencedVariables[currentNonPatientVariables[i]]
                        
                        if (typeof (value) === "number") {
                            let domain = ref.domain
                            return domain[1] === domain[0]? 0 : (value - domain[0]) / (domain[1] - domain[0])
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

            // points with normalized values and dimension redication pos
            get normPoints() {
                let { normValues } = this
                if (normValues.length === 0) return []
                let norm2dValues = []

                if (this.normValues[0].length > 2) {
                    // only calculate pca when dimension is larger than 2

                    if (this.DRMethod === 'pca') {
                        let pca = new PCA(normValues)
                        norm2dValues = pca.predict(normValues, { nComponents: 2 }).to2DArray()
                    } else if (this.DRMethod === 'umap') {
                        let umap = new UMAP({
                            nComponents: 2,
                            nEpochs: 400,
                            nNeighbors: 15,
                        });

                        norm2dValues = umap.fit(normValues);
                    } else if (this.DRMethod === "tsne") {
                        let tsne = new TSNE({
                            dim: 2,
                            perplexity: 10,
                            earlyExaggeration: 4.0,
                            learningRate: 100.0,
                            nIter: 500,
                            metric: 'euclidean'
                        });

                        // inputData is a nested array which can be converted into an ndarray
                        // alternatively, it can be an array of coordinates (second argument should be specified as 'sparse')
                        tsne.init({
                            data: normValues,
                            type: 'dense'
                        });


                        tsne.run();


                        // `outputScaled` is `output` scaled to a range of [-1, 1]
                        norm2dValues = tsne.getOutputScaled();
                    }

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

            // // the importance score of each feature
            get importancePCAScores() {
                if (this.normValues.length === 0 || this.normValues[0].length <= 1) return []
                let { currentNonPatientVariables } = this
                let pca = new PCA(this.normValues)
                let egiVector = pca.getEigenvectors()
                let importanceScores = egiVector.getColumn(0).map((d, i) => Math.abs(d) + Math.abs(egiVector.getColumn(1)[i]))
                return importanceScores.map((score, i) => {
                    let id = currentNonPatientVariables[i]
                    let {name} = this.referencedVariables[id]
                    return {
                        id,
                        name,
                        score
                    }
                })
            },

            get importanceScores() {
                if (this.DRMethod === 'pca') return this.importancePCAScores

                let { currentNonPatientVariables } = this
                return currentNonPatientVariables
                .map(id => {
                    let {name} = this.referencedVariables[id]
                    return { name, score: 0.5, id }
                })
            },

            /**
            * the state sequence of each patient
            * @return {[patient:string]: string[]}
            */
            get patientStates() {
                let { points, pointGroups } = this
                let patientStates = {}

                points.sort((a, b) => a.timeIdx - b.timeIdx)
                points.forEach(point => {
                    let { idx, patient } = point
                    let stateKey = Object.values(pointGroups).find(pointGroup => pointGroup.pointIdx.includes(idx))?.stateKey
                    if (!patientStates[patient]) {
                        patientStates[patient] = []
                    }
                    if (! stateKey) return 
                    patientStates[patient].push(stateKey)

                })



                return patientStates
            },



            get maxTime() {
                let { points } = this
                let maxTimeIdx = Math.max(...points.map(d => d.timeIdx))
                return maxTimeIdx + 1
            },

            get medTime() {
                let { points } = this
                let midIdx = Math.floor(points.length / 2)
                return points.map(d => d.timeIdx + 1).sort()[midIdx]
            },

            /**
             * each patient is encoded by whether they have the frequent patterns
             * @return {Array<[patientName[], stateKey[]]>}
             */
            get frequentPatterns() {
                let { patientStates } = this


                let sequences = Object.values(patientStates)
                let patients = Object.keys(patientStates)
                const minSupport = Math.max(patients.length * 0.2, 2),
                    // minLen = Math.max(this.maxTime*0.3, 2),
                    // maxLen = Math.min(this.medTime, 3)
                    maxLen = 2, minLen = 2
                let prefixSpan = new PrefixSpan()
                let results = prefixSpan.frequentPatterns(sequences, minSupport, minLen, maxLen)
                results = results.map(d => [d[0].map(i => patients[i]), d[1]])

                return results
            },

            get ngramResults() {
                let { patientStates } = this
                let { patients } = this.rootStore
                let ngram = new NGram(
                    patients.map(p => patientStates[p]),
                    [2, 3],
                    patients.length * 0.03
                )
                return ngram.getNGram().map(d => {
                    return [patients.filter((_, i) => d.seqCounts[i] > 0), d.ngram]
                })
            },

            get patientEncodings() {
                let { patients } = this.rootStore
                let patientEncodings

                // *** 
                // encoding patients based on frequent patterns
                // **** */
                if (this.encodingMetric === "prefix") {
                    patientEncodings = patients.map(p => {
                        return { patient: p, encoding: [] }
                    })
                    let { frequentPatterns } = this
                    // don't group without frequent patterns
                    if (frequentPatterns.length === 0) {
                        message.error('Cannot group patients without frequent patterns!');
                    }

                    frequentPatterns.forEach(d => {
                        let [patients] = d
                        patientEncodings.forEach(d => {
                            let { patient, encoding } = d
                            if (patients.includes(patient)) {
                                encoding.push(1)
                            } else {
                                encoding.push(0)
                            }
                        })
                    })
                }


                // // //encoding patients based on state 
                // let {patientStates, pointGroups} = this
                // let allStates = Object.keys(pointGroups)
                // patientEncodings.forEach((patientEncoding, i)=>{
                //     let {patient} = patientEncoding
                //     allStates.forEach(state=>{
                //         if (patientStates[patient].includes(state)){
                //             patientEncodings[i].encoding.push(1)
                //         }else{
                //             patientEncodings[i].encoding.push(0)
                //         }
                //     })
                // })

                if (this.encodingMetric === "ngram") {
                    let { patientStates } = this
                    let ngram = new NGram(
                        patients.map(p => patientStates[p]),
                        [2, 3],
                        patients.length * 0.03
                    )

                    this.ngram = ngram

                    patientEncodings = patients.map((p, i) => {
                        return { patient: p, encoding: ngram.arrEncodings[i] }
                    })

                }



                return patientEncodings
            },


            changePatientGroupNum: action((num) => {
                if (typeof (num) !== 'number') return
                if (num === 0) return
                if (num === this.patientGroups.length) return
                if (num === 1) {
                    this.patientGroups = [[...this.rootStore.patients]]
                    return
                }

                let { patientEncodings } = this


                let patientClusters = clusterfck.hcluster(patientEncodings.map(d => d.encoding), "euclidean", "complete", Infinity, num)

                if (patientClusters.length < num) {
                    message.error('Cannot further divide patients!')
                    return
                }

                this.patientGroups = patientClusters.map(d => d.itemIdx.map(i => this.rootStore.patients[i]))


            }),

            changeClusterNum: action((num) => {
                if (typeof (num) !== "number") return
                this.numofStates = num
                this.autoGroup()
                this.applyCustomGroups()
            }),

            changeDRMethod: action((methodName) => {
                if (methodName !== this.DRMethod) {
                    this.DRMethod = methodName
                }

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
                this.patientGroups = [this.rootStore.patients]
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

                if (normPoints.length === 0) return
                let { numofStates } = this
                var clusters = clusterfck.hcluster(normPoints.map(d => d.pos), "euclidean", "average", Infinity, numofStates);
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
                this.numofStates = Object.keys(pointGroups).length
                this.applyCustomGroups()
            }),

            deletePointGroup: action((stateKey) => {
                const NONAME = "undefined"
                if (!this.pointGroups[NONAME]) {
                    this.pointGroups[NONAME] = { ...this.pointGroups[stateKey], stateKey: NONAME }

                } else {
                    let pointIdx1 = this.pointGroups[stateKey].pointIdx, pointIdx2 = this.pointGroups[NONAME].pointIdx
                    this.pointGroups[NONAME] = {
                        pointIdx: pointIdx1.concat(pointIdx2),
                        stateKey: NONAME
                    }
                }
                delete this.pointGroups[stateKey]

                this.applyCustomGroups()
            }),

            applyCustomGroups: action(() => {
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
                                { patients } = partition
                            // points.push(id)
                            patients.push(patient)
                        } else {
                            timeState.partitions.push({
                                partition: stateKey,
                                // points: [id],
                                // rows: [],
                                patients: [patient]
                            })
                        }
                    })
                })

                // creat event states
                let eventStates = [timeStates[0]] // the first event have the same partition as the first timepoint
                for (let i = 0; i < timeStates.length - 1; i++) {
                    let eventState = { timeIdx: i + 1, partitions: [] }
                    let curr = timeStates[i], next = timeStates[i + 1]

                    curr.partitions.forEach((currPartition) => {
                        let {
                            partition: currName,
                            patients: currPatients
                        } = currPartition

                        let remainPatients = currPatients

                        next.partitions.forEach(nextPartition => {
                            let {
                                partition: nextName,
                                patients: nextPatients
                            } = nextPartition



                            let intersection = currPatients.filter(d => nextPatients.includes(d))
                            remainPatients = remainPatients.filter(d => !intersection.includes(d))
                            if (intersection.length > 0) {
                                eventState.partitions.push({
                                    partition: `${currName}-${nextName}`,
                                    patients: intersection,
                                    // points: nextPoints.map(id => points[id])
                                    //     .filter(p => intersection.includes(p.patient))
                                    //     .map(p => p.idx),
                                    // rows: []
                                }
                                )
                            }
                        })

                        if (remainPatients.length > 0) {
                            eventState.partitions.push({
                                partition: `${currName}->none`,
                                patients: remainPatients
                            })
                        }
                    })


                    eventStates.push(eventState)

                }

                // the last event has the same partition as the last timepoint
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

    removeVariable(variableID) {
        let sampleVariables = this.variableStores.sample.currentVariables
        if (sampleVariables.includes(variableID)) {
            this.variableStores['sample'].removeVariable(variableID);
        } else {
            this.variableStores['between'].removeVariable(variableID);
        }
    }
}


export default DataStore;
