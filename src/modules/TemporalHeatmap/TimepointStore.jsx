import {extendObservable} from "mobx";

/*
stores information about timepoints. Combines betweenTimepoints and sampleTimepoints
 */
class TimepointStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.numberOfPatients = 0;
        this.variableStore = {"sample": null, "between": null};
        extendObservable(this, {
            currentVariables: {"sample": [], "between": []},
            selectedPatients: [],
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
        this.binVariable = this.binVariable.bind(this);
        this.applyGroupingToAll = this.applyGroupingToAll.bind(this);
        this.applyGroupingToPrevious = this.applyGroupingToPrevious.bind(this);
        this.applyGroupingToNext = this.applyGroupingToNext.bind(this);
        this.applyUnGroupingToAll = this.applyUnGroupingToAll.bind(this);
        this.applyUnGroupingToPrevious = this.applyUnGroupingToPrevious.bind(this);
        this.applyUnGroupingToNext = this.applyUnGroupingToNext.bind(this);
        this.applyPromotingToAll = this.applyPromotingToAll.bind(this);
        this.applyPromotingToPrevious = this.applyPromotingToPrevious.bind(this);
        this.applyPromotingToNext = this.applyPromotingToNext.bind(this);

    }


    setNumberOfPatients(numP) {
        this.numberOfPatients = numP;
    }

    addPatientToSelection(patient) {
        this.selectedPatients.push(patient);
    }

    removePatientFromSelection(patient) {
        this.selectedPatients.splice(this.selectedPatients.indexOf(patient), 1);
    }

    /**
     * initializes the datastructures
     */
    initialize() {
        this.timepoints = TimepointStore.combineArrays(this.rootStore.betweenTimepointStore.timepoints, this.rootStore.sampleTimepointStore.timepoints);
        //this.timeline = TimepointStore.combineArrays(this.rootStore.betweenTimepointStore.timeline, this.rootStore.sampleTimepointStore.timeline)
        this.timepoints.forEach(function (d, i) {
            d.globalIndex = i;
        });
        this.variableStore.sample = this.rootStore.sampleTimepointStore.variableStore;
        this.variableStore.between = this.rootStore.betweenTimepointStore.variableStore;
        this.currentVariables.sample = this.variableStore.sample.currentVariables;
        this.currentVariables.between = this.variableStore.between.currentVariables;
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
            for (let i = 0; i < arr2.length; i++) {
                returnArr.push(arr1[i]);
                returnArr.push(arr2[i]);
            }
            returnArr.push(arr1[arr1.length - 1]);
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

    removeVariable(variableId, type) {
        if (type === "sample") {
            this.rootStore.sampleTimepointStore.removeVariable(variableId);
        }
        else {
            this.rootStore.betweenTimepointStore.removeVariable(variableId);
        }
    }


    /**
     * Bins a continuous variable
     * @param newId
     * @param oldId
     * @param bins
     * @param binNames
     * @param type: between or sample
     * @param saveToHistory
     */
    binVariable(newId, oldId, bins, binNames, type, saveToHistory) {
        const _self = this;
        let oldVar = _self.variableStore[type].getById(oldId);
        let variableName = oldVar.name;
        let variableDomain = oldVar.domain;
        _self.variableStore[type].modifyVariable(newId, _self.variableStore[type].getById(oldId).name, "BINNED", oldId, "binning", {
            bins: bins,
            binNames: binNames
        }, variableDomain);
        this.bin(oldId, newId, bins, binNames);
        this.rootStore.undoRedoStore.saveVariableModification("bin", variableName, saveToHistory);
    }

    bin(oldId, newId, bins, binNames) {
        const _self = this;
        this.timepoints.forEach(function (d, i) {
            d.heatmap.forEach(function (f, j) {
                if (f.variable === oldId) {
                    let newData = [];
                    f.data.forEach(function (g) {
                        newData.push({patient: g.patient, value: TimepointStore.getBin(bins, binNames, g.value)})
                    });
                    _self.timepoints[i].heatmap[j].data = newData;
                    f.variable = newId;
                    if (d.primaryVariableId === oldId) {
                        d.setPrimaryVariable(newId);
                    }
                }
            });
        });
    }

    isContinuous(variableId, type) {
        return this.variableStore[type].isContinuous(variableId);
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
        this.rootStore.undoRedoStore.saveTimepointHistory("PROMOTE", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex);

    }

    /**
     * regroups timepoints after binning and applies grouping to current timepoint
     * @param timepointIndex
     * @param variable
     */
    groupBinnedTimepoint(timepointIndex, variable) {
        this.regroupTimepoints();
        this.timepoints[timepointIndex].group(variable);
        this.rootStore.undoRedoStore.saveTimepointHistory("GROUP", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex);
    }

    /**
     * sorts the previous timepoint in the same way as the timepoint at timepointIndex
     * @param timepointIndex
     * @param variable
     */
    applySortingToPrevious(timepointIndex, variable) {
        let heatmapSorting = this.timepoints[timepointIndex].getSortOrder(variable);
        if (heatmapSorting === 0) {
            heatmapSorting = 1
        }
        const groupSorting = this.timepoints[timepointIndex].groupOrder;
        this.timepoints[timepointIndex].sortWithParameters(variable, heatmapSorting, groupSorting);
        if (this.timepoints[timepointIndex].localIndex - 1 >= 0) {
            if (this.timepoints[timepointIndex].type === "sample") {
                this.rootStore.sampleTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex - 1].sortWithParameters(variable, heatmapSorting, groupSorting);
            }
            else {
                this.rootStore.betweenTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex - 1].sortWithParameters(variable, heatmapSorting, groupSorting);

            }
        }
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY SORT TO PREVIOUS", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)
    }

    /**
     * sorts all timepoints in the same way as the timepoint at timepointIndex
     * @param timepointIndex
     * @param variable
     */
    applySortingToAll(timepointIndex, variable) {
        const _self = this;
        let sortOrder = this.timepoints[timepointIndex].getSortOrder(variable);
        if (sortOrder === 0) {
            sortOrder = 1
        }
        if (this.timepoints[timepointIndex].type === "sample") {
            this.rootStore.sampleTimepointStore.timepoints.forEach(function (d) {
                d.sortWithParameters(variable, sortOrder, _self.timepoints[timepointIndex].groupOrder);
            })
        }
        else {
            this.rootStore.betweenTimepointStore.timepoints.forEach(function (d) {
                d.sortWithParameters(variable, sortOrder, _self.timepoints[timepointIndex].groupOrder);
            })
        }
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY SORT TO ALL", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)
    }

    /**
     * sorts the next timepoint in the same way as the timepoint at timepointIndex
     * @param timepointIndex
     * @param variable
     */
    applySortingToNext(timepointIndex, variable) {
        let heatmapSorting = this.timepoints[timepointIndex].getSortOrder(variable);
        if (heatmapSorting === 0) {
            heatmapSorting = 1
        }
        const groupSorting = this.timepoints[timepointIndex].groupOrder;
        this.timepoints[timepointIndex].sortWithParameters(variable, heatmapSorting, groupSorting);
        if (this.timepoints[timepointIndex].type === "sample") {
            if (this.timepoints[timepointIndex].localIndex + 1 < this.rootStore.sampleTimepointStore.timepoints.length) {
                this.rootStore.sampleTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex + 1].sortWithParameters(variable, heatmapSorting, groupSorting);
            }
        }
        else {
            if (this.timepoints[timepointIndex].localIndex + 1 < this.rootStore.betweenTimepointStore.timepoints.length) {
                this.rootStore.betweenTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex + 1].sortWithParameters(variable, heatmapSorting, groupSorting);

            }
        }
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY SORT TO NEXT", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)
    }

    /**
     * applies the patient order of the current timepoint to all the other timepoints
     * @param timepointIndex
     */
    applyPatientOrderToAll(timepointIndex) {
        let sorting = this.timepoints[timepointIndex].heatmapOrder;
        this.timepoints.forEach(function (d) {
            d.heatmapOrder = sorting;
        });
        this.rootStore.undoRedoStore.saveRealignToHistory(this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)
        this.rootStore.visStore.resetTransitionSpace();
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
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY GROUP TO ALL", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)

    }

    isAligned(firstTP, secondTP) {
        if(this.timepoints[firstTP].isGrouped||this.timepoints[secondTP].isGrouped){
            return false;
        }
        for (let i = this.timepoints[firstTP].heatmapOrder.length; i--;) {
            if (this.timepoints[firstTP].heatmapOrder[i] !== this.timepoints[secondTP].heatmapOrder[i])
                return false;
        }

        return true;
    }

    /**
     * sets the grouping of a timepoint to the grouping of the next timepoint of the same type
     * @param timepointIndex
     * @param variable
     */
    applyGroupingToNext(timepointIndex, variable) {
        this.timepoints[timepointIndex].group(variable);
        if (this.timepoints[timepointIndex].type === "sample") {
            if (this.timepoints[timepointIndex].localIndex + 1 < this.rootStore.sampleTimepointStore.timepoints.length) {
                this.rootStore.sampleTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex + 1].group(variable);
            }
        }
        else {
            if (this.timepoints[timepointIndex].localIndex + 1 < this.rootStore.betweenTimepointStore.timepoints.length) {
                this.rootStore.betweenTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex + 1].group(variable);
            }
        }
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY GROUP TO NEXT", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)

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
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY GROUP TO ALL", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)

    }

    /**
     * sets the grouping of a timepoint to the grouping of the previous timepoint of the same type
     * @param timepointIndex
     * @param variable
     */
    applyUnGroupingToPrevious(timepointIndex, variable) {
        this.timepoints[timepointIndex].unGroup(variable);
        if (this.timepoints[timepointIndex].localIndex - 1 >= 0)
            if (this.timepoints[timepointIndex].type === "sample") {
                this.rootStore.sampleTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex - 1].unGroup(variable);
            }
            else {
                this.rootStore.betweenTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex - 1].unGroup(variable);
            }
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY UNGROUP TO PREVIOUS", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)

    }

    /**
     * sets the grouping of a timepoint to the grouping of the next timepoint of the same type
     * @param timepointIndex
     * @param variable
     */
    applyUnGroupingToNext(timepointIndex, variable) {
        this.timepoints[timepointIndex].unGroup(variable);
        if (this.timepoints[timepointIndex].type === "sample") {
            if (this.timepoints[timepointIndex].localIndex + 1 < this.rootStore.sampleTimepointStore.timepoints.length) {
                this.rootStore.sampleTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex + 1].unGroup(variable);
            }
        }
        else {
            if (this.timepoints[timepointIndex].localIndex + 1 < this.rootStore.betweenTimepointStore.timepoints.length) {
                this.rootStore.betweenTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex + 1].unGroup(variable);
            }
        }
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY UNGROUP TO NEXT", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)

    }

    /**
     * Sets the grouping of one timepoint as the grouping for all the other timepoints of the same type
     * @param timepointIndex
     * @param variable
     */
    applyUnGroupingToAll(timepointIndex, variable) {
        if (this.timepoints[timepointIndex].type === "sample") {
            this.rootStore.sampleTimepointStore.timepoints.forEach(function (d, i) {
                d.unGroup(variable);
            })
        }
        else {
            this.rootStore.betweenTimepointStore.timepoints.forEach(function (d, i) {
                d.unGroup(variable);
            })
        }
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY UNGROUP TO ALL", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)

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
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY PROMOTE TO PREVIOUS", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)
    }

    /**
     * sets the primary variable of a timepoint to the primary variable of the next timepoint of the same type
     * @param timepointIndex
     * @param variable
     */
    applyPromotingToNext(timepointIndex, variable) {
        this.timepoints[timepointIndex].promote(variable);
        if (this.timepoints[timepointIndex].type === "sample") {
            if (this.timepoints[timepointIndex].localIndex + 1 < this.rootStore.sampleTimepointStore.timepoints.length) {
                this.rootStore.sampleTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex + 1].promote(variable);
            }
        }
        else {
            if (this.timepoints[timepointIndex].localIndex + 1 < this.rootStore.betweenTimepointStore.timepoints.length) {
                this.rootStore.betweenTimepointStore.timepoints[this.timepoints[timepointIndex].localIndex + 1].promote(variable);
            }
        }
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY PROMOTE TO NEXT", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)

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
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY PROMOTE TO ALL", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)

    }

    /**
     * regroups the timepoints. Used after something is changed (variable is removed/added/declared primary)
     */
    regroupTimepoints() {
        const _self = this;
        this.timepoints.forEach(function (d, i) {
            if (d.isGrouped) {
                d.group(d.primaryVariableId);
                d.sortGroup(d.groupOrder);
                _self.rootStore.transitionStore.adaptTransitions(i);
            }
        })
    }
}


export default TimepointStore;