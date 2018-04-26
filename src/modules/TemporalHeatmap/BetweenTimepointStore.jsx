import {extendObservable} from "mobx";

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
            timepointData: [],
            currentVariables: [],
            primaryVariables: [],
            groupOrder: [],
            patientsPerTimepoint: [],
            patientOrderPerTimepoint: []
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
     * adds variable to heatmap timepointData
     * @param type
     * @param selectedValues
     * @param selectedKey
     * @param name
     */
    addHeatmapVariable(type, selectedValues, selectedKey, name) {
        let betweenTimepointData = this.timepointData.slice();
        for (let j = 0; j < this.timepointStructure.length; j++) {
            betweenTimepointData[j].heatmap.push({variable: name, sorting: 0, data: []});
        }
        const addIndex = betweenTimepointData[0].heatmap.length - 1;
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
            while (currTimepoint < samples.length) {
                let attributeFound = false;
                let eventCounter = 0;
                while (eventCounter < _self.clinicalEvents[f].length) {
                    let currMaxDate = _self.sampleTimelineMap[samples[currTimepoint]].startNumberOfDaysSinceDiagnosis;
                    if (BetweenTimepointStore.isInCurrentRange(_self.clinicalEvents[f][eventCounter], currMaxDate) && _self.hasAttribute(type, selectedValues, selectedKey, _self.clinicalEvents[f][eventCounter])) {
                        attributeFound = true;
                        break;
                    }
                    eventCounter += 1;
                }
                betweenTimepointData[currTimepoint].heatmap[addIndex].data.push({
                    "patient": f,
                    "value": attributeFound
                });
                currTimepoint += 1;
            }
        });

        this.timepointData = betweenTimepointData;
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
    hasAttribute(type, values, key, event) {
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
     * initialize variables, used after the fist variable is added.
     * @param variable
     */
    initialize(variable) {
        this.primaryVariables = Array(this.timepointStructure.length).fill(variable);
        this.timepointData = Array(this.timepointStructure.length).fill({
            type: "between",
            heatmap: [],
            group: {data: []}
        });
        this.groupOrder = Array(this.timepointStructure.length).fill({isGrouped: false, order: 1});
        this.patientsPerTimepoint = this.rootStore.patientsPerTimepoint;
        this.patientOrderPerTimepoint = this.rootStore.patientOrderPerTimepoint;
        this.rootStore.timepointStore.initialize();
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
        if (this.primaryVariables.includes(variable)) {
            this.adaptPrimaryVariables(variable);
        }
        const index = this.currentVariables.map(function (d, i) {
            return d.variable
        }).indexOf(variable);
        for (let i = 0; i < this.timepointData.length; i++) {
            this.timepointData[i].heatmap.splice(index, 1);
        }
        this.currentVariables.splice(index, 1);
        this.rootStore.timepointStore.regroupTimepoints();
    }
}


export default BetweenTimepointStore;