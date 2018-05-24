import {extendObservable} from "mobx";
import SingleTimepoint from "./SingleTimepoint";
import VariableStore from "./VariableStore";
import uuidv4 from 'uuid/v4';


/*
stores information about betweenTimepoint
 */
class BetweenTimepointStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.variableStore = new VariableStore();
        extendObservable(this, {
            timepoints: [],
        });
    }
    reset() {
        this.timepoints = [];
        this.variableStore.constructor();
    }
    /**
     * adds variable to heatmap timepointData
     * @param mapper
     * @param variableId
     */
    addHeatmapVariable(mapper, variableId) {
        let timepoints = this.timepoints.slice();
        const _self = this;
        this.rootStore.transitionStructure.forEach(function (d, i) {
            let variableData = [];
            d.forEach(function (f) {
                let value = mapper[i][f];
                variableData.push({
                    patient: f,
                    value: value
                });
            });
            _self.timepoints[i].heatmap.push({variable: variableId, sorting: 0, data: variableData});
        });
        this.timepoints = timepoints;

    }


    /**
     * adds userdefined OR variable to timepoints
     * 1. Add heatmap sample data
     * 2. Regroup data at timepoints which are grouped
     * @param type
     * @param selectedValues
     * @param selectedKey
     * @param name
     */
    addORVariable(type, selectedValues, selectedKey, name) {
        const _self = this;
        // Add original variables to all variables
        selectedValues.forEach(function (d) {
            if (!_self.variableStore.hasVariable(d.id)) {
                _self.variableStore.addToAllVariables(d.id, d.name, "binary")
            }
        });
        // create new Id
        let derivedId = uuidv4();
        // add derived variable
        this.variableStore.addDerivedVariable(derivedId, name, "binary", selectedValues.map(function (d, i) {
            return d.id;
        }), "or", null);
        //initialize if the variable is the first variable to be added
        if (this.timepoints.length === 0) {
            this.rootStore.realTime = false;
            for (let i = 0; i < this.rootStore.transitionStructure.length; i++) {
                this.timepoints.push(new SingleTimepoint(this.rootStore, this.variableStore.getById(derivedId), this.rootStore.transitionStructure[i], "between", i))
            }
            this.rootStore.timepointStore.initialize();
        }
        this.addHeatmapVariable(this.rootStore.getOReventMapping(type, selectedValues, selectedKey), derivedId);
        this.rootStore.timepointStore.regroupTimepoints();
    }

    /**
     *
     * @param variableId
     */
    addTimepointDistance(variableId){
        if(!this.variableStore.hasVariable(variableId)) {
            this.variableStore.addOriginalVariable(variableId, "Timepoint Distance", "NUMBER");
            if (this.timepoints.length === 0) {
                this.rootStore.realTime = false;
                for (let i = 0; i < this.rootStore.transitionStructure.length; i++) {
                    this.timepoints.push(new SingleTimepoint(this.rootStore, this.variableStore.getById(variableId), this.rootStore.transitionStructure[i], "between", i))
                }
                this.rootStore.timepointStore.initialize();
            }
            this.addHeatmapVariable(this.rootStore.timeGapMapping, variableId);
            this.rootStore.timepointStore.regroupTimepoints();
        }
    }


    /**
     * Removes a variable from sample data
     * @param variableId
     */
    removeVariable(variableId) {
        if (this.variableStore.currentVariables.length !== 1) {
            this.timepoints.forEach(function (d) {
                if (d.primaryVariable.id === variableId) {
                    d.adaptPrimaryVariable(variableId);
                }
            });
            const index = this.variableStore.currentVariables.map(function (d) {
                return d.id
            }).indexOf(variableId);
            for (let i = 0; i < this.timepoints.length; i++) {
                this.timepoints[i].heatmap.splice(index, 1);
            }
            this.variableStore.removeVariable(variableId);
            this.rootStore.timepointStore.regroupTimepoints();
        }
        //case: last timepoint variableId was removed
        else {
            this.timepoints = [];
            this.variableStore.constructor();
            this.rootStore.timepointStore.initialize();
        }
    }
}


export default BetweenTimepointStore;