import {extendObservable} from "mobx";
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
            let newTimepoint = new SingleTimepoint(_self.rootStore,  _self.rootStore.timepointStructure[j].map(d => d.patient), "sample", j, order);
            newTimepoint.setName(timepointNames[j]);
            _self.timepoints.push(newTimepoint);
        }
        this.variableStore.getCurrentVariables().forEach(function (d, i) {
            _self.addHeatmapRows(d.id, d.mapper);
        });
    }

    /**
     * adds variable to heatmap
     * @param variableId
     * @param mapper
     */
    addHeatmapRows(variableId, mapper) {
        const _self = this;
        if (this.timepoints.length === 0) {
            for (let i = 0; i < this.rootStore.timepointStructure.length; i++) {
                this.timepoints.push(new SingleTimepoint(this.rootStore, this.rootStore.timepointStructure[i].map(d => d.patient), "sample", i, this.rootStore.patientOrderPerTimepoint));
            }
        }
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
        this.rootStore.globalPrimary = variableId;
    }

    updateHeatmapRows(variableId, mapper, index) {
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
     * Removes a variable from sample data
     * @param variableId
     */
    removeHeatmapRows(variableId) {
        const _self = this;
        let timepoints = this.timepoints.slice();
        timepoints.forEach(d => d.removeRow(variableId));
        this.timepoints = timepoints;
        if (_self.rootStore.globalPrimary === variableId) {
            _self.rootStore.globalPrimary = _self.variableStore.currentVariables[_self.variableStore.currentVariables.length - 1]
        }
    }


}


export default SampleTimepointStore;