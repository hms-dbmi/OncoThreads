import { action, extendObservable} from 'mobx';

/*
 stores information about a single timepoint
 */
class SingleTimepoint {
    constructor(rootStore, patients, type, localIndex, order) {
        this.rootStore = rootStore;
        this.type = type;
        this.patients = patients;
        this.globalIndex = localIndex;
        this.localIndex = localIndex;
        this.heatmapSorting = { variable: '', sortDir: 0 };
        extendObservable(this, {
            heatmapOrder: order,
            groupSortDir: 1,
            heatmap: [],
            isGrouped: true,
            primaryVariableId: undefined,
            name: localIndex,
            customPartitions:[],
            /**
             * computes grouped layout based on current heatmap and order.
             * @returns {object[]}
             */
            get grouped() {
                const grouped = [];
                
                let variableDomain = this.rootStore.dataStore.variableStores[this.type]
                    .getById(this.primaryVariableId).domain.concat(undefined);
                if (this.groupSortDir === -1) {
                    variableDomain = variableDomain.reverse();
                }
                variableDomain.forEach((partition) => {
                    const currPatients = this.heatmap.filter(d => d.variable
                        === this.primaryVariableId)[0].data
                        .filter(d => d.value === partition).map(d => d.patient);
                    if (currPatients.length > 0) {
                        const rows = [];
                        this.heatmap.forEach((row) => {
                            let counts = [];
                            let currVarDomain = this.rootStore.dataStore.variableStores[this.type]
                                .getById(row.variable).domain.concat(undefined);
                            if (this.groupSortDir === -1) {
                                currVarDomain = currVarDomain.reverse();
                            }
                            const isNumerical = this.rootStore.dataStore.variableStores[this.type]
                                .getById(row.variable).datatype === 'NUMBER';
                            if (!isNumerical) {
                                currVarDomain.forEach((value) => {
                                    const valuePatients = row.data.filter(d => currPatients
                                        .includes(d.patient) && d.value === value)
                                        .map(d => d.patient);
                                    if (valuePatients.length > 0) {
                                        counts.push({ key: value, patients: valuePatients });
                                    }
                                });
                            } else {
                                counts = row.data.filter(d => currPatients.includes(d.patient))
                                    .map(d => ({ key: d.value, patients: [d.patient] }));
                            }
                            rows.push({ variable: row.variable, counts });
                        });
                        grouped.push({ partition, rows, patients: currPatients });
                    }
                });
                return grouped;
            },
            /**
             * computes custom grouped layout based on current heatmap, order and time state
             * @returns {object[]}
             */
            get customGrouped() {
                let {currentVariables, points} = this.rootStore.dataStore.variableStores[this.type]
                let result = this.customPartitions.map(partition => {
                    let partitionPoints = partition.points.map(idx => points[idx])
                    let partitionRows = {...partition}
    
                    partitionRows.rows = currentVariables.map((variable, variableIdx) => {
                        let counts = []
                        partitionPoints.forEach(point => {
                            let key = point.value[variableIdx]
                            let keyIdx = counts.map(d => d.key).indexOf(key)
                            if (keyIdx === -1) {
                                counts.push({
                                    key,
                                    patients: [point.patient]
                                })
                            } else {
                                if (!(counts[keyIdx].patients.includes(point.patient))) {
                                    counts[keyIdx].patients.push(point.patient)
                                }
                            }
                        })
                        
                        return {
                            variable,
                            counts
                        }
                    })
                    
                    return partitionRows
                })

                return result
            },
            /**
             * sets timepoint name
             * @param {string} name
             */
            setName: action((name) => {
                this.name = name;
            }),
            /**
             * sets isGrouped
             * @param {boolean} isGrouped
             */
            setIsGrouped: action((isGrouped) => {
                this.isGrouped = isGrouped;
            }),
            /**
             * sets order in groups
             * @param {number} newSortDir
             */
            setGroupSortDir: action((newSortDir) => {
                this.groupSortDir = newSortDir;
            }),
            /**
             * sets primary variable
             * @param {string} id
             */
            setPrimaryVariable: action((id) => {
                this.primaryVariableId = id;
            }),
            /**
             * sets a new patient order for the heatmap
             * @param {string[]} newOrder
             */
            setHeatmapOrder: action((newOrder) => {
                this.heatmapOrder.replace(newOrder);
            }),
            /**
             * resets the heatmap
             */
            reset: action(() => {
                this.heatmap = [];
            }),

            /**
             * adds a row
             * @param {string} variableId
             * @param {object[]} variableData
             */
            addRow: action((variableId, variableData) => {
                this.heatmap.push({
                    variable: variableId,
                    data: variableData,
                    isUndef: variableData.every(d => d.value === undefined),
                });
                if (this.primaryVariableId === undefined) {
                    this.setPrimaryVariable(variableId);
                }
            }),

            /**
             * removes a row
             * @param {string} variableId
             */
            removeRow: action((variableId) => {
                let deleteIndex = -1;
                for (let i = 0; i < this.heatmap.length; i += 1) {
                    if (this.heatmap[i].variable === variableId) {
                        deleteIndex = i;
                        break;
                    }
                }
                this.heatmap.splice(deleteIndex, 1);
                if (this.heatmap.length < 1) {
                    this.primaryVariableId = undefined;
                } else if (this.customPartitions.length==0 && variableId === this.primaryVariableId) {
                    const primaryIndex = this.rootStore.dataStore.variableStores[this.type].fullCurrentVariables.map(d => d.datatype === 'NUMBER').indexOf(false);
                    if (this.isGrouped && primaryIndex !== -1) {
                        this.setPrimaryVariable(this.heatmap[primaryIndex].variable);
                    } else {
                        this.setIsGrouped(false);
                        this.setPrimaryVariable(this.heatmap[0].variable);
                    }
                }
            }),

            /**
             * updates a row
             * @param {number} index
             * @param {string} variableId
             * @param {object[]} variableData
             */
            updateRow: action((index, variableId, variableData) => {
                const isPrimary = this.heatmap[index].variable === this.primaryVariableId;
                this.heatmap[index].variable = variableId;
                this.heatmap[index].data = variableData;
                this.heatmap[index].isUndef = variableData.every(d => d.value === undefined);
                if (isPrimary) {
                    this.setPrimaryVariable(variableId);
                }
            }),
            /**
             * changes the order of the rows
             * @param {string[]} newOrder
             */
            resortRows: action((newOrder) => {
                this.heatmap.replace(this.heatmap.slice().sort((a, b) => {
                    if (newOrder.indexOf(a.variable) < newOrder.indexOf(b.variable)) {
                        return -1;
                    }
                    if (newOrder.indexOf(a.variable) > newOrder.indexOf(b.variable)) {
                        return 1;
                    }
                    return 0;
                }));
            }),
            /**
             * sorts the heatmap in the same way that the groups are sorted
             */
            sortHeatmapLikeGroup: action(() => {
                this.sortHeatmap(this.primaryVariableId, this.groupSortDir);
            }),
            /**
             * sorts heatmap (sets new heatmap order)
             * @param {string} variable
             * @param {number} newSortDir
             */
            sortHeatmap: action((variableId, newSortDir) => {
                const varToSort = this.rootStore.dataStore.variableStores[this.type]
                    .getById(variableId);
                this.heatmapSorting = { variable: variableId, sortDir: newSortDir };
                const previousOrder = this.heatmapOrder.slice();
                const variableIndex = this.rootStore.dataStore.variableStores[this.type]
                    .currentVariables.indexOf(variableId);
                const helper = this.heatmapOrder.map((patient) => {
                    const patientIndex = this.heatmap[variableIndex].data
                        .map(d => d.patient).indexOf(patient);
                    if (patientIndex === -1) {
                        return ({ patient, value: undefined });
                    }
                    return ({
                        patient,
                        value: this.heatmap[variableIndex].data[patientIndex].value,
                    });
                });
                // first sort after primary variable values
                this.heatmapOrder.replace(helper.sort((a, b) => {
                    if (varToSort.datatype === 'NUMBER') {
                        if (a.value < b.value) return -newSortDir;
                        if (a.value > b.value) return newSortDir;
                    } else {
                        if (varToSort.domain.indexOf(a.value) < varToSort.domain.indexOf(b.value)) {
                            return -newSortDir;
                        }
                        if (varToSort.domain.indexOf(a.value) > varToSort.domain.indexOf(b.value)) {
                            return newSortDir;
                        }
                    }
                    // undefined values accumulate on the right
                    if (a.value === undefined && b.value !== undefined) {
                        return 1;
                    }
                    if (a.value !== undefined && b.value === undefined) {
                        return -1;
                    }
                    // if the timepoint is sorted for the first time (no previous order)
                    if (previousOrder.indexOf(a.patient) < previousOrder.indexOf(b.patient)) {
                        return -1;
                    }
                    if (previousOrder.indexOf(a.patient) > previousOrder.indexOf(b.patient)) {
                        return 1;
                    }

                    return 0;
                }).map(d => d.patient));
            }),
            /**
             * sorts the groups of a timepoint
             * @param {number} newSortDir
             */
            sortGroup: action((newSortDir) => {
                this.setGroupSortDir(newSortDir);
            }),
            /**
             * hierachical sorting of all rows plus realigning afterwards
             * @param {string} variableId
             */
            magicSort: action((variableId) => {
                for (let i = 0; i < this.heatmap.length; i += 1) {
                    this.sort(this.heatmap[i].variable);
                    if (this.heatmap[i].variable === variableId) {
                        break;
                    }
                }
                this.rootStore.dataStore.applyPatientOrderToAll(this.globalIndex);
            }),
            /**
             * sorts the timepoint by a variable
             * (handled differently for grouped and ungrouped timepoints)
             * @param {string} variableId
             */
            sort: action((variableId) => {
                // case: the timepoint is grouped
                this.setPrimaryVariable(variableId);
                if (this.isGrouped) {
                    this.sortGroup(-this.groupSortDir);
                    // case: the timepoint is not grouped
                } else {
                    // this.rootStore.uiStore.setRealTime(false);
                    let currentSortDir = 1;
                    if (this.heatmapSorting.variable === variableId) {
                        currentSortDir = -this.heatmapSorting.sortDir;
                    }
                    this.sortHeatmap(variableId, currentSortDir);
                }
            }),

            /**
             * groups a timepoint
             * @param {string} variableId
             */
            group: action((variableId) => {
                this.setPrimaryVariable(variableId);
                this.setIsGrouped(true);
            }),

            /**
             * promotes a timepoint
             * @param {string} variableId
             */
            promote: action((variableId) => {
                this.setPrimaryVariable(variableId);
            }),

            /**
             * ungroupes a timepoint by swapping to the heatmap representation
             * @param {string} variableId
             */
            unGroup: action((variableId) => {
                this.setPrimaryVariable(variableId);
                this.setIsGrouped(false);
            }),

            /**
             * group based customized grouping in the scatter plot
             */
            applyCustomState: action((customPartitions)=>{
                this.customPartitions = customPartitions
                
            }),
        });
    }
}

export default SingleTimepoint;
