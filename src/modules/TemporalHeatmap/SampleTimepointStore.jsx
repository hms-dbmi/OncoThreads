import {extendObservable} from "mobx";
import SingleTimepoint from "./SingleTimepoint"
import VariableStore from "./VariableStore";
import RootStore from "../RootStore";

/*
stores information about sample timepoints
 */
class SampleTimepointStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.variableStore = new VariableStore(rootStore);
        extendObservable(this, {
            timepoints: [],
        });
    }


    /**
     * initialize fields, used after the fist variable is added.
     * @param variableId
     * @param variable
     * @param type
     * @param description
     */
    initialize(variableId, variable, type, description) {
        this.rootStore.visStore.resetTransitionSpace();
        this.variableStore.constructor(this.rootStore);
        if (type === "NUMBER") {
            let minMax = RootStore.getMinMaxOfContinuous(this.rootStore.sampleMappers[variableId], "sample");
            this.variableStore.addOriginalVariable(variableId, variable, type, description, minMax);
        }
        else {
            this.variableStore.addOriginalVariable(variableId, variable, type, description, []);
        }
        this.timepoints = [];
        for (let i = 0; i < this.rootStore.timepointStructure.length; i++) {
            this.timepoints.push(new SingleTimepoint(this.rootStore, variableId, this.rootStore.timepointStructure[i].map(d => d.patient), "sample", i, this.rootStore.patientOrderPerTimepoint));
        }
        this.rootStore.timepointStore.initialize();
        this.addHeatmapVariable(variableId);
    }

    update(order) {
        this.timepoints = [];
        const _self = this;
        for (let j = 0; j < _self.rootStore.timepointStructure.length; j++) {
            _self.timepoints.push(new SingleTimepoint(_self.rootStore, this.variableStore.currentVariables[0].id, _self.rootStore.timepointStructure[j].map(d => d.patient), "sample", j, order));
        }
        _self.rootStore.timepointStore.initialize();
        this.variableStore.currentVariables.forEach(function (d, i) {
            if (!d.derived) {
                _self.addHeatmapVariable(d.id);
            }
            else {
                if (d.modificationType === "binning") {
                    _self.addHeatmapVariable(d.originalIds[0]);
                    _self.rootStore.timepointStore.bin(d.originalIds[0], d.id, d.modification.bins, d.modification.binNames);
                }
            }
        });
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
                if (f) {
                    //console.log(f.patient);
                    let value = mapper[f.sample];
                    variableData.push({
                        patient: f.patient,
                        value: value

                    });
                }
            });

            _self.timepoints[i].addRow(variableId, variableData);
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
     */
    addVariable(variableId, variable, type, description) {
        if (type === "NUMBER") {
            let minMax = RootStore.getMinMaxOfContinuous(this.rootStore.sampleMappers[variableId], "sample");
            this.variableStore.addOriginalVariable(variableId, variable, type, description, minMax);
        }
        else {
            this.variableStore.addOriginalVariable(variableId, variable, type, description, []);
        }
        this.addHeatmapVariable(variableId);
        this.rootStore.timepointStore.regroupTimepoints();
        this.rootStore.undoRedoStore.saveVariableHistory("ADD VARIABLE", variable)
    }


    /**
     * Removes a variable from sample data
     * @param variableId
     */
    removeVariable(variableId) {
        let variableName = this.variableStore.getById(variableId).name;
        const _self = this;
        this.rootStore.undoRedoStore.saveVariableHistory("REMOVE VARIABLE", variableName);
        if (this.variableStore.currentVariables.length !== 1) {
            this.timepoints.forEach(function (d) {
                if (d.primaryVariableId === variableId) {
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

            if (_self.rootStore.globalTime === true) {
                _self.rootStore.globalPrimary = _self.variableStore.currentVariables[_self.variableStore.currentVariables.length - 1].id
            }
        }
        //case: last timepoint variableId was removed
        else {
            this.timepoints = [];
            this.variableStore.constructor(this.rootStore);
            this.rootStore.timepointStore.initialize();
        }
    }


}


export default SampleTimepointStore;