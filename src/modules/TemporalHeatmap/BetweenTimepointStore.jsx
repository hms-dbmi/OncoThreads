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
            //timeline: []
        });
    }

    reset() {
        this.timepoints = [];
        this.variableStore.constructor(this.rootStore);
    }

    initialize(id, addToTimeline) {
        this.rootStore.visStore.resetTransitionSpace();
        this.rootStore.transitionOn = true;
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
            _self.timepoints[i].heatmap.push({variable: variableId, sorting: 0, data: variableData});
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
        this.variableStore.currentVariables.forEach(function (d, i) {
            if (i === 0) {
                for (let i = 0; i < _self.rootStore.transitionStructure.length; i++) {
                    let order;
                    if (i < _self.rootStore.timepointStructure.length) {
                        order = _self.rootStore.sampleTimepointStore.timepoints[i].heatmapOrder;
                    }
                    else {
                        order = _self.rootStore.sampleTimepointStore.timepoints[i - 1].heatmapOrder;
                    }
                    _self.timepoints.push(new SingleTimepoint(_self.rootStore, d.id, _self.rootStore.transitionStructure[i], "between", i, order))
                }
                _self.rootStore.timepointStore.initialize();
            }
            if (!d.derived) {
                _self.addHeatmapVariable(_self.rootStore.timeGapMapping, d.id);
            }
            else {
                let selectedVariables = [];
                let eventType;
                let selectedCategory;
                d.originalIds.forEach(function (f, i) {
                    //let variable = _self.variableStore.getByIdAllVariables(f.id);
                    let variable = _self.variableStore.getByIdAllVariables(f);
                    if (i === 0) {
                        eventType = variable.eventType;
                        selectedCategory = variable.eventSubType;
                    }
                    selectedVariables.push({id: variable.id, name: variable.name});
                });
                _self.addHeatmapVariable(_self.deriveMapper(_self.rootStore.getEventMapping(eventType, selectedVariables, selectedCategory), "or"), d.id);
            }
        });
    }

    addORVariable(type, selectedValues, selectedKey, name) {
        // create new Id
        let derivedId = uuidv4();
        // add derived variable
        this.variableStore.addEventVariable(derivedId, name, type, selectedValues, selectedKey, "OR", []);
        //initialize if the variable is the first variable to be added
        if (this.timepoints.length === 0) {
            this.initialize(derivedId, false);
        }
        const eventMapper = this.rootStore.getEventMapping(type, selectedValues, selectedKey);
        //this.addToTimeline(eventMapper);
        this.addHeatmapVariable(this.deriveMapper(eventMapper, "or"), derivedId);
        this.rootStore.timepointStore.regroupTimepoints();
        this.rootStore.undoRedoStore.saveVariableHistory("ADD VARIABLE", name)
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
        this.rootStore.transitionOn = true;
        if (!this.variableStore.hasVariable(variableId)) {
            let minMax = RootStore.getMinMaxOfContinuous(this.rootStore.timeGapMapping, "between");
            this.variableStore.addOriginalVariable(variableId, "Timepoint Distance", "NUMBER", minMax);
            if (this.timepoints.length === 0) {
                this.initialize(variableId, false);
            }
            this.addHeatmapVariable(this.rootStore.timeGapMapping, variableId);
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

        var indexToDelete = _self.variableStore.currentVariables.map(function (d) {
            return d.id
        }).indexOf(variableId);

        if (_self.variableStore.currentVariables[indexToDelete].datatype !== "NUMBER") {
            var originalIdsDel = _self.variableStore.currentVariables[indexToDelete].originalIds;


            var flag = false;
            Array.from(Array(originalIdsDel.length).keys()).forEach(
                function (j) {
                    _self.variableStore.currentVariables.forEach(function (d, i) { // go over the list of current variables
                        var k = d.originalIds; //console.log(k);
                        if (k.includes(originalIdsDel[j]) && i !== indexToDelete) {
                            //console.log("true");
                            flag = true;
                        }
                    });
                    if (!flag) {
                        for (var l = 0; l < _self.rootStore.eventDetails.length;) {

                            //console.log(originalIds.includes(this.rootStore.eventDetails[i].varId));

                            if (originalIdsDel[j].includes(_self.rootStore.eventDetails[l].varId)) {
                                _self.rootStore.eventDetails.splice(l, 1);
                            }
                            else {
                                l++;
                            }
                        }
                    }
                    flag = false;
                })

        }


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
            this.rootStore.transitionOn = false;
            this.timepoints = [];
            this.variableStore.constructor(this.rootStore);
            this.rootStore.timepointStore.initialize();
        }
    }
}


export default BetweenTimepointStore;