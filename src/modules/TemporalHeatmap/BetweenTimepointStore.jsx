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
        this.variableStore = new VariableStore(rootStore);
        this.patientOrderForEvents = [];
        extendObservable(this, {
            timepoints: [],
            timeline: []
        });
    }

    reset() {
        this.timepoints = [];
        this.variableStore.constructor(this.rootStore);
    }

    initialize(id,addToTimeline) {
        this.rootStore.transitionOn = true;
        this.rootStore.realTime = false;
        for (let i = 0; i < this.rootStore.transitionStructure.length; i++) {
            let order;
            if(i<this.rootStore.timepointStructure.length){
                order=this.rootStore.sampleTimepointStore.timepoints[i].heatmapOrder;
            }
            else{
                order=this.rootStore.sampleTimepointStore.timepoints[i-1].heatmapOrder;
            }
            this.timepoints.push(new SingleTimepoint(this.rootStore, id, this.rootStore.transitionStructure[i], "between", i,order));
            if(addToTimeline) {
                this.timeline.push({type: "between", data: {}});
            }
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

    /**
     * check if an event has a specific attribute (key-value pair)
     * @param type: type of the event (Status/Treatment/Surgery)
     * @param values
     * @param key
     * @param event
     * @returns {boolean}
     */
    doesEventMatch(type, values, key, event) {
        let hasAttribute = false;
        if (type === event.eventType) {
            values.forEach(function (d, i) {
                event.attributes.forEach(function (f, j) {
                    if (f.key === key && f.value === d.name) {
                        hasAttribute = true;
                    }
                })
            })
        }
        return hasAttribute;
    }


    /**
     * check if an event has a specific attribute (key-value pair) and return the number of days
     * @param type: type of the event (Status/Treatment/Surgery)
     * @param values
     * @param key
     * @param event
     * @returns
     */
    eventStartDays(type, values, key, event) {
        let sampleEvents = {};

        //let ddate=999;

        let hasAttribute = false;
        //let startDays = -1;
        if (type === event.eventType) {
            values.forEach(function (d, i) {
                event.attributes.forEach(function (f, j) {
                    if (f.key === key && f.value === d.name) {
                        hasAttribute = true;
                        // startDays = event.startNumberOfDaysSinceDiagnosis;


                    }
                });
                if (hasAttribute) {
                    if (event.endNumberOfDaysSinceDiagnosis) {
                        //sampleEvents[event.patientId+event.eventType+event.startNumberOfDaysSinceDiagnosis] = {
                        sampleEvents[event.patientId + event.startNumberOfDaysSinceDiagnosis] = {
                            "patientId": event.patientId,
                            "hasAttribute": hasAttribute,
                            "startNumberOfDaysSinceDiagnosis": event.startNumberOfDaysSinceDiagnosis,
                            "endNumberOfDaysSinceDiagnosis": event.endNumberOfDaysSinceDiagnosis
                        };
                    }
                    else {
                        sampleEvents[event.patientId + event.startNumberOfDaysSinceDiagnosis] = {
                            "patientId": event.patientId,
                            "hasAttribute": hasAttribute,
                            "startNumberOfDaysSinceDiagnosis": event.startNumberOfDaysSinceDiagnosis,
                            "endNumberOfDaysSinceDiagnosis": event.startNumberOfDaysSinceDiagnosis
                        };

                    }
                }
                hasAttribute = false;
            })
        }

        return sampleEvents;
    }

    update() {
        const _self = this;
        this.timepoints = [];
        this.variableStore.currentVariables.forEach(function (d, i) {
            if (i === 0) {
                for (let i = 0; i < this.rootStore.transitionStructure.length; i++) {
                    this.timepoints.push(new SingleTimepoint(this.rootStore, d.id, this.rootStore.transitionStructure[i], "between", i))
                }
            }
            if (!d.derived) {
                this.addHeatmapVariable(this.rootStore.timeGapMapping, d.id);
            }
            else {
                let selectedVariables = [];
                let eventType = d.originalIds[0].eventType;
                let selectedCategory = d.originalIds[0].eventSubType;
                d.originalIds.forEach(function (f, i) {
                    let variable = _self.variableStore.getByIdAllVariables(f.id);
                    selectedVariables.push({id: variable.id, name: variable.name});
                });
                this.addHeatmapVariable(this.rootStore.getEventMapping(eventType, selectedVariables, selectedCategory))
            }
        });
    }

    addORVariable(type, selectedValues, selectedKey, name) {
        // create new Id
        let derivedId = uuidv4();
        // add derived variable
        this.variableStore.addEventVariable(derivedId, name, type, selectedValues, selectedKey, "OR");
        //initialize if the variable is the first variable to be added
        if (this.timepoints.length === 0) {
            this.initialize(derivedId,false);
        }
        const eventMapper = this.rootStore.getEventMapping(type, selectedValues, selectedKey);
        this.addToTimeline(eventMapper);
        const derivedMapper = {};
        for (let patient in eventMapper) {
            if (!(patient in derivedMapper)) {
                derivedMapper[patient] = [];
            }
            eventMapper[patient].forEach(function (d, i) {
                derivedMapper[patient].push(d.length > 0);
            })
        }
        this.addHeatmapVariable(derivedMapper, derivedId);
        this.rootStore.timepointStore.regroupTimepoints();
        this.addEventDetails(type, selectedValues, selectedKey, name);
        this.rootStore.undoRedoStore.saveVariableHistory("ADD VARIABLE", name)
    }

    addToTimeline(mapper) {
        this.timeline.forEach(function (g, j) {
            for (let patient in mapper) {
                if (!(patient in g.data)) {
                    g.data[patient] = mapper[patient][j];
                }
                else {
                    if (!(g.data[patient].map(function (g) {
                            return g.variableId;
                        }).includes(mapper[patient][j].variableId))) {
                        g.data[patient].push(mapper[patient][j]);
                    }
                }
            }
        });
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
    addEventDetails(type, selectedValues, selectedKey, name) {
        const _self = this;
        let eventDetails = [];
        this.rootStore.patientOrderPerTimepoint.forEach(function (f) {
            let samples = [];
            _self.rootStore.timepointStructure.forEach(function (g) {
                g.forEach(function (l) {
                    if (l.patient === f) {
                        samples.push(l.sample);
                    }
                });
            });
            let currTimepoint = 0;
            let startAtEvent = 0;
            let eventDate = -1, eventEndDate;
            let eventCounter;
            let getEventId = function (d) {
                return !d.derived && _self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes
                    .map(attr => attr.value === d.name)
                    .reduce((next, result) => result || next, false);
            };
            while (currTimepoint < samples.length + 1) {
                eventCounter = startAtEvent;
                while (eventCounter < _self.rootStore.cbioAPI.clinicalEvents[f].length) {
                    let currMaxDate;
                    if (currTimepoint === samples.length) {
                        currMaxDate = Number.POSITIVE_INFINITY;
                    }
                    else {
                        currMaxDate = _self.rootStore.sampleTimelineMap[samples[currTimepoint]].startNumberOfDaysSinceDiagnosis;
                    }
                    const currEventInRange = BetweenTimepointStore.isInCurrentRange(_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter], currMaxDate);
                    if (currEventInRange) {
                        let dt = _self.eventStartDays(type, selectedValues, selectedKey, _self.rootStore.cbioAPI.clinicalEvents[f][eventCounter]);
                        let dt1 = Object.keys(dt);
                        if (dt1.length > 0) {
                            eventDate = Object.values(dt)[0].startNumberOfDaysSinceDiagnosis;
                            eventEndDate = Object.values(dt)[0].endNumberOfDaysSinceDiagnosis;
                            let variable = _self.variableStore.allVariables.find(getEventId);
                            let vId = variable.id;
                            let findName = variable.name;
                            eventDetails.push({
                                time: currTimepoint,
                                patientId: f,
                                eventDate: eventDate,
                                eventEndDate: eventEndDate,
                                eventType: _self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].eventType,
                                eventTypeDetailed: findName, //_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes[0].value,
                                varId: vId
                            });
                            _self.patientOrderForEvents.push(f);
                        }
                        if (eventCounter < _self.rootStore.cbioAPI.clinicalEvents[f].length - 1) {
                            const nextEventInRange = BetweenTimepointStore.isInCurrentRange(_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter + 1], currMaxDate);
                            if (!nextEventInRange) {
                                startAtEvent = eventCounter + 1;
                                break;
                            }
                        }
                    }
                    eventCounter += 1;
                }
                eventDate = -1;
                currTimepoint += 1;
            }
        });

        this.rootStore.eventDetails = this.rootStore.eventDetails.concat(eventDetails);
    }

    /**
     *
     * @param variableId
     */
    addTimepointDistance(variableId) {
        this.rootStore.transitionOn = true;
        if (!this.variableStore.hasVariable(variableId)) {
            this.variableStore.addOriginalVariable(variableId, "Timepoint Distance", "NUMBER");
            if (this.timepoints.length === 0) {
                this.initialize(variableId,false);
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
        let variableName = this.variableStore.getById(variableId).name;
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
        this.rootStore.undoRedoStore.saveVariableHistory("REMOVE VARIABLE", variableName);
    }
}


export default BetweenTimepointStore;