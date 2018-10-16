import {extendObservable} from "mobx";
import SingleTimepoint from "./SingleTimepoint";
import VariableStore from "./VariableStore";
import uuidv4 from 'uuid/v4';
import RootStore from "../RootStore";


/*
stores information about betweenTimepoint
 */
class BetweenTimepointStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.variableStore = new VariableStore(rootStore);
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
     * adds variable to heatmap timepointData
     * @param mapper
     * @param variableId
     */
    addHeatmapVariable(mapper, variableId) {
        let timepoints = this.timepoints.slice();
        const _self = this;
        let currentPatientIndices = {};
        this.rootStore.transitionStructure.forEach(function (d, i) {
            let variableData = [];
            d.forEach(function (f) {
                if (!(f in currentPatientIndices)) {
                    currentPatientIndices[f] = 0
                }
                let value = mapper[f][currentPatientIndices[f]];
                variableData.push({
                    patient: f,
                    value: value
                });
                currentPatientIndices[f] += 1;
            });
            _self.timepoints[i].addRow(variableId, variableData);
        });
        this.timepoints = timepoints;
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
            if (!d.derived) {
                if (d.type === 'event') {
                    _self.addHeatmapVariable(_self.deriveMapper(_self.rootStore.getEventMapping(d.eventType, [{
                        name: d.name,
                        id: d.id,
                        eventType: d.eventSubType
                    }]), "or"), d.id);
                }
                else {
                    _self.addHeatmapVariable(_self.rootStore.timeGapMapping, d.id);
                }
            }
            else {
                if (d.modificationType === "OR") {
                    let selectedVariables = [];
                    let eventType=_self.variableStore.getByIdAllVariables(d.originalIds[0]).eventType;
                    d.originalIds.forEach(function (f, i) {
                        //let variable = _self.variableStore.getByIdAllVariables(f.id);
                        let variable = _self.variableStore.getByIdAllVariables(f);
                        selectedVariables.push({id: variable.id, name: variable.name, eventType: variable.eventSubType});
                    });
                    _self.addHeatmapVariable(_self.deriveMapper(_self.rootStore.getEventMapping(eventType, selectedVariables), "or"), d.id);
                }
                else if (d.modificationType === "binning") {
                    _self.addHeatmapVariable(_self.rootStore.timeGapMapping, d.originalIds[0]);
                    _self.rootStore.timepointStore.bin(d.originalIds[0], d.id, d.modification.bins, d.modification.binNames);
                }
            }

        });
    }

    addORVariable(type, selectedValues, name) {
        // create new Id
        let isFirst = this.timepoints.length === 0;
        let derivedId = uuidv4();
        // add derived variable
        this.variableStore.addCombinedEventVariable(derivedId, name, type, selectedValues, "OR", []);
        //initialize if the variable is the first variable to be added
        if (isFirst) {
            this.initialize(derivedId);
        }
        const eventMapper = this.rootStore.getEventMapping(type, selectedValues);
        this.addHeatmapVariable(this.deriveMapper(eventMapper, "or"), derivedId);
        this.rootStore.timepointStore.regroupTimepoints();
        this.rootStore.undoRedoStore.saveVariableHistory("ADD VARIABLE", name)
    }

    addVariablesSeperate(type, selectedValues) {
        let isFirst = this.timepoints.length === 0;
        const _self = this;
        if (isFirst) {
            this.initialize(selectedValues[0].id);
        }
        selectedValues.forEach(function (d, i) {
            if (!_self.variableStore.hasVariable(d.id)) {
                const eventMapper = _self.rootStore.getEventMapping(type, [selectedValues[i]]);
                _self.addHeatmapVariable(_self.deriveMapper(eventMapper, "or"), d.id);
            }
        });
        this.variableStore.addSeperateEventVariables(type, selectedValues);
        //initialize if the variable is the first variable to be added
        this.rootStore.timepointStore.regroupTimepoints();
        this.rootStore.undoRedoStore.saveVariableHistory("ADD VARIABLES", selectedValues.map(variable => variable.name))
    }

    deriveMapper(mapper, operator) {
        const derivedMapper = {};
        if (operator === "or") {
            for (let patient in mapper) {
                if (!(patient in derivedMapper)) {
                    derivedMapper[patient] = [];
                }
                mapper[patient].forEach(function (d, i) {
                    derivedMapper[patient].push(d.length > 0);
                })
            }
        }
        return derivedMapper;
    }

    /**
     *
     * @param variableId
     */
    addTimepointDistance(variableId) {
        let isFirst = this.timepoints.length === 0;
        this.rootStore.timepointStore.transitionOn = true;
        if (!this.variableStore.hasVariable(variableId)) {
            let minMax = RootStore.getMinMaxOfContinuous(this.rootStore.timeGapMapping, "between");
            this.variableStore.addOriginalVariable(variableId, "Timepoint Distance", "NUMBER", "Time between timepoints", minMax);
            if (isFirst) {
                this.initialize(variableId, false);
            }
            this.addHeatmapVariable(this.rootStore.timeGapMapping, variableId, isFirst);
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