import {extendObservable} from "mobx";

/*
stores information about timepoints. Combines betweenTimepoints and sampleTimepoints
 */
class TimepointStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.numberOfPatients = 0;
        extendObservable(this, {
            currentVariables: {"sample": [], "between": []},
            timepoints: [],
            get maxPartitions() {
                let max = 0;
                const _self = this;
                this.timepoints.forEach(function (d, i) {
                    if (d.isGrouped) {
                        if (_self.timepoints[i].grouped.length > max) {
                            max = _self.timepoints[i].grouped.length;
                        }
                    }
                });
                return max;
            }
        });

        this.groupBinnedTimepoint = this.groupBinnedTimepoint.bind(this);
        this.promoteBinnedTimepoint = this.promoteBinnedTimepoint.bind(this);
        this.binContinuous = this.binContinuous.bind(this);
        this.applyGroupingToAll = this.applyGroupingToAll.bind(this);
        this.applyGroupingToPrevious = this.applyGroupingToPrevious.bind(this);
        this.applyGroupingToNext = this.applyGroupingToNext.bind(this);
        this.applyPromotingToAll = this.applyPromotingToAll.bind(this);
        this.applyPromotingToPrevious = this.applyPromotingToPrevious.bind(this);
        this.applyPromotingToNext = this.applyPromotingToNext.bind(this);

    }


    setNumberOfPatients(numP) {
        this.numberOfPatients = numP;
    }

    /**
     * initializes the datastructures
     */
    initialize() {
        this.timepoints = TimepointStore.combineArrays(this.rootStore.betweenTimepointStore.timepoints, this.rootStore.sampleTimepointStore.timepoints);
        this.timepoints.forEach(function (d, i) {
            d.globalIndex = i;
        });
        this.currentVariables.sample = this.rootStore.sampleTimepointStore.currentVariables;
        this.currentVariables.between = this.rootStore.betweenTimepointStore.currentVariables;
        this.rootStore.transitionStore.initializeTransitions(this.timepoints.length - 1);
    }


    /**
     * combines two arrays. If one of them is empty, returns the non-empty one
     * @param arr1
     * @param arr2
     * @returns {*}
     */
    static combineArrays(arr1, arr2) {
        if (arr1.length === 0) {
            return (arr2);
        }
        else if (arr2.length === 0) {
            return (arr1);
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

    /**
     * gets all values of a variable, indepently of their timepoint
     * @param variable
     * @returns {Array}
     */
    getAllValues(variable) {
        let allValues = [];
        this.timepoints.forEach(function (d) {
            d.heatmap.forEach(function (f) {
                if (f.variable === variable) {
                    f.data.forEach(function (g) {
                        allValues.push(g.value)
                    })
                }
            });
        });
        return allValues;
    }
    removeVariable(variable,type){
        if(type==="sample"){
            this.rootStore.sampleTimepointStore.removeVariable(variable);
        }
        else{
            this.rootStore.betweenTimepointStore.removeVariable(variable);
        }
    }
    /**
     * checks if a variable is continuous
     * @param variable
     * @param type
     * @returns {boolean}
     */
    isContinuous(variable, type) {
        return this.currentVariables[type].filter(function (d) {
            return d.variable === variable;
        })[0].type === "NUMBER";
    }

    /**
     * Bins a continuous variable
     * @param variable
     * @param bins
     * @param binNames
     * @param type: between or sample
     */
    binContinuous(variable, bins, binNames, type) {
        const _self = this;
        this.currentVariables[type].forEach(function (d, i) {
            if (d.variable === variable) {
                _self.currentVariables[type][i].type = "BINNED";
            }
        });
        this.timepoints.forEach(function (d, i) {
            d.heatmap.forEach(function (f, j) {
                if (f.variable === variable) {
                    let newData = [];
                    f.data.forEach(function (g) {
                        newData.push({patient: g.patient, value: TimepointStore.getBin(bins, binNames, g.value)})
                    });
                    _self.timepoints[i].heatmap[j].data = newData;
                }
            });
        });
    }

    /**
     * gets a bin corresponding to value and returns the name of the bin
     * @param bins
     * @param binNames
     * @param value
     * @returns name of bin
     */
    static getBin(bins, binNames, value) {
        for (let i = 1; i < bins.length; i++) {
            if (value > bins[i - 1] && value <= bins[i]) {
                return binNames[i - 1];
            }
        }
    }

    /**
     * regroups timepoints after binning and applies promotion to current timepoint
     * @param timepointIndex
     * @param variable
     */
    promoteBinnedTimepoint(timepointIndex, variable) {
        this.regroupTimepoints();
        this.timepoints[timepointIndex].promote(variable);
    }

    /**
     * regroups timepoints after binning and applies grouping to current timepoint
     * @param timepointIndex
     * @param variable
     */
    groupBinnedTimepoint(timepointIndex, variable) {
        this.regroupTimepoints();
        this.timepoints[timepointIndex].group(variable);
    }

    /**
     * sorts the previous timepoint in the same way as the timepoint at timepointIndex
     * @param timepointIndex
     */
    applySortingToPrevious(timepointIndex) {
        if (timepointIndex - 1 >= 0) {
            this.timepoints[timepointIndex - 1].heatmapOrder = this.timepoints[timepointIndex].heatmapOrder;
        }
    }

    /**
     * sorts the next timepoint in the same way as the timepoint at timepointIndex
     * @param timepointIndex
     */
    applySortingToNext(timepointIndex) {
        if (timepointIndex + 1 < this.timepoints.length) {
            this.timepoints[timepointIndex + 1].heatmapOrder = this.timepoints[timepointIndex].heatmapOrder;
        }
    }

    /**
     * sorts all timepoints in the same way as the timepoint at timepointIndex
     * @param timepointIndex
     */
    applySortingToAll(timepointIndex) {
        let sorting = this.timepoints[timepointIndex].heatmapOrder;
        this.timepoints.forEach(function (d) {
            d.heatmapOrder = sorting;
        });
    }

    /**
     * sets the grouping of a timepoint to the grouping of the previous timepoint of the same type
     * @param timepointIndex
     * @param variable
     */
    applyGroupingToPrevious(timepointIndex, variable) {
        this.timepoints[timepointIndex].group(variable);
        if (this.timepoints[timepointIndex].localIndex - 1 >= 0)
            if (this.timepoints[timepointIndex].type === "sample") {
                this.rootStore.sampleTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex - 1].group(variable);
            }
            else {
                this.rootStore.betweenTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex - 1].group(variable);
            }
    }

    /**
     * sets the grouping of a timepoint to the grouping of the next timepoint of the same type
     * @param timepointIndex
     * @param variable
     */
    applyGroupingToNext(timepointIndex, variable) {
        this.timepoints[timepointIndex].group(variable);
        if (this.timepoints[timepointIndex].localIndex + 1 < this.currentVariables[this.timepoints[timepointIndex].type].length)
            if (this.timepoints[timepointIndex].type === "sample") {
                this.rootStore.sampleTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex + 1].group(variable);
            }
            else {
                this.rootStore.betweenTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex + 1].group(variable);
            }
    }

    /**
     * Sets the grouping of one timepoint as the grouping for all the other timepoints of the same type
     * @param timepointIndex
     * @param variable
     */
    applyGroupingToAll(timepointIndex, variable) {
        if (this.timepoints[timepointIndex].type === "sample") {
            this.rootStore.sampleTimepointStore.timepoints.forEach(function (d, i) {
                d.group(variable);
            })
        }
        else {
            this.rootStore.betweenTimepointStore.timepoints.forEach(function (d, i) {
                d.group(variable);
            })
        }
    }

    /**
     * sets the primary variable of a timepoint to the primary variable of the previous timepoint of the same type
     * @param timepointIndex
     * @param variable
     */
    applyPromotingToPrevious(timepointIndex, variable) {
        this.timepoints[timepointIndex].promote(variable);
        if (this.timepoints[timepointIndex].localIndex - 1 >= 0)
            if (this.timepoints[timepointIndex].type === "sample") {
                this.rootStore.sampleTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex - 1].promote(variable);
            }
            else {
                this.rootStore.betweenTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex - 1].promote(variable);
            }
    }

    /**
     * sets the primary variable of a timepoint to the primary variable of the next timepoint of the same type
     * @param timepointIndex
     * @param variable
     */
    applyPromotingToNext(timepointIndex, variable) {
        this.timepoints[timepointIndex].promote(variable);
        if (this.timepoints[timepointIndex].localIndex + 1 < this.currentVariables[this.timepoints[timepointIndex].type].length)
            if (this.timepoints[timepointIndex].type === "sample") {
                this.rootStore.sampleTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex + 1].promote(variable);
            }
            else {
                this.rootStore.betweenTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex + 1].promote(variable);
            }
    }

    /**
     * Sets the primary variable of one timepoint as the primary variable for all the other timepoints of the same type
     * @param timepointIndex
     * @param variable
     */
    applyPromotingToAll(timepointIndex, variable) {
        if (this.timepoints[timepointIndex].type === "sample") {
            this.rootStore.sampleTimepointStore.timepoints.forEach(function (d) {
                d.promote(variable);
            })
        }
        else {
            this.rootStore.betweenTimepointStore.timepoints.forEach(function (d) {
                d.promote(variable);
            })
        }
    }

    /**
     * regroups the timepoints. Used after something is changed (variable is removed/added/declared primary)
     */
    regroupTimepoints() {
        const _self = this;
        this.timepoints.forEach(function (d, i) {
            if (d.isGrouped) {
                d.group(d.primaryVariable);
                d.sortGroup(d.groupOrder);
                _self.rootStore.transitionStore.adaptTransitions(i);
            }
        })
    }
}


export default TimepointStore;