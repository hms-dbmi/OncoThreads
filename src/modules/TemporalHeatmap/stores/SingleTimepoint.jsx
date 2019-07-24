import { action, extendObservable } from 'mobx';

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
        this.heatmapSorting = { variable: '', order: 0 };
        extendObservable(this, {
            heatmapOrder: order,
            groupOrder: 1,
            heatmap: [],
            isGrouped: false,
            primaryVariableId: '',
            name: localIndex,
            /**
             * computes grouped layout based on current heatmap and order.
             * @returns {Array}
             */
            get grouped() {
                const grouped = [];
                let variableDomain = this.rootStore.dataStore.variableStores[this.type]
                    .getById(this.primaryVariableId).domain.concat(undefined);
                if (this.groupOrder === -1) {
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
                            if (this.groupOrder === -1) {
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
             * sets timepoint name
             */
            setName: action((name) => {
                this.name = name;
            }),
            /**
             * sets isGrouped
             */
            setIsGrouped: action((isGrouped) => {
                this.isGrouped = isGrouped;
            }),
            /**
             * sets order in groups
             */
            setGroupOrder: action((newOrder) => {
                this.groupOrder = newOrder;
            }),
            /**
             * sets primary variable
             */
            setPrimaryVariable: action((id) => {
                this.primaryVariableId = id;
            }),
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
             * @param variableId
             * @param variableData
             */
            addRow: action((variableId, variableData) => {
                this.heatmap.push({
                    variable: variableId,
                    data: variableData,
                    isUndef: variableData.every(d => d.value === undefined),
                });
                if (this.primaryVariableId === '') {
                    this.setPrimaryVariable(variableId);
                }
            }),

            /**
             * removes a row
             * @param variableId
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
                    this.primaryVariableId = '';
                } else if (variableId === this.primaryVariableId) {
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
             * @param index
             * @param variableId
             * @param variableData
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
             */
            resortRows: action((newOrder) => {
                this.heatmap = this.heatmap.sort((a, b) => {
                    if (newOrder.indexOf(a.variable) < newOrder.indexOf(b.variable)) {
                        return -1;
                    }
                    if (newOrder.indexOf(a.variable) > newOrder.indexOf(b.variable)) {
                        return 1;
                    }
                    return 0;
                });
            }),
            sortHeatmapLikeGroup: action(() => {
                this.sortHeatmap(this.primaryVariableId, this.groupOrder);
            }),
            /**
             * sorts heatmap (sets new heatmap order)
             */
            sortHeatmap: action((variable, newOrder) => {
                const varToSort = this.rootStore.dataStore.variableStores[this.type]
                    .getById(variable);
                this.heatmapSorting = { variable, order: newOrder };
                const previousOrder = this.heatmapOrder.slice();
                const variableIndex = this.rootStore.dataStore.variableStores[this.type]
                    .currentVariables.indexOf(variable);
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
                this.heatmapOrder = helper.sort((a, b) => {
                    if (varToSort.datatype === 'NUMBER') {
                        if (a.value < b.value) return -newOrder;
                        if (a.value > b.value) return newOrder;
                    } else {
                        if (varToSort.domain.indexOf(a.value) < varToSort.domain.indexOf(b.value)) {
                            return -newOrder;
                        }
                        if (varToSort.domain.indexOf(a.value) > varToSort.domain.indexOf(b.value)) {
                            return newOrder;
                        }
                    }
                    // undefined values accumulate on the right
                    if (a.value === undefined && b.value !== undefined) {
                        return 1;
                    }
                    if (a.value !== undefined && b.value === undefined) {
                        return -1;
                    }
                    // if sorting is ambiguous do additional sorting

                    // if the timepoint is sorted for the first time (no previous order)
                    if (previousOrder.indexOf(a.patient) < previousOrder.indexOf(b.patient)) {
                        return -1;
                    }
                    if (previousOrder.indexOf(a.patient) > previousOrder.indexOf(b.patient)) {
                        return 1;
                    }

                    return 0;
                }).map(d => d.patient);
            }),
            /**
             * hierachical sorting of all rows plus realigning afterwards
             */
            magicSort: action((variable) => {
                for (let i = 0; i < this.heatmap.length; i += 1) {
                    this.sort(this.heatmap[i].variable);
                    if (this.heatmap[i].variable === variable) {
                        break;
                    }
                }
                this.rootStore.dataStore.applyPatientOrderToAll(this.globalIndex);
            }),
            /**
             * sorts the timepoint by a variable
             * (handled differently for grouped and ungrouped timepoints)
             * @param variableId
             */
            sort: action((variableId) => {
                // case: the timepoint is grouped
                this.setPrimaryVariable(variableId);
                if (this.isGrouped) {
                    this.setGroupOrder(-this.groupOrder);
                    // case: the timepoint is not grouped
                } else {
                    // this.rootStore.uiStore.setRealTime(false);
                    let currentOrder = 1;
                    if (this.heatmapSorting.variable === variableId) {
                        currentOrder = -this.heatmapSorting.order;
                    }
                    this.sortHeatmap(variableId, currentOrder);
                }
            }),

            /**
             * groups a timepoint
             * @param variable
             */
            group: action((variable) => {
                this.setPrimaryVariable(variable);
                this.setIsGrouped(true);
            }),

            /**
             * promotes a timepoint
             * @param variableId
             */
            promote: action((variableId) => {
                this.setPrimaryVariable(variableId);
            }),

            /**
             * ungroupes a timepoint by swapping to the heatmap representation
             * @param variable
             */
            unGroup: action((variable) => {
                this.setPrimaryVariable(variable);
                this.setIsGrouped(false);
            }),
        });
    }
}

export default SingleTimepoint;
