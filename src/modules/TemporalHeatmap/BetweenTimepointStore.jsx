import {extendObservable} from "mobx";
import SingleTimepoint from "./SingleTimepoint";


/*
stores information about betweenTimepoint
 */
class BetweenTimepointStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.clinicalEvents = {};
        this.sampleTimelineMap = {};
        this.timepointStructure = {};
        this.patients = [];
        extendObservable(this, {
            timepoints: [],
            currentVariables: []
        });
    }

    setPatients(patients) {
        this.patients = patients;
    }

    setClinicalEvents(events) {
        this.clinicalEvents = events;
    }

    setSampleTimelineMap(map) {
        this.sampleTimelineMap = map;
    }

    setTimepointStructure(timepointStructure) {
        this.timepointStructure = timepointStructure;
    }
     /**
     * initialize variables, used after the fist variable is added.
     * @param variable
     */
    initialize(variable) {
        for(let i=0;i<this.timepointStructure.length;i++){
            this.timepoints.push(new SingleTimepoint(this.rootStore,variable,this.rootStore.patientsPerTimepoint[i],"between",i))
        }
        this.rootStore.timepointStore.initialize();
    }
    reset(){
        this.timepoints=[];
        this.currentVariables=[];
    }


    /**
     * adds variable to heatmap timepointData
     * @param type
     * @param selectedValues
     * @param selectedKey
     * @param name
     */
    addHeatmapVariable(type, selectedValues, selectedKey, name) {
        let timepoints = this.timepoints.slice();
        for (let j = 0; j < this.timepointStructure.length; j++) {
            timepoints[j].heatmap.push({variable: name, sorting: 0, data: []});
        }
        const addIndex = timepoints[0].heatmap.length - 1;
        const _self = this;
        this.patients.forEach(function (f) {
            let samples = [];
            _self.timepointStructure.forEach(function (g) {
                g.forEach(function (l) {
                    if (l.patient === f) {
                        samples.push(l.sample);
                    }
                });
            });
            let currTimepoint = 0;
            let startAtEvent =0;
            while (currTimepoint < samples.length) {
                let eventCounter = startAtEvent;
                let attributeFound = false;
                while (eventCounter < _self.clinicalEvents[f].length) {
                    let currMaxDate = _self.sampleTimelineMap[samples[currTimepoint]].startNumberOfDaysSinceDiagnosis;
                    const currEventInRange=BetweenTimepointStore.isInCurrentRange(_self.clinicalEvents[f][eventCounter], currMaxDate);
                    if (currEventInRange) {
                        if(_self.doesEventMatch(type, selectedValues, selectedKey, _self.clinicalEvents[f][eventCounter])) {
                            attributeFound = true;
                        }
                        if(eventCounter<_self.clinicalEvents[f].length-1) {
                            const nextEventInRange=BetweenTimepointStore.isInCurrentRange(_self.clinicalEvents[f][eventCounter+1], currMaxDate);
                            if (!nextEventInRange) {
                                startAtEvent = eventCounter+1;
                                break;
                            }
                        }
                    }
                    eventCounter += 1;
                }
                timepoints[currTimepoint].heatmap[addIndex].data.push({
                    "patient": f,
                    "value": attributeFound
                });
                currTimepoint += 1;
            }
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
                    if (f.key === key && f.value === d) {
                        hasAttribute = true;
                    }
                })
            })
        }
        return hasAttribute;
    }



    /**
     * adds variable to sample data
     * 1. Add heatmap sample data
     * 2. Regroup data at timepoints which are grouped
     * @param type
     * @param selectedValues
     * @param selectedKey
     * @param name
     */
    addVariable(type, selectedValues, selectedKey, name) {
        this.addHeatmapVariable(type, selectedValues, selectedKey, name);
        this.currentVariables.push({variable: name, type: "binary"});
        this.rootStore.timepointStore.regroupTimepoints();
    }


      /**
     * Removes a variable from sample data
     * @param variable
     */
    removeVariable(variable) {
        if (this.currentVariables.length !== 1) {
                this.timepoints.forEach(function (d) {
                    d.adaptPrimaryVariable(variable);
                });
            const index = this.currentVariables.map(function (d) {
                return d.variable
            }).indexOf(variable);
            for (let i = 0; i < this.timepoints.length; i++) {
                this.timepoints[i].heatmap.splice(index, 1);
            }
            this.currentVariables.splice(index, 1);
            this.rootStore.timepointStore.regroupTimepoints();
        }
        //case: last timepoint variable was removed
        else {
            this.timepoints = [];
            this.currentVariables = [];
            this.rootStore.timepointStore.initialize();
        }
    }
}


export default BetweenTimepointStore;