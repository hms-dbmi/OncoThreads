import {extendObservable} from "mobx";
import SingleTimepoint from "./SingleTimepoint"
import VariableStore from "./VariableStore";

/*
stores information about sample timepoints
 */
class SampleTimepointStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.variableStore = new VariableStore();
        extendObservable(this, {
            timepoints: [],
        });
    }


    /**
     * initialize fields, used after the fist variable is added.
     * @param variableId
     * @param variable
     * @param type
     */
    initialize(variableId, variable, type) {
        this.variableStore.constructor();
        this.variableStore.addOriginalVariable(variableId, variable, type);
        this.timepoints = [];
        for (let i = 0; i < this.rootStore.timepointStructure.length; i++) {
            this.timepoints.push(new SingleTimepoint(this.rootStore, this.variableStore.getById(variableId), this.rootStore.patientsPerTimepoint[i], "sample", i));
        }
        this.rootStore.timepointStore.initialize();
        this.addHeatmapVariable(variableId);
    }

    /**
     * adds variable to heatmap
     * @param variableId
     */
    addHeatmapVariable(variableId) {
        const _self = this;
        let mapper = this.rootStore.sampleMappers[variableId];
        this.rootStore.timepointStructure.forEach(function (d, i) {
            let variableData = [];
            d.forEach(function (f) {
                if(f){
                //console.log(f.patient);
                let value = mapper[f.sample];
                variableData.push({
                    patient: f.patient,
                    value: value
                    
                });
                }
            });
            _self.timepoints[i].heatmap.push({variable: variableId, sorting: 0, data: variableData});
        });
    }


    /**
     * adds variable to sample data
     * 1. Add heatmap sample data
     * 2. Regroup data at timepoints which are grouped
     * @param variableId
     * @param variable
     * @param type
     */
    addVariable(variableId, variable, type) {
        this.variableStore.addOriginalVariable(variableId, variable, type);
        this.addHeatmapVariable(variableId);
        this.rootStore.timepointStore.regroupTimepoints();

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


export default SampleTimepointStore;