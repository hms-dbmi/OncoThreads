import {extendObservable} from "mobx";

/*
stores information about timepoints. Combines betweenTimepoints and sampleTimepoints
 */
class SingleTimepoint {
    constructor(rootStore, variable, patients, type, localIndex) {
        this.rootStore = rootStore;
        this.type = type;
        this.patients = patients;
        this.globalIndex = -1;
        this.localIndex = localIndex;
        extendObservable(this, {
            heatmap: [],
            grouped: [],
            heatmapOrder: rootStore.patientOrderPerTimepoint,
            groupOrder: 1,
            isGrouped: false,
            primaryVariable: variable,
        });
    }


    setIsGrouped(boolean) {
        this.isGrouped = boolean;
    }

    sort(variable) {
        //case: the timepoint is grouped
        if (this.isGrouped) {
            if (this.primaryVariable !== variable) {
                this.setPrimaryVariable(variable);
                this.groupTimepoint(variable);
            }
            this.sortGroup(-this.groupOrder);
        }
        //case: the timepoint is not grouped
        else {
            this.setPrimaryVariable(variable);
            this.sortHeatmap(variable);
        }
    }

    group(variable) {
        this.setPrimaryVariable(variable);
        this.groupTimepoint(variable);
        this.sortGroup(1);
    }

    promote(variable) {
        this.setPrimaryVariable(variable);
        if (this.isGrouped) {
            this.groupTimepoint(variable);
            this.sortGroup(this.groupOrder);
        }
    }

    /**
     * ungroupes a timepoint by swapping to the heatmap representation
     * @param variable
     */
    unGroup(variable) {
        this.setIsGrouped(false);
        this.setPrimaryVariable(variable);
        this.rootStore.transitionStore.adaptTransitions(this.globalIndex);
    }

    /**
     * declares a variable the primary variable of a timepoint
     * @param variable
     */
    setPrimaryVariable(variable) {
        this.primaryVariable = variable
    }

    /**
     * computes grouping of variables
     * @param variable
     */
    groupTimepoint(variable) {
        this.grouped = [];
        const variableIndex = this.rootStore.timepointStore.currentVariables[this.type].map(function (d) {
            return d.variable
        }).indexOf(variable);
        let currPartitionCount = 0;
        for (let i = 0; i < this.heatmap[variableIndex].data.length; i++) {
            const currPartitionKey = this.heatmap[variableIndex].data[i].value;
            let partitionIndex = this.grouped.map(function (e) {
                return e.partition;
            }).indexOf(currPartitionKey);
            if (partitionIndex === -1) {
                let rows = this.rootStore.timepointStore.currentVariables[this.type].map(function (d) {
                    return {variable: d.variable, counts: []}
                });
                let patients=this.heatmap[variableIndex].data.filter(function (d,i) {
                    return d.value===currPartitionKey;
                }).map(entry =>entry.patient);
                this.grouped.push({partition: currPartitionKey, rows: rows, patients:patients});
                partitionIndex = currPartitionCount;
                currPartitionCount += 1;
            }
            this.addInstance(partitionIndex, currPartitionKey, variableIndex);
            for (let row = 0; row < this.heatmap.length; row++) {
                if (this.heatmap[row].variable !== variable) {
                    let currSecondary = this.heatmap[row].data[i].value;
                    this.addInstance(partitionIndex, currSecondary, row);
                }
            }
        }
        this.setIsGrouped(true);
    }


    /**
     * Adds counts to a partition or creates partition if it does not exist yet
     * @param partitionIndex: Index of partition to add to
     * @param currKey: Key of partition
     * @param timepointIndex: current timepoint
     * @param row: current row
     */
    addInstance(partitionIndex, currKey, row) {
        let rowIndex = this.grouped[partitionIndex].rows.map(function (e) {
            return e.variable;
        }).indexOf(this.heatmap[row].variable);
        let keyIndex = this.grouped[partitionIndex].rows[rowIndex].counts.map(function (e) {
            return e.key
        }).indexOf(currKey);
        if (keyIndex === -1) {
            this.grouped[partitionIndex].rows[rowIndex].counts.push({
                "key": currKey,
                "value": 1
            })
        }
        else {
            this.grouped[partitionIndex].rows[rowIndex].counts[keyIndex].value += 1;
        }
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
                    else return 0;
                })
            })
        });
        this.rootStore.transitionStore.adaptTransitions(this.globalIndex);
    }

    /**
     * sorts a heatmap timepoint
     * @param variable
     */
    sortHeatmap(variable) {
        const variableIndex = this.rootStore.timepointStore.currentVariables[this.type].map(function (d) {
            return d.variable
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
        let sortOrder;
        if (rowToSort.sorting === 0) {
            sortOrder = 1;
            rowToSort.sorting = 1;
        }
        else {
            sortOrder = rowToSort.sorting * (-1);
            rowToSort.sorting = rowToSort.sorting * (-1);
        }
        this.heatmap[variableIndex] = rowToSort;
        this.heatmapOrder = helper.sort(function (a, b) {
            if (a.value < b.value)
                return -sortOrder;
            if (a.value > b.value)
                return sortOrder;
            if (a.value === undefined && b.value !== undefined) {
                return 1;
            }
            if (a.value !== undefined && b.value === undefined) {
                return -1;
            }
            else {
                if (a.patient < b.patient) {
                    return -1;
                }
                if (a.patient > b.patient) {
                    return 1;
                }
                else return 0;
            }
        }).map(function (d) {
            return d.patient;
        });
    }

    /**
     * resets the primary variable if the removed variable was a primary variable
     * @param variable
     */
    adaptPrimaryVariable(variable) {
        let newVariableIndex = 0;
        if (this.rootStore.timepointStore.currentVariables[this.type].map(function (d) {
                return d.variable
            }).indexOf(variable) === 0) {
            newVariableIndex = 1
        }
        this.primaryVariable = this.rootStore.timepointStore.currentVariables[this.type][newVariableIndex].variable;
    }
}


export default SingleTimepoint;