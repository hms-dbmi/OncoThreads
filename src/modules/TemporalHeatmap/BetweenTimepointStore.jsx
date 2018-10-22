import {extendObservable} from "mobx";
import SingleTimepoint from "./SingleTimepoint";
import VariableStore from "./VariableStore";


/*
stores information about betweenTimepoint
 */
class BetweenTimepointStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.variableStore = new VariableStore(this, this.rootStore);
        extendObservable(this, {
            timepoints: [],
        });
    }

    initialize() {
        this.rootStore.realTime = false;
        let timepoints = [];
        for (let i = 0; i < this.rootStore.transitionStructure.length; i++) {
            let order;
            if (i < this.rootStore.timepointStructure.length) {
                order = this.rootStore.timepointStore.timepointStores.sample.timepoints[i].heatmapOrder;
            }
            else {
                order = this.rootStore.timepointStore.timepointStores.sample.timepoints[i - 1].heatmapOrder;
            }
            timepoints.push(new SingleTimepoint(this.rootStore, this.rootStore.transitionStructure[i].map(d=>d.patient), "between", i, order));
        }
        this.timepoints = timepoints;
    }

    /**
     * adds variable to heatmap
     * @param mapper
     * @param variableId
     */
    addHeatmapRows(variableId, mapper) {
        if (this.timepoints.length === 0) {
            this.initialize(variableId);
        }
        let timepoints = this.timepoints.slice();
        this.rootStore.transitionStructure.forEach(function (d, i) {
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
            timepoints[i].addRow(variableId, variableData);
        });
        this.timepoints = timepoints;
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

    update() {
        const _self = this;
        this.timepoints = [];
        if (this.variableStore.currentVariables.length > 0) {
            this.initialize(this.variableStore.currentVariables[0].id);
        }
        this.variableStore.getCurrentVariables().forEach(function (d) {
            _self.addHeatmapRows(d.id, d.mapper);
        });
    }


    /**
     * Removes a variable from sample data
     * @param variableId
     */
    removeHeatmapRows(variableId) {
        if (this.variableStore.currentVariables.length > 0) {
            this.timepoints.forEach(d => d.removeRow(variableId));
        }
        else {
            this.timepoints=[];
        }
    }
}


export default BetweenTimepointStore;