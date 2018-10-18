import {extendObservable} from "mobx";
import SingleTimepoint from "./SingleTimepoint";
import VariableStore from "./VariableStore";


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
        this.variableStore.constructor(this.rootStore);
    }

    initialize(id) {
        this.rootStore.visStore.resetTransitionSpace();
        this.rootStore.timepointStore.transitionOn = true;
        this.rootStore.realTime = false;
        for (let i = 0; i < this.rootStore.transitionStructure.length; i++) {
            let order;
            if (i < this.rootStore.timepointStructure.length) {
                order = this.rootStore.sampleTimepointStore.timepoints[i].heatmapOrder;
            }
            else {
                order = this.rootStore.sampleTimepointStore.timepoints[i - 1].heatmapOrder;
            }
            this.timepoints.push(new SingleTimepoint(this.rootStore, id, this.rootStore.transitionStructure[i], "between", i, order));
        }
        this.rootStore.timepointStore.initialize();
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
        const _self = this;
        this.rootStore.transitionStructureNew.forEach(function (d, i) {
            let variableData = [];
            d.forEach(function (f) {
                if (f) {
                    //console.log(f.patient);
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
     * checks if an event has happened before a specific date
     * @param event
     * @param currMaxDate
     * @returns {boolean}
     */
    static isInCurrentRange(event, currMaxDate) {
        let isInRange = false;
        if (event.hasOwnProperty("endNumberOfDaysSinceDiagnosis")) {
            if (event.endNumberOfDaysSinceDiagnosis < currMaxDate) {
                isInRange = true
            }

        }
        else if (event.startNumberOfDaysSinceDiagnosis < currMaxDate) {
            isInRange = true;
        }
        return isInRange;
    }


    update() {
        const _self = this;
        this.timepoints = [];
        if (this.variableStore.currentVariables.length > 0) {
            this.initialize(this.variableStore.currentVariables[0].id);
        }
        this.variableStore.currentVariables.forEach(function (d) {
            _self.addHeatmapVariable(d.id, d.mapper);
        });
    }


    addVariable(type, selectedValue, display) {
        let isFirst = this.timepoints.length === 0;
        const _self = this;
        if (!_self.variableStore.hadVariableAll(selectedValue.id)) {
            const eventMapper = _self.rootStore.getSampleEventMapping(type, selectedValue);
            _self.variableStore.addEventVariable(type, selectedValue, eventMapper, display);
            if (display) {
                _self.addHeatmapVariable(selectedValue.id, eventMapper);
                this.rootStore.timepointStore.regroupTimepoints();
                this.rootStore.undoRedoStore.saveVariableHistory("ADD VARIABLE", selectedValue.name)
            }
        }
    }


    /**
     *
     * @param variableId
     */
    addTimepointDistance(variableId) {
        let isFirst = this.timepoints.length === 0;
        this.rootStore.timepointStore.transitionOn = true;
        if (!this.variableStore.hasVariable(variableId)) {
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
        let variableName = this.variableStore.getById(variableId).name;
        this.rootStore.undoRedoStore.saveVariableHistory("REMOVE VARIABLE", variableName);

        //remove from eventDetails too;

        //console.log(this.rootStore.eventDetails);

        const _self = this;

        let indexToDelete = _self.variableStore.currentVariables.map(function (d) {
            return d.id
        }).indexOf(variableId);
        let originalIdsDel = _self.variableStore.currentVariables[indexToDelete].originalIds;
        originalIdsDel.forEach(
            function (d) {
                for (let l = _self.rootStore.eventDetails.length - 1; l >= 0; l--) {
                    if (d === _self.rootStore.eventDetails[l].varId) {
                        _self.rootStore.eventDetails.splice(l, 1);
                    }
                }
            });


        //console.log(this.rootStore.eventDetails);
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
        }
        //case: last timepoint variableId was removed
        else {
            this.rootStore.timepointStore.transitionOn = false;
            this.timepoints = [];
            this.variableStore.constructor(this.rootStore);
            this.rootStore.timepointStore.initialize();
        }
    }
}


export default BetweenTimepointStore;