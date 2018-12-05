import {extendObservable} from "mobx";
import SingleTimepoint from "./SingleTimepoint"

/*
stores information about sample timepoints
 */
class MultipleTimepointsStore {
    constructor(rootStore, structure, type) {
        this.rootStore = rootStore;
        this.structure = structure;
        this.type = type;
        extendObservable(this, {
            timepoints: this.structure.map((d, i) => new SingleTimepoint(this.rootStore, d.map(d => d.patient), this.type, i, this.rootStore.patientOrderPerTimepoint))
        });
    }

    /**
     * changes timepointStructure
     * @param structure
     * @param order
     */
    updateTimepointStructure(structure, order) {
        this.structure = structure;
        this.timepoints = [];
        const _self = this;
        this.structure.forEach(function (d, i) {
            let tp = new SingleTimepoint(_self.rootStore, d.map(d => d.patient), _self.type, i, order);
            _self.timepoints.push(tp);
        });
    }
    updateNames(names){
        this.timepoints.forEach((d,i)=>d.name=names[i]);
    }
    ungroupAll(){
        this.timepoints.forEach(d=>d.isGrouped=false)
    }

    /**
     * adds rows to heatmaps
     * @param variableId
     * @param mapper
     */
    addHeatmapRows(variableId, mapper) {

        //console.log(variableId);
        //console.log(mapper);

        const _self = this;
        this.structure.forEach(function (d, i) {
            let variableData = [];
            d.forEach(function (f) {
                if (f) {
                    let value = mapper[f.sample];
                    variableData.push({
                        patient: f.patient,
                        value: value,
                        sample: f.sample
                    });
                }
            });
            _self.timepoints[i].addRow(variableId, variableData);
        });
    }

    /**
     * updates the rows at index of the heatmaps
     * @param variableId
     * @param mapper
     * @param index
     */
    updateHeatmapRows(variableId, mapper, index) {
        const _self = this;
        this.structure.forEach(function (d, i) {
            let variableData = [];
            d.forEach(function (f) {
                if (f) {
                    let value = mapper[f.sample];
                    variableData.push({
                        patient: f.patient,
                        value: value,
                        sample: f.sample
                    });
                }
            });
            _self.timepoints[i].updateRow(index, variableId, variableData);
        });
    }

    resortHeatmapRows(order) {
        let timepoints = this.timepoints;
        timepoints.forEach(d => d.resortRows(order));
        this.timepoints = timepoints;
    }

    /**
     * Removes rows from the heatmaps
     * @param variableId
     */
    removeHeatmapRows(variableId) {
        let timepoints = this.timepoints.slice();
        timepoints.forEach(d => d.removeRow(variableId));
        this.timepoints = timepoints;
    }

    /**
     * checks if at least one of the timepoints is grouped
     * @returns {boolean}
     */
    atLeastOneGrouped(startIndex, endIndex) {
        let oneIsGrouped = false;
        for (let i = startIndex; i <= endIndex; i++) {
            if (this.timepoints[i].isGrouped) {
                oneIsGrouped = true;
                break;
            }
        }
        return oneIsGrouped
    }


    /**
     * returns this appropriate function for an action
     * @param action
     * @param variable
     * @param timepoint
     * @param originalTimepoint
     */
    static actionFunction(action, variable, timepoint, originalTimepoint) {
        switch (action) {
            case "PROMOTE":
                timepoint.promote(variable);
                break;
            case "GROUP":
                timepoint.group(variable);
                break;
            case "SORT":
                if (timepoint.localIndex === originalTimepoint.localIndex) {
                    timepoint.sort(variable);
                }
                if (variable !== timepoint.primaryVariableId) {
                    timepoint.promote(variable)
                }
                if (timepoint.isGrouped) {
                    timepoint.sortGroup(variable, originalTimepoint.groupOrder)
                }
                else {
                    timepoint.sortHeatmap(variable, originalTimepoint.heatmapSorting.order)
                }
                break;
            default:
                timepoint.unGroup(variable);
                break;
        }
    }

    /**
     * applies an action to a previous timepoint
     * @param timepointIndex
     * @param variable
     * @param action
     */
    applyActionToPrevious(timepointIndex, variable, action) {
        MultipleTimepointsStore.actionFunction(action, variable, this.timepoints[timepointIndex], this.timepoints[timepointIndex]);
        if (timepointIndex - 1 >= 0) {
            MultipleTimepointsStore.actionFunction(action, variable, this.timepoints[timepointIndex - 1], this.timepoints[timepointIndex]);
        }
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY " + action + " TO PREVIOUS", variable, this.type, timepointIndex);
    }

    /**
     * applies an action to the next timepoint
     * @param timepointIndex
     * @param variable
     * @param action
     */
    applyActionToNext(timepointIndex, variable, action) {
        MultipleTimepointsStore.actionFunction(action, variable, this.timepoints[timepointIndex], this.timepoints[timepointIndex]);
        if (timepointIndex + 1 < this.timepoints.length) {
            MultipleTimepointsStore.actionFunction(action, variable, this.timepoints[timepointIndex + 1], this.timepoints[timepointIndex]);
        }
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY " + action + " TO NEXT", variable, this.type, timepointIndex);
    }

    /**
     * applies an action to all timepoints
     * @param timepointIndex
     * @param variable
     * @param action
     */
    applyActionToAll(timepointIndex, variable, action) {
        const _self = this;
        MultipleTimepointsStore.actionFunction(action, variable, this.timepoints[timepointIndex], this.timepoints[timepointIndex]);
        this.timepoints.forEach(function (d, i) {
            if (d.localIndex !== timepointIndex) {
                MultipleTimepointsStore.actionFunction(action, variable, d, _self.timepoints[timepointIndex]);
            }
        });
        this.rootStore.undoRedoStore.saveTimepointHistory("APPLY " + action + " TO ALL", variable, this.type, timepointIndex);
    }

}


export default MultipleTimepointsStore;