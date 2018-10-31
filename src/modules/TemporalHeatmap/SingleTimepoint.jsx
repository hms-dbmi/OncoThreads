import {extendObservable} from "mobx";

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
            heatmap: [],
            grouped: [],
            heatmapOrder: order,
            groupOrder: 1,
            isGrouped: false,
            primaryVariableId: "",
            name: localIndex
        });
    }

    /**
     * sets the name of the timepoint
     * @param name
     */
    setName(name) {
        this.name = name;
    }

    /**
     * sets this isGrouped field and adapts transitions
     * @param boolean
     */
    setIsGrouped(boolean) {
        this.isGrouped = boolean;
        this.rootStore.transitionStore.adaptTransitions(this.globalIndex);
    }

    /**
     * resets the heatmap
     */
    reset() {
        this.heatmap = [];
    }

    /**
     * adds a row
     * @param variableId
     * @param variableData
     */
    addRow(variableId, variableData) {
        this.heatmap.push({
            variable: variableId,
            data: variableData,
            isUndef: this.rowIsUndefined(variableData)
        });
        if (this.primaryVariableId === "") {
            this.primaryVariableId = variableId;
        }
    }

    /**
     * removes a row
     * @param variableId
     */
    removeRow(variableId) {
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
            this.primaryVariableId = this.heatmap[0].variable;
        }
    }

    /**
     * updates a row
     * @param index
     * @param variableId
     * @param variableData
     */
    updateRow(index, variableId, variableData) {
        this.heatmap[index].variable = variableId;
        this.heatmap[index].data = variableData;
        this.heatmap[index].isUndef = this.rowIsUndefined(variableData);
    }

    /**
     * checks if a row is undefined
     * @param rowData
     * @returns {boolean}
     */
    rowIsUndefined(rowData) {
        let isUndefined = true;
        for (let i = 0; i < rowData.length; i++) {
            if (rowData[i].value !== undefined) {
                isUndefined = false;
                break;
            }
        }
        return isUndefined;
    }

    /**
     * sorts the timepoint by a variable (handled differently for grouped and ungrouped timepoints)
     * @param variableId
     */
    sort(variableId) {
        //case: the timepoint is grouped
        if (this.isGrouped) {
            if (this.primaryVariableId !== variableId) {
                this.setPrimaryVariable(variableId);
                this.groupTimepoint(variableId);
            }
            this.sortGroup(variableId,-this.groupOrder);
        }
        //case: the timepoint is not grouped
        else {
            this.rootStore.timepointStore.realTime = false;
            this.setPrimaryVariable(variableId);
            let order = 1;
            if (this.heatmapSorting.variable === variableId) {
                order = -this.heatmapSorting.order;
            }
            this.sortHeatmap(variableId, order);
        }
    }

    /**
     * groups a timepoint
     * @param variable
     */
    group(variable) {
        this.setPrimaryVariable(variable);
        this.groupTimepoint(variable);
        this.sortGroup(variable,1);
    }

    /**
     * promotes a timepoint
     * @param variableId
     */
    promote(variableId) {
        this.setPrimaryVariable(variableId);
        if (this.isGrouped) {
            this.groupTimepoint(variableId);
            this.sortGroup(variableId,this.groupOrder);
        }
    }

    /**
     * ungroupes a timepoint by swapping to the heatmap representation
     * @param variable
     */
    unGroup(variable) {
        this.setPrimaryVariable(variable);
        this.setIsGrouped(false);
    }

    /**
     * declares a variable the primary variable of a timepoint
     * @param variableId
     */
    setPrimaryVariable(variableId) {
        this.primaryVariableId = variableId;
    }

    /**
     * computes grouping of variables
     * @param variable
     */
    groupTimepoint(variable) {
        let grouped = [];
        const variableIndex = this.rootStore.timepointStore.variableStores[this.type].getIndex(variable);
        let currPartitionCount = 0;
        for (let i = 0; i < this.heatmap[variableIndex].data.length; i++) {
            const currPartitionKey = this.heatmap[variableIndex].data[i].value;
            let partitionIndex = grouped.map(function (e) {
                return e.partition;
            }).indexOf(currPartitionKey);
            if (partitionIndex === -1) {
                let rows = this.rootStore.timepointStore.variableStores[this.type].getCurrentVariables().map(function (d) {
                    return {variable: d.id, counts: []}
                });
                let patients = this.heatmap[variableIndex].data.filter(function (d) {
                    return d.value === currPartitionKey;
                }).map(entry => entry.patient);
                grouped.push({partition: currPartitionKey, rows: rows, patients: patients});
                partitionIndex = currPartitionCount;
                currPartitionCount += 1;
            }
            grouped = this.addInstance(grouped, partitionIndex, currPartitionKey, variableIndex, this.heatmap[variableIndex].data[i].patient);
            for (let row = 0; row < this.heatmap.length; row++) {
                if (this.heatmap[row].variable !== variable) {
                    let currSecondary = this.heatmap[row].data[i].value;
                    grouped = this.addInstance(grouped, partitionIndex, currSecondary, row, this.heatmap[row].data[i].patient, this.rootStore.timepointStore.variableStores[this.type].getById(this.heatmap[row].variable).datatype === "NUMBER");
                }
            }
        }
        this.grouped = grouped;
        this.isGrouped = true;
    }


    /**
     * Adds counts to a partition or creates partition if it does not exist yet
     * @param grouped
     * @param partitionIndex: Index of partition to add to
     * @param currKey: Key of partition
     * @param row: current row
     * @param currPatient
     * @param continuous
     */
    addInstance(grouped, partitionIndex, currKey, row, currPatient, continuous) {
        let rowIndex = grouped[partitionIndex].rows.map(function (e) {
            return e.variable;
        }).indexOf(this.heatmap[row].variable);
        let keyIndex = grouped[partitionIndex].rows[rowIndex].counts.map(function (e) {
            return e.key
        }).indexOf(currKey);
        if (keyIndex === -1 || continuous) {
            grouped[partitionIndex].rows[rowIndex].counts.push({
                "key": currKey,
                "value": 1,
                'patients': [currPatient]
            })
        }
        else {
            grouped[partitionIndex].rows[rowIndex].counts[keyIndex].value += 1;
            grouped[partitionIndex].rows[rowIndex].counts[keyIndex].patients.push(currPatient);
        }
        return grouped;
    }


    /**
     * sorts groups
     * @param order: 1 ascending, -1 descending
     */
    sortGroup(variable,order) {
        this.groupOrder = order;
        let domain=this.rootStore.timepointStore.variableStores[this.type].getById(variable).domain;
        console.log(domain);
        this.grouped = this.grouped.sort(function (a, b) {
            if (domain.indexOf(a.partition) < domain.indexOf(b.partition)) {
                return -order;
            }
            if (domain.indexOf(a.partition) > domain.indexOf(b.partition)) {
                return order;
            }
            if (a.partition === undefined && b.partition !== undefined) {
                return 1;
            }
            if (a.partition !== undefined && b.partition === undefined) {
                return -1;
            }
            else return 0;
        });
        this.grouped.forEach(function (d) {
            d.rows.forEach(function (f) {
                f.counts = f.counts.sort(function (a, b) {
                    if (a.key < b.key) {
                        return -order;
                    }
                    if (a.key > b.key) {
                        return order
                    }
                    else {
                        if (a.key === undefined && b.key !== undefined) {
                            return 1;
                        }
                        if (a.key !== undefined && b.key === undefined) {
                            return -1;
                        }
                        else return 0;
                    }
                })
            })
        });
        this.rootStore.transitionStore.adaptTransitions(this.globalIndex);
    }


    /**
     * sorts a heatmap timepoint
     * @param variable
     * @param order
     */
    sortHeatmap(variable, order) {
        const _self = this;
        let varToSort = this.rootStore.timepointStore.variableStores[this.type].getById(variable);
        this.heatmapSorting = {variable: variable, order: order};
        const previousOrder = this.heatmapOrder.slice();
        const variableIndex = this.rootStore.timepointStore.variableStores[this.type].currentVariables.indexOf(variable);
        let helper = this.heatmapOrder.map(function (d) {
            let patientIndex = _self.heatmap[variableIndex].data.map(d => d.patient).indexOf(d);
            if (patientIndex === -1) {
                return ({patient: d, value: undefined})
            }
            else {
                return ({patient: d, value: _self.heatmap[variableIndex].data[patientIndex].value})
            }
        });
        //first sort after primary variable values
        this.heatmapOrder = helper.sort(function (a, b) {
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
        }).map(function (d) {
            return d.patient;
        });
    }

    magicSort(variable) {
        for (let i = 0; i < this.heatmap.length; i++) {
            this.sort(this.heatmap[i].variable);
            if (this.heatmap[i].variable === variable) {
                break;
            }
        }
        this.rootStore.timepointStore.applyPatientOrderToAll(this.globalIndex, false);
    }
}


export default SingleTimepoint;