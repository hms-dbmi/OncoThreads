import TransitionStore from "./TemporalHeatmap/TransitionStore.jsx"
import TimepointStore from "./TemporalHeatmap/TimepointStore"
import BetweenTimepointStore from "./TemporalHeatmap/BetweenTimepointStore"
import SampleTimepointStore from "./TemporalHeatmap/SampleTimepointStore"


import VisStore from "./TemporalHeatmap/VisStore.jsx"
import {extendObservable} from "mobx";

/*
gets the data with the cBioAPI and gives it to the other stores
TODO: make prettier
 */
class RootStore {
    constructor(cbioAPI) {
        this.cbioAPI = cbioAPI;
        this.sampleTimepointStore = new SampleTimepointStore(this);
        this.betweenTimepointStore = new BetweenTimepointStore(this);
        this.timepointStore = new TimepointStore(this);
        this.transitionStore = new TransitionStore(this);
        this.visStore = new VisStore();

        this.clinicalSampleCategories = [];
        this.eventCategories = [];
        this.eventAttributes = [];
        this.patientsPerTimepoint = [];
        this.patientOrderPerTimepoint = [];

        extendObservable(this, {
            parsed: false
        })
    }

    initialize(cbioAPI) {
        this.cbioAPI = cbioAPI;
        this.sampleTimepointStore = new SampleTimepointStore(this);
        this.betweenTimepointStore = new BetweenTimepointStore(this);
        this.timepointStore = new TimepointStore(this);
        this.transitionStore = new TransitionStore(this);
        this.visStore = new VisStore();

        this.clinicalSampleCategories = [];
        this.eventCategories = [];
        this.eventAttributes = [];
        this.patientsPerTimepoint = [];
        this.patientOrderPerTimepoint = [];

        this.parsed = false;
    }

    /*
    gets data from cBio and sets parameters in other stores
     */
    parseCBio(studyID) {
        const _self = this;
        this.cbioAPI.getAllData(studyID, function () {
            _self.buildPatientStructure();
            _self.getEventAttributes();
            _self.sampleTimepointStore.setSampleClinicalMap(_self.createClinicalDataMapping());
            _self.sampleTimepointStore.setSampleMutationCountMap(_self.createMutationCountsMapping());

            _self.betweenTimepointStore.setClinicalEvents(_self.cbioAPI.clinicalEvents);


            _self.parsed = true;
        });
    }

    /**
     * combines clinical events of sort "SPECIMEN" and clinical data in one datastructure,
     * sets some variables in the other stores
     */
    buildPatientStructure() {
        const _self = this;
        let sampleStructure = {};
        let sampleTimelineMap = {};
        let eventCategories = [];
        let maxTP = 0;
        let patientsPerTimepoint = [];
        let allPatients = [];

        this.cbioAPI.patients.forEach(function (d) {
            sampleStructure[d.patientId] = [];
            allPatients.push(d.patientId);
            let previousDate = -1;
            let currTP = 0;
            _self.cbioAPI.clinicalEvents[d.patientId].forEach(function (e, i) {
                if (!eventCategories.includes(e.eventType)) {
                    eventCategories.push(e.eventType);
                }
                if (e.eventType === "SPECIMEN") {
                    sampleTimelineMap[e.attributes[1].value] = {
                        "method": e.attributes[0].key,
                        "method_name": e.attributes[0].value,
                        "startNumberOfDaysSinceDiagnosis": e.startNumberOfDaysSinceDiagnosis
                    };
                    if (e.startNumberOfDaysSinceDiagnosis !== previousDate) {
                        sampleStructure[d.patientId].push([e.attributes[1].value]);
                        if (patientsPerTimepoint.length <= currTP) {
                            patientsPerTimepoint.push([]);
                        }
                        patientsPerTimepoint[currTP].push(d.patientId);
                        currTP += 1;
                        if (currTP > maxTP) {
                            maxTP = currTP;
                        }
                    }
                    else {
                        sampleStructure[d.patientId][currTP - 1].push(e.attributes[1].value);
                    }
                    previousDate = e.startNumberOfDaysSinceDiagnosis;
                }
            })
        });
        const timepointStructure = this.buildTimepointStructure(sampleStructure, maxTP);
        this.timepointStore.setNumberOfPatients(allPatients.length);
        this.patientOrderPerTimepoint =allPatients;
        this.patientsPerTimepoint = patientsPerTimepoint;

        this.sampleTimepointStore.setTimepointStructure(timepointStructure);

        this.betweenTimepointStore.setPatients(allPatients);
        this.betweenTimepointStore.setSampleTimelineMap(sampleTimelineMap);
        this.betweenTimepointStore.setTimepointStructure(timepointStructure);


        this.eventCategories = eventCategories;
    }

    /**
     * builds a simple timepoint structure
     * @param sampleStructure
     * @param numberOfTimepoints
     * @returns {Array} timepointStructure
     */
    buildTimepointStructure(sampleStructure, numberOfTimepoints) {
        let timepointStructure = [];
        for (let i = 0; i < numberOfTimepoints; i++) {
            let patientSamples = [];
            this.cbioAPI.patients.forEach(function (d, j) {
                if (sampleStructure[d.patientId].length > i) {
                    patientSamples.push({patient: d.patientId, sample: sampleStructure[d.patientId][i][0]})
                }
            });
            timepointStructure.push(patientSamples);
        }
        return timepointStructure;
    }

    /**
     * creates a dictionary mapping sample IDs onto clinical data
     * @returns {{}}
     */
    createClinicalDataMapping() {
        const _self = this;
        let sampleClinicalMap = {};
        _self.cbioAPI.clinicalSampleData.forEach(function (d, i) {
            if (!(d.sampleId in sampleClinicalMap)) {
                sampleClinicalMap[d.sampleId] = {};
            }
            if (!_self.clinicalSampleCategories.map(function (d, i) {
                    return d.variable
                }).includes(d.clinicalAttribute.displayName)) {
                _self.clinicalSampleCategories.push({
                    variable: d.clinicalAttribute.displayName,
                    datatype: d.clinicalAttribute.datatype
                });
            }
            sampleClinicalMap[d.sampleId][d.clinicalAttribute.displayName] = d.value;
        });
        return sampleClinicalMap;
    }

    /**
     * creates a dictionary mapping sample IDs onto mutation counts
     * @returns {{}}
     */
    createMutationCountsMapping() {
        let mapper = {};
        this.cbioAPI.mutationCounts.forEach(function (d) {
            mapper[d.sampleId] = d.mutationCount;
        });
        return mapper;
    }

    /**
     * gets all the different attributes an event can have
     */
    getEventAttributes() {
        let attributes = {};
        for (let patient in this.cbioAPI.clinicalEvents) {
            this.cbioAPI.clinicalEvents[patient].forEach(function (d, i) {
                if (!(d.eventType in attributes)) {
                    attributes[d.eventType] = {}
                }
                d.attributes.forEach(function (f, j) {
                    if (!(f.key in attributes[d.eventType])) {
                        attributes[d.eventType][f.key] = [];
                        attributes[d.eventType][f.key].push(f.value);
                    }
                    else {
                        if (!attributes[d.eventType][f.key].includes(f.value)) {
                            attributes[d.eventType][f.key].push(f.value);
                        }
                    }
                })
            })
        }
        this.eventAttributes = attributes;
    }

}

export default RootStore