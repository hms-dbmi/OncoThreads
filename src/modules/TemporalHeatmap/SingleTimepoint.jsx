import {extendObservable} from "mobx";

/*
stores information about a single timepoint
 */
class SingleTimepoint {
    constructor(rootStore, variable, patients, type, localIndex, order) {
        this.rootStore = rootStore;
        this.type = type;
        this.patients = patients;
        this.globalIndex = -1;
        this.localIndex = localIndex;
        this.previousOrder = null;
        this.variableSortOrder = [];
        extendObservable(this, {
            heatmap: [],
            grouped: [],
            heatmapOrder: order,
            groupOrder: 1,
            isGrouped: false,
            primaryVariableId: variable,
            name: localIndex
        });
    }

    setName(name) {
        this.name = name;
    }

    setIsGrouped(boolean) {
        this.isGrouped = boolean;
        this.rootStore.transitionStore.adaptTransitions(this.globalIndex);
    }

    addRow(variableId, variableData) {
        let isUndefined = true;
        for (let i = 0; i < variableData.length; i++) {
            if (variableData[i].value !== undefined) {
                isUndefined = false;
                break;
            }
        }
        this.heatmap.push({variable: variableId, sorting: 0, data: variableData, isUndef: isUndefined});
    }

    sortWithParameters(variables, heatmapSortings, groupSorting) {
        this.variableSortOrder = variables;
        if (this.isGrouped) {
            if (this.primaryVariableId !== this.variableSortOrder[this.variableSortOrder.length - 1]) {
                this.setPrimaryVariable(this.variableSortOrder[this.variableSortOrder.length - 1]);
                this.groupTimepoint(this.variableSortOrder[this.variableSortOrder.length - 1]);
            }
            this.sortGroup(groupSorting);
        }
        //case: the timepoint is not grouped
        else {
            this.rootStore.realTime = false;
            this.setPrimaryVariable(this.variableSortOrder[this.variableSortOrder.length - 1]);
            const _self = this;
            this.variableSortOrder.forEach(function (d, i) {
                _self.sortHeatmap(d, heatmapSortings[i]);
            })
        }
    }

    sort(variableId) {
        //case: the timepoint is grouped
        if (this.isGrouped) {
            if (this.primaryVariableId !== variableId) {
                this.setPrimaryVariable(variableId);
                this.groupTimepoint(variableId);
            }
            this.sortGroup(-this.groupOrder);
        }
        //case: the timepoint is not grouped
        else {
            this.rootStore.realTime = false;
            this.setPrimaryVariable(variableId);
            if (!(this.variableSortOrder.includes(variableId))) {
                this.variableSortOrder.push(variableId);
            }
            else {
                this.variableSortOrder.splice(this.variableSortOrder.indexOf(variableId), 1);
                this.variableSortOrder.push(variableId);
            }
            this.sortHeatmap(variableId);
        }
    }

    group(variable) {
        this.setPrimaryVariable(variable);
        this.groupTimepoint(variable);
        this.sortGroup(1);
        //this.rootStore.visStore.modifyTransitionSpace(100,this.globalIndex-1);
    }

    promote(variableId) {
        this.setPrimaryVariable(variableId);
        if (this.isGrouped) {
            this.groupTimepoint(variableId);
            this.sortGroup(this.groupOrder);
        }
    }

    /**
     * ungroupes a timepoint by swapping to the heatmap representation
     * @param variable
     */
    unGroup(variable) {
        this.setPrimaryVariable(variable);
        this.setIsGrouped(false);
        //this.rootStore.visStore.modifyTransitionSpace(100,this.globalIndex-1);
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
        const variableIndex = this.rootStore.timepointStore.currentVariables[this.type].map(function (d) {
            return d.id
        }).indexOf(variable);
        let currPartitionCount = 0;
        for (let i = 0; i < this.heatmap[variableIndex].data.length; i++) {
            const currPartitionKey = this.heatmap[variableIndex].data[i].value;
            let partitionIndex = grouped.map(function (e) {
                return e.partition;
            }).indexOf(currPartitionKey);
            if (partitionIndex === -1) {
                let rows = this.rootStore.timepointStore.currentVariables[this.type].map(function (d) {
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
                    grouped = this.addInstance(grouped, partitionIndex, currSecondary, row, this.heatmap[row].data[i].patient, this.rootStore.timepointStore.variableStore[this.type].getById(this.heatmap[row].variable).datatype === "NUMBER");
                }
            }
        }
        this.grouped = grouped;
        this.isGrouped = true;
    }


    /**
     * Adds counts to a partition or creates partition if it does not exist yet
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
    sortGroup(order) {
        this.groupOrder = order;
        this.grouped = this.grouped.sort(function (a, b) {
            if (a.partition < b.partition) {
                return -order;
            }
            if (a.partition > b.partition) {
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
     * @param sortOrder (optional) if it is not passed, the opposite order of the previous sorting is applied
     */
    sortHeatmap(variable, sortOrder) {
        const previousOrder = this.heatmapOrder.slice();
        const variableIndex = this.rootStore.timepointStore.currentVariables[this.type].map(function (d) {
            return d.id
        }).indexOf(variable);
        const rowToSort = this.heatmap[variableIndex];
        let helper = this.heatmapOrder.map(function (d) {
            return ({"patient": d, "value": undefined})
        });
        rowToSort.data.forEach(function (d) {
            helper.forEach(function (f) {
                if (d.patient === f.patient) {
                    f.value = d.value;
                }
            })
        });
        if (sortOrder === undefined) {
            if (rowToSort.sorting === 0) {
                sortOrder = 1;
                rowToSort.sorting = 1;
            }
            else {
                sortOrder = rowToSort.sorting * (-1);
                rowToSort.sorting = rowToSort.sorting * (-1);
            }
        }
        else {
            rowToSort.sorting = sortOrder;
        }

        this.heatmap[variableIndex] = rowToSort;
        //first sort after primary variable values
        this.heatmapOrder = helper.sort(function (a, b) {
            if (a.value < b.value)
                return -sortOrder;
            if (a.value > b.value)
                return sortOrder;
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


    getSortOrder(variable) {
        return this.heatmap[this.rootStore.timepointStore.currentVariables[this.type].map(function (d) {
            return d.id
        }).indexOf(variable)].sorting;
    }

    /**
     * resets the primary variable if the removed variable was a primary variable
     * @param variableId
     */
    adaptPrimaryVariable(variableId) {
        let newVariableIndex = 0;
        if (this.rootStore.timepointStore.currentVariables[this.type].map(function (d) {
            return d.id
        }).indexOf(variableId) === 0) {
            newVariableIndex = 1
        }
        if (this.rootStore.timepointStore.currentVariables[this.type][newVariableIndex].datatype === "NUMBER") {
            this.unGroup(variableId)
        }
        this.primaryVariableId = this.rootStore.timepointStore.currentVariables[this.type][newVariableIndex].id;
    }
}


export default SingleTimepoint;