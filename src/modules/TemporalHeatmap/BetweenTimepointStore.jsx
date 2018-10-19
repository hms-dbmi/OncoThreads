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

    initialize(id) {
        this.rootStore.timepointStore.transitionOn = true;
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
            timepoints.push(new SingleTimepoint(this.rootStore, id, this.rootStore.transitionStructure[i], "between", i, order));
        }
        this.timepoints = timepoints;
    }

    /**
     * adds variable to heatmap
     * @param mapper
     * @param variableId
     */
    addHeatmapVariable(variableId, mapper) {
        if (this.timepoints.length === 0) {
            this.initialize(variableId);
        }
        let timepoints = this.timepoints.slice();
        this.rootStore.transitionStructureNew.forEach(function (d, i) {
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
        this.rootStore.timepointStore.regroupTimepoints();
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

    update() {
        const _self = this;
        this.timepoints = [];
        if (this.variableStore.currentVariables.length > 0) {
            this.initialize(this.variableStore.currentVariables[0].id);
        }
        this.variableStore.getCurrentVariables().forEach(function (d) {
            _self.addHeatmapVariable(d.id, d.mapper);
        });
    }


    addVariable(type, selectedValue, display) {
        const _self = this;
        if (!_self.variableStore.isReferenced(selectedValue.id)) {
            const eventMapper = _self.rootStore.getSampleEventMapping(type, selectedValue);
            _self.variableStore.addEventVariable(type, selectedValue, eventMapper, display);
        }
    }


    /**
     *
     * @param variableId
     */
    addTimepointDistance(variableId) {
        let isFirst = this.timepoints.length === 0;
        this.rootStore.timepointStore.transitionOn = true;
        if (!this.variableStore.isDisplayed(variableId)) {
            this.variableStore.addOriginalVariable(variableId, "Timepoint Distance", "NUMBER", "Time between timepoints", this.rootStore.timeGapMapping);
            if (isFirst) {
                this.initialize(variableId, false);
            }
            this.addHeatmapVariable(variableId, this.rootStore.timeGapMapping);
            this.rootStore.timepointStore.regroupTimepoints();
        }
        this.rootStore.undoRedoStore.saveVariableHistory("ADD VARIABLE", "Timepoint Distance")
    }


    /**
     * Removes a variable from sample data
     * @param variableId
     */
    removeVariable(variableId) {
        //remove from eventDetails too;

        //console.log(this.rootStore.eventDetails);

        const _self = this;

        let originalIdsDel = _self.variableStore.getById(variableId).originalIds;
        originalIdsDel.forEach(
            function (d) {
                for (let l = _self.rootStore.eventDetails.length - 1; l >= 0; l--) {
                    if (d === _self.rootStore.eventDetails[l].varId) {
                        _self.rootStore.eventDetails.splice(l, 1);
                    }
                }
            });


        //console.log(this.rootStore.eventDetails);
        if (this.variableStore.currentVariables.length > 0) {
            this.timepoints.forEach(d => d.removeRow(variableId));
            this.rootStore.timepointStore.regroupTimepoints();
        }
        //case: last timepoint variableId was removed
        else {
            this.rootStore.timepointStore.transitionOn = false;
        }
    }
}


export default BetweenTimepointStore;