import {extendObservable, toJS} from "mobx";
import SingleTimepoint from "./SingleTimepoint"
import VariableStore from "./VariableStore";

/*
stores information about sample timepoints
 */
class SampleTimepointStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.variableStore = new VariableStore(this,this.rootStore);
        extendObservable(this, {
            timepoints: [],
        });
    }


    update(order, timepointNames) {
        this.timepoints = [];
        const _self = this;
        for (let j = 0; j < _self.rootStore.timepointStructure.length; j++) {
            let newTimepoint = new SingleTimepoint(_self.rootStore, this.variableStore.currentVariables[0], _self.rootStore.timepointStructure[j].map(d => d.patient), "sample", j, order);
            newTimepoint.setName(timepointNames[j]);
            _self.timepoints.push(newTimepoint);
        }
        this.variableStore.getCurrentVariables().forEach(function (d, i) {
            _self.addHeatmapVariable(d.id, d.mapper);
        });
    }

    /**
     * adds variable to heatmap
     * @param variableId
     * @param mapper
     */
    addHeatmapVariable(variableId, mapper) {
        const _self = this;
        this.rootStore.timepointStructure.forEach(function (d, i) {
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
        this.rootStore.timepointStore.regroupTimepoints();
        this.rootStore.globalPrimary = variableId;
    }

    updateVariable(variableId, mapper, index) {
        const _self = this;
        this.rootStore.timepointStructure.forEach(function (d, i) {
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


    /**
     * adds variable to sample data
     * 1. Add heatmap sample data
     * 2. Regroup data at timepoints which are grouped
     * @param variableId
     * @param variable
     * @param type
     * @param description
     * @param display
     */
    addVariable(variableId, variable, type, description, display) {
        if (this.timepoints.length === 0) {
            for (let i = 0; i < this.rootStore.timepointStructure.length; i++) {
                this.timepoints.push(new SingleTimepoint(this.rootStore, variableId, this.rootStore.timepointStructure[i].map(d => d.patient), "sample", i, this.rootStore.patientOrderPerTimepoint));
            }
        }
        let mapper = this.rootStore.sampleMappers[variableId];
        this.variableStore.addOriginalVariable(variableId, variable, type, description, [], mapper, display);
    }


    /**
     * Removes a variable from sample data
     * @param variableId
     */
    removeVariable(variableId) {
        const _self = this;
        let timepoints = this.timepoints.slice();
        timepoints.forEach(d => d.removeRow(variableId));
        this.timepoints = timepoints;
        this.rootStore.timepointStore.regroupTimepoints();
        if (_self.rootStore.globalPrimary === variableId) {
            _self.rootStore.globalPrimary = _self.variableStore.currentVariables[_self.variableStore.currentVariables.length - 1]
        }
    }


}


export default SampleTimepointStore;