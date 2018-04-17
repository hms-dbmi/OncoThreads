import {autorun, extendObservable} from "mobx";

/*
stores information about timepoints. Combines betweenTimepoints and sampleTimepoints
 */
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

    /**
     * combines the data of sampleTimepoints and betweenTimepoints
     */
    combineData(){
        this.timepointData=TimepointStore.combineArrays(this.rootStore.betweenTimepointStore.timepointData,this.rootStore.sampleTimepointStore.timepointData);
        this.currentSampleVariables=this.rootStore.sampleTimepointStore.currentVariables;
        this.currentBetweenVariables=this.rootStore.betweenTimepointStore.currentVariables;
    }

    /**
     * initializes the datastructures
     */
    initialize(){
        this.primaryVariables=TimepointStore.combineArrays(this.rootStore.betweenTimepointStore.primaryVariables,this.rootStore.sampleTimepointStore.primaryVariables);
        this.groupOrder=TimepointStore.combineArrays(this.rootStore.betweenTimepointStore.groupOrder,this.rootStore.sampleTimepointStore.groupOrder);
        this.patientsPerTimepoint=TimepointStore.combineArrays(this.rootStore.betweenTimepointStore.patientsPerTimepoint,this.rootStore.sampleTimepointStore.patientsPerTimepoint);
        this.patientOrderPerTimepoint=TimepointStore.combineArrays(this.rootStore.betweenTimepointStore.patientOrderPerTimepoint,this.rootStore.sampleTimepointStore.patientOrderPerTimepoint);
        this.rootStore.transitionStore.initializeTransitions(this.timepointData.length-1,this.patientsPerTimepoint);
    }

    /**
     * combines two arrays. If one of them is empty, returns the non-empty one
     * @param arr1
     * @param arr2
     * @returns {*}
     */
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
    sortTimepoint(timepointIndex,variable){
        //case: the timepoint is grouped
        if (this.groupOrder[timepointIndex].isGrouped) {
            if (this.primaryVariables[timepointIndex] !== variable) {
                this.setPrimaryVariable(timepointIndex, variable);
                this.groupTimepoint(timepointIndex, variable);
            }
            this.sortGroups(timepointIndex, -this.groupOrder[timepointIndex].order);
        }
        //case: the timepoint is not grouped
        else {
            this.setPrimaryVariable(timepointIndex, variable);
            this.sortHeatmapTimepoint(timepointIndex, variable);
        }
    }
    group(timepointIndex,variable){
        this.setPrimaryVariable(timepointIndex, variable);
        this.groupTimepoint(timepointIndex, variable);
        this.sortGroups(timepointIndex, 1);
    }
    applySortingToPrevious(timepointIndex){
        if(timepointIndex-1>=0){
            this.patientOrderPerTimepoint[timepointIndex-1]=this.patientOrderPerTimepoint[timepointIndex];
        }
    }
    applySortingToNext(timepointIndex){
         if(timepointIndex+1<this.timepointData.length){
            this.patientOrderPerTimepoint[timepointIndex+1]=this.patientOrderPerTimepoint[timepointIndex];
        }
    }
    applySortingToAll(timepointIndex){
        let sorting=this.patientOrderPerTimepoint[timepointIndex];
        this.patientOrderPerTimepoint=this.patientOrderPerTimepoint.map(function (d, i) {
            if (i !== timepointIndex) {
                return sorting;
            }
            else {
                return d
            }
        });
    }
      /**
     * ungroupes a timepoint by swapping to the heatmap representation
     * @param timepointIndex
     * @param variable
     */
    unGroup(timepointIndex, variable) {
        this.setIsGrouped(timepointIndex, false);
        this.setPrimaryVariable(timepointIndex, variable);
        this.rootStore.transitionStore.adaptTransitions(timepointIndex);
    }
    promote(timepointIndex,variable){
         this.setPrimaryVariable(timepointIndex, variable);
        if (this.groupOrder[timepointIndex].isGrouped) {
            this.groupTimepoint(timepointIndex, variable);
            this.sortGroups(timepointIndex, this.groupOrder[timepointIndex].order);
        }
    }

    /**
     * regroups the timepoints. Used after something is changed (variable is removed/added/declared primary)
     */
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

    /**
     * declares a variable the primary variable of a timepoint
     * @param timepointIndex
     * @param variable
     */
    setPrimaryVariable(timepointIndex, variable) {
        this.primaryVariables[timepointIndex] = variable
    }

    /**
     * gets the current variables (of a sampleTimepoint or a betweenTimepoint
     * @param timepointIndex
     * @returns {*}
     */
    getCurrentVariables(timepointIndex) {
        let currentVariables;
        if(this.currentBetweenVariables.length===0){
            return this.currentSampleVariables;
        }
        else if(this.currentSampleVariables.length===0){
            return this.currentBetweenVariables;
        }
        if (timepointIndex % 2 === 0) {
            currentVariables = this.currentBetweenVariables;
        }
        else {
            currentVariables = this.currentSampleVariables
        }
        return currentVariables;
    }

    /**
     * computes grouping of variables
     * @param timepointIndex
     * @param variable
     */
    groupTimepoint(timepointIndex, variable) {
        let currentVariables = this.getCurrentVariables(timepointIndex);
        this.timepointData[timepointIndex].group.data = [];
        const variableIndex = currentVariables.map(function (d) {
            return d.variable
        }).indexOf(variable);
        let currPartitionCount = 0;
        for (let i = 0; i < this.timepointData[timepointIndex].heatmap[variableIndex].data.length; i++) {
            const currPartitionKey = this.timepointData[timepointIndex].heatmap[variableIndex].data[i].value;
            let partitionIndex = this.timepointData[timepointIndex].group.data.map(function (e) {
                return e.partition;
            }).indexOf(currPartitionKey);
            if (partitionIndex === -1) {
                let rows = currentVariables.map(function (d) {
                    return {variable: d.variable, type: d.type, counts: []}
                });
                this.timepointData[timepointIndex].group.data.push({partition: currPartitionKey, rows: rows});
                partitionIndex = currPartitionCount;
                currPartitionCount += 1;
            }
            this.addInstance(partitionIndex, currPartitionKey, timepointIndex, variableIndex);
            for (let row = 0; row < this.timepointData[timepointIndex].heatmap.length; row++) {
                if (this.timepointData[timepointIndex].heatmap[row].variable !== variable) {
                    let currSecondary = this.timepointData[timepointIndex].heatmap[row].data[i].value;
                    this.addInstance(partitionIndex, currSecondary, timepointIndex, row);
                }
            }
        }
        this.setIsGrouped(timepointIndex, true);
    }

    /**
     * Adds counts to a partition or creates partition if it does not exist yet
     * @param partitionIndex: Index of partition to add to
     * @param currKey: Key of partition
     * @param timepointIndex: current timepoint
     * @param row: current row
     */
    addInstance(partitionIndex, currKey, timepointIndex, row) {
        let rowIndex = this.timepointData[timepointIndex].group.data[partitionIndex].rows.map(function (e) {
            return e.variable;
        }).indexOf(this.timepointData[timepointIndex].heatmap[row].variable);
        let keyIndex = this.timepointData[timepointIndex].group.data[partitionIndex].rows[rowIndex].counts.map(function (e) {
            return e.key
        }).indexOf(currKey);
        if (keyIndex === -1) {
            this.timepointData[timepointIndex].group.data[partitionIndex].rows[rowIndex].counts.push({
                "key": currKey,
                "value": 1
            })
        }
        else {
            this.timepointData[timepointIndex].group.data[partitionIndex].rows[rowIndex].counts[keyIndex].value += 1;
        }
    }



    /**
     * sorts groups
     * @param timepointIndex
     * @param order: 1 ascending, -1 descending
     */
    sortGroups(timepointIndex, order) {
        this.groupOrder[timepointIndex].order = order;
        this.timepointData[timepointIndex].group.data = this.timepointData[timepointIndex].group.data.sort(function (a, b) {
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
        this.timepointData[timepointIndex].group.data.forEach(function (d) {
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
        this.rootStore.transitionStore.adaptTransitions(timepointIndex);

    }

    /**
     * sorts a heatmap timepoint
     * @param timepointIndex
     * @param variable
     */
    sortHeatmapTimepoint(timepointIndex, variable) {
        let currentVariables = this.getCurrentVariables(timepointIndex);
        const variableIndex = currentVariables.map(function (d) {
            return d.variable
        }).indexOf(variable);
        const rowToSort = this.timepointData[timepointIndex].heatmap[variableIndex];
        let helper = this.patientOrderPerTimepoint[timepointIndex].map(function (d) {
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
        this.timepointData[timepointIndex].heatmap[variableIndex] = rowToSort;
        this.patientOrderPerTimepoint[timepointIndex] = helper.sort(function (a, b) {
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
     * @param type
     */
     adaptPrimaryVariables(variable,type) {
        let currentVariables;
        if(type==="sample"){
            currentVariables=this.currentSampleVariables;
        }
        else{
            currentVariables=this.currentBetweenVariables;
        }
        let newVariableIndex = 0;
        if (currentVariables.map(function (d) {
                return d.variable
            }).indexOf(variable) === 0) {
            newVariableIndex = 1
        }
        this.primaryVariables = this.primaryVariables.map(function (d) {
            if (d === variable) {
                return currentVariables[newVariableIndex].variable;
            }
            else return d;
        });
        console.log(this.primaryVariables);
    }


}


export default TimepointStore;