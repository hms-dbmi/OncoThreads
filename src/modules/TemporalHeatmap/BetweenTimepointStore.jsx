import {extendObservable} from "mobx";

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
     * adds variable to heatmap sample data
     * @param type
     * @param selectedValues
     * @param selectedKey
     * @param name
     */
    addHeatmapVariable(type, selectedValues, selectedKey, name) {
        let betweenTimepointData = this.timepointData;
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
            let attributeFound = false;
            _self.clinicalEvents[f].forEach(function (d) {
                if (samples[currTimepoint] !== undefined) {
                    const currMaxDate = _self.sampleTimelineMap[samples[currTimepoint]].startNumberOfDaysSinceDiagnosis;
                    if (!BetweenTimepointStore.isInCurrentRange(d, currMaxDate)) {
                        betweenTimepointData[currTimepoint].heatmap[addIndex].data.push({
                            "patient": f,
                            "value": attributeFound
                        });
                        currTimepoint += 1;
                        attributeFound = false;
                    }
                    else if (_self.hasAttribute(type, selectedValues, selectedKey, d)) {
                        attributeFound = true;
                    }
                }
            });

        });
        this.timepointData = betweenTimepointData;
    }

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

    hasAttribute(type, selectedValues, selectedKey, event) {
        let hasAttribute = false;
        if (type === event.eventType) {
            selectedValues.forEach(function (d, i) {
                event.attributes.forEach(function (f, j) {
                    if (f.key === selectedKey && f.value === d) {
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
        this.patientOrderPerTimepoint=this.rootStore.patientOrderPerTimepoint;
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