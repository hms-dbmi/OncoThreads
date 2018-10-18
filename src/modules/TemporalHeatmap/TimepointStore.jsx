import {extendObservable, reaction} from "mobx";
import uuidv4 from "uuid/v4";
import SampleTimepointStore from "./SampleTimepointStore";
import BetweenTimepointStore from "./BetweenTimepointStore";

/*
stores information about timepoints. Combines betweenTimepoints and sampleTimepoints
 */
class TimepointStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.numberOfPatients = 0;
        this.variableStore = {"sample": null, "between": null};
        this.timepointStores = {
            "sample": new SampleTimepointStore(rootStore),
            "between": new BetweenTimepointStore(rootStore)
        };
        extendObservable(this, {
            currentVariables: {"sample": [], "between": []},
            selectedPatients: [],
            timepoints: [],
            continuousRepresentation: 'gradient',
            realTime: false,
            globalTime: false,
            transitionOn: false,
            advancedSelection: true,
            showUndefined: true,
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
            },

        });
        reaction(
            () => this.timepoints.map(tp => tp.heatmap.length),
            length => rootStore.visStore.fitToScreenHeight());
        this.binVariable = this.binVariable.bind(this);
        this.applyActionToAll = this.applyActionToAll.bind(this);
        this.applyActionToPrevious = this.applyActionToPrevious.bind(this);
        this.applyActionToNext = this.applyActionToNext.bind(this);
        this.regroupTimepoints = this.regroupTimepoints.bind(this);

    }


    setNumberOfPatients(numP) {
        this.numberOfPatients = numP;
    }

    addPatientToSelection(patient) {
        let selected = this.selectedPatients.slice();
        selected.push(patient);
        this.selectedPatients = selected;
    }

    removePatientFromSelection(patient) {
        let selected = this.selectedPatients.slice();
        selected.splice(this.selectedPatients.indexOf(patient), 1);
        this.selectedPatients = selected;
    }

    /**
     * initializes the datastructures
     */
    initialize() {
        this.timepointStores.between.reset();
        this.timepointStores.sample.initialize(this.rootStore.clinicalSampleCategories[0].id, this.rootStore.clinicalSampleCategories[0].variable, this.rootStore.clinicalSampleCategories[0].datatype, "clinical", this.rootStore.patientOrderPerTimepoint)
        this.timepoints = TimepointStore.combineArrays(this.timepointStores.between.timepoints, this.timepointStores.sample.timepoints);
        this.timepoints.forEach(function (d, i) {
            d.globalIndex = i;
        });
        this.variableStore.sample = this.timepointStores.sample.variableStore;
        this.variableStore.between = this.timepointStores.between.variableStore;
        this.currentVariables.sample = this.variableStore.sample.currentVariables;
        this.currentVariables.between = this.variableStore.between.currentVariables;
        this.rootStore.transitionStore.initializeTransitions(this.timepoints.length - 1);
    }

    update(order,names) {
        this.timepointStores.sample.update(order,names);
        this.timepointStores.between.update();
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
     * @param type
     * @returns {Array}
     */
    getAllValues(variable, type) {
        let allValues = [];
        let mapper = this.variableStore[type].getByIdAllVariables(variable).mapper;
        for (let sample in mapper) {
            allValues.push(mapper[sample]);
        }
        return allValues;
    }

    removeVariable(variableId, type) {
        this.timepointStores[type].removeVariable(variableId);
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
        let oldVar = _self.variableStore[type].getByIdAllVariables(oldId);
        let variableName = oldVar.name;
        let variableDomain = oldVar.domain;
        let binnedMapper = this.rootStore.createBinnedMapper(oldVar.mapper, bins, binNames);
        if (!saveToHistory) {
            _self.variableStore[type].modifyVariable(newId, oldVar.name + "_BINNED", "BINNED", oldVar.description + " (binned)", oldId, "binning", {
                bins: bins,
                binNames: binNames
            }, variableDomain, [], binnedMapper);
            this.updateValues(oldId, newId, binnedMapper);
        }
        else {
            _self.variableStore[type].addDerivedVariable(newId, oldVar.name + "_BINNED", "BINNED", oldVar.description + " (binned)", [oldId], "binning", {
                bins: bins,
                binNames: binNames
            }, binnedMapper);
            this.timepointStores[type].addHeatmapVariable(newId, binnedMapper);
        }
        this.regroupTimepoints();
        this.rootStore.undoRedoStore.saveVariableModification("updateValues", variableName, saveToHistory);
    }

    binaryCombineVariables(ids, name, type, operator) {
        let derivedId = uuidv4();
        const _self = this;
        let mappers = ids.map(d => this.variableStore[type].getByIdAllVariables(d).mapper);
        let description = "";
        ids.forEach(function (f, i) {
            if (description !== "") {
                description += " -" + operator + "- ";
            }
            description += _self.variableStore[type].getByIdAllVariables(f).name;
        });
        let combinedMapper = this.rootStore.createBinaryCombinedMapper(mappers, operator);
        this.variableStore[type].addDerivedVariable(derivedId, name, "binary", description, ids, operator, null, combinedMapper);
        this.timepointStores[type].addHeatmapVariable(derivedId, combinedMapper);
        this.regroupTimepoints();
    }

    updateValues(oldId, newId, mapper) {
        const _self = this;
        this.timepoints.forEach(function (d, i) {
            d.heatmap.forEach(function (f, j) {
                if (f.variable === oldId) {
                    let newData = [];
                    f.data.forEach(function (g) {
                        newData.push({patient: g.patient, value: mapper[g.sample]})
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
     * sorts the previous timepoint in the same way as the timepoint at timepointIndex
     * @param timepointIndex
     * @param variable
     */
    applySortingToPrevious(timepointIndex, variable) {
        let sortOrder = this.timepoints[timepointIndex].getSortOrder(variable);
        if (this.timepoints[timepointIndex].primaryVariableId !== variable || sortOrder === 0) {
            if (sortOrder === 0) {
                sortOrder = 1;
            }
            this.timepoints[timepointIndex].sort(variable, sortOrder);
        }
        let sortOrders = [];
        const _self = this;
        this.timepoints[timepointIndex].variableSortOrder.forEach(function (d, i) {
            sortOrders.push(_self.timepoints[timepointIndex].getSortOrder(d));
        });
        const groupSorting = this.timepoints[timepointIndex].groupOrder;
        if (this.timepoints[timepointIndex].localIndex - 1 >= 0) {
            this.timepointStores[this.timepoints[timepointIndex].type].timepoints[this.timepoints[timepointIndex].localIndex - 1].sortWithParameters(this.timepoints[timepointIndex].variableSortOrder, sortOrders, groupSorting);
        }
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY SORT TO PREVIOUS", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)
    }

    /**
     * sorts all timepoints in the same way as the timepoint at timepointIndex
     * @param timepointIndex
     * @param variable
     */
    applySortingToAll(timepointIndex, variable) {
        let sortOrder = this.timepoints[timepointIndex].getSortOrder(variable);
        if (this.timepoints[timepointIndex].primaryVariableId !== variable || sortOrder === 0) {
            if (sortOrder === 0) {
                sortOrder = 1;
            }
            this.timepoints[timepointIndex].sort(variable, sortOrder);
        }
        const _self = this;
        let sortOrders = [];
        _self.timepoints[timepointIndex].variableSortOrder.forEach(function (d) {
            sortOrders.push(_self.timepoints[timepointIndex].getSortOrder(d));
        });
        this.timepointStores[this.timepoints[timepointIndex].type].timepoints.forEach(function (d) {
            d.sortWithParameters(_self.timepoints[timepointIndex].variableSortOrder, sortOrders, _self.timepoints[timepointIndex].groupOrder);
        });
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY SORT TO ALL", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)
    }

    /**
     * sorts the next timepoint in the same way as the timepoint at timepointIndex
     * @param timepointIndex
     * @param variable
     */
    applySortingToNext(timepointIndex, variable) {
        let sortOrder = this.timepoints[timepointIndex].getSortOrder(variable);
        if (this.timepoints[timepointIndex].primaryVariableId !== variable || sortOrder === 0) {
            if (sortOrder === 0) {
                sortOrder = 1;
            }
            this.timepoints[timepointIndex].sort(variable, sortOrder);
        }
        let sortOrders = [];
        const _self = this;
        this.timepoints[timepointIndex].variableSortOrder.forEach(function (d, i) {
            sortOrders.push(_self.timepoints[timepointIndex].getSortOrder(d));
        });
        const groupSorting = this.timepoints[timepointIndex].groupOrder;
        if (this.timepoints[timepointIndex].localIndex + 1 < this.timepointStores[this.timepoints[timepointIndex].type].timepoints.length) {
            this.timepointStores[this.timepoints[timepointIndex].type].timepoints[this.timepoints[timepointIndex].localIndex + 1].sortWithParameters(this.timepoints[timepointIndex].variableSortOrder, sortOrders, groupSorting);
        }
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY SORT TO NEXT", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)
    }

    static actionFunction(action, variable, timepoint) {
        switch (action) {
            case "PROMOTE":
                timepoint.promote(variable);
                break;
            case "GROUP":
                timepoint.group(variable);
                break;
            case "UNGROUP":
                timepoint.unGroup(variable);
                break;
        }
    }

    applyActionToPrevious(timepointIndex, variable, action) {
        TimepointStore.actionFunction(action, variable, this.timepoints[timepointIndex]);
        if (this.timepoints[timepointIndex].localIndex - 1 >= 0) {
            TimepointStore.actionFunction(action, variable, this.timepointStores[this.timepoints[timepointIndex].type].timepoints[this.timepoints[timepointIndex].localIndex - 1]);
        }
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY " + action + " TO ALL", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)
    }

    applyActionToNext(timepointIndex, variable, action) {
        TimepointStore.actionFunction(action, variable, this.timepoints[timepointIndex]);
        if (this.timepoints[timepointIndex].localIndex + 1 < this.timepointStores[this.timepoints[timepointIndex].type].timepoints.length) {
            TimepointStore.actionFunction(action, variable, this.timepointStores[this.timepoints[timepointIndex].type].timepoints[this.timepoints[timepointIndex].localIndex + 1]);
        }
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY " + action + " TO NEXT", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)
    }

    applyActionToAll(timepointIndex, variable, action) {
        const _self = this;
        this.timepointStores[this.timepoints[timepointIndex].type].timepoints.forEach(function (d, i) {
            TimepointStore.actionFunction(action, variable, d);
        });
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY " + action + " TO ALL", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)

    }

    /**
     * applies the patient order of the current timepoint to all the other timepoints
     * @param timepointIndex
     */
    applyPatientOrderToAll(timepointIndex, saveRealign) {
        let sorting = this.timepoints[timepointIndex].heatmapOrder;
        this.timepoints.forEach(function (d) {
            d.heatmapOrder = sorting;
        });
        if (saveRealign) {
            this.rootStore.undoRedoStore.saveRealignToHistory(this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)
        }
        //this.rootStore.visStore.resetTransitionSpace();
    }


    magicSort(timepointIndex, variable) {
        let currVar = this.currentVariables[this.timepoints[timepointIndex].type];
        for (let i = 0; i < currVar.length; i++) {
            this.timepoints[timepointIndex].sort(currVar[i].id);
            if (currVar[i].id === variable) {
                break;
            }
        }
        this.applyPatientOrderToAll(timepointIndex, false);
        this.rootStore.undoRedoStore.saveTimepointHistory("MAGICSORT", variable, this.timepoints[timepointIndex].type, this.timepoints[timepointIndex].localIndex)
    }

    isAligned(firstTP, secondTP) {
        if (this.timepoints[firstTP].isGrouped || this.timepoints[secondTP].isGrouped) {
            return false;
        }
        for (let i = this.timepoints[firstTP].heatmapOrder.length; i--;) {
            if (this.timepoints[firstTP].heatmapOrder[i] !== this.timepoints[secondTP].heatmapOrder[i])
                return false;
        }

        return true;
    }

    atLeastOneGrouped(type) {
        let timepoints = this.timepointStores[type].timepoints;
        let oneIsGrouped = false;
        for (let i = 0; i < timepoints.length; i++) {
            if (!timepoints[i].isGrouped) {
                oneIsGrouped = true;
                break;
            }
        }
        return oneIsGrouped
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