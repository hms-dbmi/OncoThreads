import {autorun, extendObservable} from "mobx";


class TimepointStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.numberOfTransitions = 0;
        this.numberOfPatients = 0;
        extendObservable(this, {
            currentSampleVariables: [],
            currentBetweenVariables: [],
            timepointData:[],
            primaryVariables:[],
            groupOrder: [],
            patientOrderPerTimepoint: []
        });
        autorun(() => {
            this.combineData();
        });
    }
    combineData(){
        this.timepointData=TimepointStore.combineArrays(this.rootStore.betweenTimepointStore.timepointData,this.rootStore.sampleTimepointStore.timepointData);
        this.currentSampleVariables=this.rootStore.sampleTimepointStore.currentVariables;
        this.currentBetweenVariables=this.rootStore.betweenTimepointStore.currentVariables;
    }
    initialize(){
        this.primaryVariables=TimepointStore.combineArrays(this.rootStore.betweenTimepointStore.primaryVariables,this.rootStore.sampleTimepointStore.primaryVariables);
        this.groupOrder=TimepointStore.combineArrays(this.rootStore.betweenTimepointStore.groupOrder,this.rootStore.sampleTimepointStore.groupOrder);
        this.patientsPerTimepoint=TimepointStore.combineArrays(this.rootStore.betweenTimepointStore.patientsPerTimepoint,this.rootStore.sampleTimepointStore.patientsPerTimepoint);
        this.patientOrderPerTimepoint=TimepointStore.combineArrays(this.rootStore.betweenTimepointStore.patientOrderPerTimepoint,this.rootStore.sampleTimepointStore.patientOrderPerTimepoint);
        this.rootStore.transitionStore.initializeTransitions(this.timepointData.length-1,this.patientsPerTimepoint);
    }
    static combineArrays(arr1, arr2) {
        if(arr1.length===0){
            return(arr2);
        }
        else if(arr2.length===0){
            return(arr1);
        }
        else {
            let returnArr = [];
            for (let i = 0; i < arr1.length; i++) {
                returnArr.push(arr1[i]);
                returnArr.push(arr2[i]);
            }
            return returnArr;
        }
    }

    setNumberOfTimepoints(numTP) {
        this.numberOfTransitions = numTP;
    }

    setNumberOfPatients(numP) {
        this.numberOfPatients = numP;
    }
    setIsGrouped(timepoint, boolean) {
        let isGrouped = this.groupOrder.slice();
        isGrouped[timepoint].isGrouped = boolean;
        this.groupOrder = isGrouped;
    }


    regroupTimepoints() {
        const _self = this;
        this.groupOrder.forEach(function (d, i) {
            if (d.isGrouped) {
                _self.groupTimepoint(i, _self.primaryVariables[i]);
                _self.sortGroups(i, d.order);
                _self.rootStore.transitionStore.adaptTransitions(i);
            }
        })
    }

    setPrimaryVariable(timepoint, variable) {
        this.primaryVariables[timepoint] = variable
    }

    getCurrentVariables(timepoint) {
        let currentVariables;
        if(this.currentBetweenVariables.length===0){
            return this.currentSampleVariables;
        }
        else if(this.currentSampleVariables.length===0){
            return this.currentBetweenVariables;
        }
        if (timepoint % 2 === 0) {
            currentVariables = this.currentBetweenVariables;
        }
        else {
            currentVariables = this.currentSampleVariables
        }
        return currentVariables;
    }

    /**
     * computes grouping of variables
     * @param timepoint
     * @param variable
     */
    groupTimepoint(timepoint, variable) {
        let currentVariables = this.getCurrentVariables(timepoint);
        this.timepointData[timepoint].group.data = [];
        const variableIndex = currentVariables.map(function (d) {
            return d.variable
        }).indexOf(variable);
        let currPartitionCount = 0;
        for (let i = 0; i < this.timepointData[timepoint].heatmap[variableIndex].data.length; i++) {
            const currPartitionKey = this.timepointData[timepoint].heatmap[variableIndex].data[i].value;
            let partitionIndex = this.timepointData[timepoint].group.data.map(function (e) {
                return e.partition;
            }).indexOf(currPartitionKey);
            if (partitionIndex === -1) {
                let rows = currentVariables.map(function (d) {
                    return {variable: d.variable, type: d.type, counts: []}
                });
                this.timepointData[timepoint].group.data.push({partition: currPartitionKey, rows: rows});
                partitionIndex = currPartitionCount;
                currPartitionCount += 1;
            }
            this.addInstance(partitionIndex, currPartitionKey, timepoint, variableIndex);
            for (let row = 0; row < this.timepointData[timepoint].heatmap.length; row++) {
                if (this.timepointData[timepoint].heatmap[row].variable !== variable) {
                    let currSecondary = this.timepointData[timepoint].heatmap[row].data[i].value;
                    this.addInstance(partitionIndex, currSecondary, timepoint, row);
                }
            }
        }
        this.setIsGrouped(timepoint, true);
    }

    /**
     * Adds counts to a partition or creates partition if it does not exist yet
     * @param partitionIndex: Index of partition to add to
     * @param currKey: Key of partition
     * @param timepoint: current timepoint
     * @param row: current row
     */
    addInstance(partitionIndex, currKey, timepoint, row) {
        let rowIndex = this.timepointData[timepoint].group.data[partitionIndex].rows.map(function (e) {
            return e.variable;
        }).indexOf(this.timepointData[timepoint].heatmap[row].variable);
        let keyIndex = this.timepointData[timepoint].group.data[partitionIndex].rows[rowIndex].counts.map(function (e) {
            return e.key
        }).indexOf(currKey);
        if (keyIndex === -1) {
            this.timepointData[timepoint].group.data[partitionIndex].rows[rowIndex].counts.push({
                "key": currKey,
                "value": 1
            })
        }
        else {
            this.timepointData[timepoint].group.data[partitionIndex].rows[rowIndex].counts[keyIndex].value += 1;
        }
    }

    /**
     * ungroupes a timepoint by swapping to the heatmap representation
     * @param timepoint
     * @param variable
     */
    unGroupTimepoint(timepoint, variable) {
        this.setIsGrouped(timepoint, false);
        this.setPrimaryVariable(timepoint, variable);
        this.rootStore.transitionStore.adaptTransitions(timepoint);
    }

    /**
     * sorts groups
     * @param timepoint
     * @param order
     */
    sortGroups(timepoint, order) {
        this.groupOrder[timepoint].order = order;
        this.timepointData[timepoint].group.data = this.timepointData[timepoint].group.data.sort(function (a, b) {
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
        this.timepointData[timepoint].group.data.forEach(function (d) {
            d.rows.forEach(function (f, j) {
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
        this.rootStore.transitionStore.adaptTransitions(timepoint);

    }

    /**
     * sorts a heatmap timepoint
     * @param timepoint
     * @param variable
     */
    sortHeatmapTimepoint(timepoint, variable) {
        let currentVariables = this.getCurrentVariables(timepoint);
        const variableIndex = currentVariables.map(function (d) {
            return d.variable
        }).indexOf(variable);
        const rowToSort = this.timepointData[timepoint].heatmap[variableIndex];
        let helper = this.patientOrderPerTimepoint[timepoint].map(function (d) {
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
        this.timepointData[timepoint].heatmap[variableIndex] = rowToSort;
        this.patientOrderPerTimepoint[timepoint] = helper.sort(function (a, b) {
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


}


export default TimepointStore;