import {action, extendObservable} from "mobx";

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
        this.heatmapSorting = {variable: "", order: 0};
        extendObservable(this, {
            heatmapOrder: order,
            groupOrder: 1,
            heatmap: [],
            isGrouped: false,
            primaryVariableId: "",
            name: localIndex,
            /**
             * computes grouped layout based on current heatmap and order.
             * @returns {Array}
             */
            get grouped() {
                let grouped = [];
                let variableDomain = this.rootStore.dataStore.variableStores[this.type].getById(this.primaryVariableId).domain;
                if (this.groupOrder === -1) {
                    variableDomain = variableDomain.reverse();
                }
                variableDomain.forEach(partition => {
                    let patients = this.heatmap.filter(d => d.variable === this.primaryVariableId)[0].data.filter(d => d.value === partition).map(d => d.patient);
                    if (patients.length > 0) {
                        let rows = [];
                        this.heatmap.forEach(row => {
                            let counts = [];
                            let currVarDomain = this.rootStore.dataStore.variableStores[this.type].getById(row.variable).domain;
                            if (this.groupOrder === -1) {
                                currVarDomain = currVarDomain.reverse();
                            }
                            let isNumerical = this.rootStore.dataStore.variableStores[this.type].getById(row.variable).datatype === "NUMBER";
                            if (!isNumerical) {
                                currVarDomain.forEach(value => {
                                    let valuePatients = row.data.filter(d => patients.includes(d.patient) && d.value === value).map(d => d.patient);
                                    if (valuePatients.length > 0) {
                                        counts.push({key: value, patients: valuePatients});
                                    }
                                });
                            }
                            else {
                                counts = row.data.filter(d => patients.includes(d.patient)).map(d => {
                                    return {key: d.value, patients: [d.patient]}
                                });
                            }
                            rows.push({variable: row.variable, counts: counts});
                        });
                        grouped.push({partition: partition, rows: rows, patients: patients})
                    }
                });
                return grouped;
            },
            /**
             * sets timepoint name
             */
            setName: action(name=> {
                this.name = name
            }),
            /**
             * sets isGrouped
             */
            setIsGrouped: action(isGrouped=> {
                this.isGrouped = isGrouped;
            }),
            /**
             * sets order in groups
             */
            setGroupOrder: action(order=> {
                this.groupOrder = order;
            }),
            /**
             * sets primary variable
             */
            setPrimaryVariable: action(id=> {
                this.primaryVariableId = id;
            }),
            setHeatmapOrder:action(order=>{
                this.heatmapOrder.replace(order);
            }),
            /**
             * resets the heatmap
             */
            reset: action(()=> {
                this.heatmap = [];
            }),

            /**
             * adds a row
             * @param variableId
             * @param variableData
             */
            addRow: action((variableId, variableData)=> {
                this.heatmap.push({
                    variable: variableId,
                    data: variableData,
                    isUndef: variableData.every(d => d.value === undefined)
                });
                if (this.primaryVariableId === "") {
                    this.setPrimaryVariable(variableId);
                }
            }),

            /**
             * removes a row
             * @param variableId
             */
            removeRow: action(variableId=>{
                let deleteIndex = -1;
                for (let i = 0; i < this.heatmap.length; i++) {
                    if (this.heatmap[i].variable === variableId) {
                        deleteIndex = i;
                        break;
                    }
                }
                this.heatmap.splice(deleteIndex, 1);
                if (this.heatmap.length < 1) {
                    this.primaryVariableId = "";
                }
                else if (variableId === this.primaryVariableId) {
                    let primaryIndex = this.rootStore.dataStore.variableStores[this.type].fullCurrentVariables.map(d => d.datatype === "NUMBER").indexOf(false);
                    if (this.isGrouped && primaryIndex !== -1) {
                        this.setPrimaryVariable(this.heatmap[primaryIndex].variable);
                    }
                    else {
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
            updateRow: action((index, variableId, variableData)=> {
                const isPrimary = this.heatmap[index].variable === this.primaryVariableId;
                this.heatmap[index].variable = variableId;
                this.heatmap[index].data = variableData;
                this.heatmap[index].isUndef = SingleTimepoint.rowIsUndefined(variableData);
                if (isPrimary) {
                    this.setPrimaryVariable(variableId);
                }
            }),
            /**
             * changes the order of the rows
             */
            resortRows: action(order=> {
                this.heatmap = this.heatmap.sort((a, b) => {
                    if (order.indexOf(a.variable) < order.indexOf(b.variable)) {
                        return -1;
                    }
                    if (order.indexOf(a.variable) > order.indexOf(b.variable)) {
                        return 1;
                    }
                    else return 0;
                });
            }),
            /**
             * sorts heatmap (sets new heatmap order)
             */
            sortHeatmap: action((variable, order)=> {
                const _self = this;
                let varToSort = this.rootStore.dataStore.variableStores[this.type].getById(variable);
                this.heatmapSorting = {variable: variable, order: order};
                const previousOrder = this.heatmapOrder.slice();
                const variableIndex = this.rootStore.dataStore.variableStores[this.type].currentVariables.indexOf(variable);
                let helper = this.heatmapOrder.map(d=> {
                    let patientIndex = _self.heatmap[variableIndex].data.map(d => d.patient).indexOf(d);
                    if (patientIndex === -1) {
                        return ({patient: d, value: undefined})
                    }
                    else {
                        return ({patient: d, value: _self.heatmap[variableIndex].data[patientIndex].value})
                    }
                });
                //first sort after primary variable values
                this.heatmapOrder = helper.sort((a, b)=> {
                    if (varToSort.datatype === "NUMBER") {
                        if (a.value < b.value)
                            return -order;
                        if (a.value > b.value)
                            return order;
                    }
                    else {
                        if (varToSort.domain.indexOf(a.value) < varToSort.domain.indexOf(b.value)) {
                            return -order;
                        }
                        if (varToSort.domain.indexOf(a.value) > varToSort.domain.indexOf(b.value)) {
                            return order;
                        }
                    }
                    //undefined values accumulate on the right
                    if (a.value === undefined && b.value !== undefined) {
                        return 1;
                    }
                    if (a.value !== undefined && b.value === undefined) {
                        return -1;
                    }
                    //if sorting is ambiguous do additional sorting
                    else {
                        //if the timepoint is sorted for the first time (no previous order)
                        if (previousOrder.indexOf(a.patient) < previousOrder.indexOf(b.patient)) {
                            return -1;
                        }
                        if (previousOrder.indexOf(a.patient) > previousOrder.indexOf(b.patient)) {
                            return 1;
                        }
                        else {
                            return 0
                        }
                    }
                }).map(d=> {
                    return d.patient;
                });
            }),
            /**
             * hierachical sorting of all rows plus realigning afterwards
             */
            magicSort: action(variable=> {
                for (let i = 0; i < this.heatmap.length; i++) {
                    this.sort(this.heatmap[i].variable);
                    if (this.heatmap[i].variable === variable) {
                        break;
                    }
                }
                this.rootStore.dataStore.applyPatientOrderToAll(this.globalIndex, false);
            }),
            /**
             * sorts the timepoint by a variable (handled differently for grouped and ungrouped timepoints)
             * @param variableId
             */
            sort: action(variableId=> {
                //case: the timepoint is grouped
                if (this.isGrouped) {
                    if (this.primaryVariableId !== variableId) {
                        this.setPrimaryVariable(variableId);
                    }
                    this.setGroupOrder(-this.groupOrder);
                }
                //case: the timepoint is not grouped
                else {
                    //this.rootStore.uiStore.setRealTime(false);
                    this.setPrimaryVariable(variableId);
                    let order = 1;
                    if (this.heatmapSorting.variable === variableId) {
                        order = -this.heatmapSorting.order;
                    }
                    this.sortHeatmap(variableId, order);
                }
            }),

            /**
             * groups a timepoint
             * @param variable
             */
            group: action(variable=> {
                this.setPrimaryVariable(variable);
                this.setIsGrouped(true);
            }),

            /**
             * promotes a timepoint
             * @param variableId
             */
            promote: action(variableId=> {
                this.setPrimaryVariable(variableId);
            }),

            /**
             * ungroupes a timepoint by swapping to the heatmap representation
             * @param variable
             */
            unGroup: action(variable=> {
                this.setPrimaryVariable(variable);
                this.setIsGrouped(false);
            })
        });
    }


}

export default SingleTimepoint;