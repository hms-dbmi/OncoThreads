import TransitionStore from "./TemporalHeatmap/TransitionStore.jsx"
import TimepointStore from "./TemporalHeatmap/TimepointStore"
import BetweenTimepointStore from "./TemporalHeatmap/BetweenTimepointStore"
import SampleTimepointStore from "./TemporalHeatmap/SampleTimepointStore"


import VisStore from "./TemporalHeatmap/VisStore.jsx"
import {extendObservable} from "mobx";
import uuidv4 from 'uuid/v4';
import UndoRedoStore from "./TemporalHeatmap/UndoRedoStore";


/*
gets the data with the cBioAPI and gives it to the other stores
TODO: make prettier
 */
class RootStore {
    constructor(cbioAPI, study, firstLoad) {
        this.cbioAPI = cbioAPI;
        this.study = study;
        this.sampleTimepointStore = new SampleTimepointStore(this);
        this.betweenTimepointStore = new BetweenTimepointStore(this);
        this.timepointStore = new TimepointStore(this);
        this.transitionStore = new TransitionStore(this);
        this.visStore = new VisStore();
        this.undoRedoStore = new UndoRedoStore(this);

        this.hasMutationCount = false;

        this.maxTP = 0;
        this.minTP = 0;
        this.clinicalSampleCategories = [];
        this.mutationCountId = uuidv4();
        this.timeDistanceId = uuidv4();
        this.eventCategories = [];
        this.eventAttributes = [];
        this.patientsPerTimepoint = [];
        this.patientOrderPerTimepoint = [];
        this.timeGapStructure = [];
        this.timepointStructure = [];
        this.transitionStructure = [];
        this.sampleTimelineMap = {};
        this.timeGapMapping = [];
        this.sampleMappers = {};
        this.actualTimeLine = [];
        this.eventDetails = [];

        this.maxTimeInDays = 0;

        this.reset = this.reset.bind(this);

        extendObservable(this, {
            logs: [],
            parsed: false,
            firstLoad: firstLoad,
            realTime: false,
            globalTime: false,
            transitionOn: false

        })
    }

    reset() {
        this.parsed = false;
        this.globalTime = false;
        this.realTime = false;
        this.transitionOn = false;
        this.eventDetails = [];
        //this.maxTimeInDays=0;
        this.betweenTimepointStore.reset();
        this.sampleTimepointStore.initialize(this.clinicalSampleCategories[0].id, this.clinicalSampleCategories[0].variable, this.clinicalSampleCategories[0].datatype, "clinical");
        this.undoRedoStore.saveHistory();
        this.parsed = true;
    }

    /*
    gets data from cBio and sets parameters in other stores
     */
    parseCBio() {
        const _self = this;
        this.cbioAPI.getAllData(this.study.studyId, function () {
            _self.buildPatientStructure();
            _self.createClinicalSampleMapping();
            _self.createMutationCountsMapping();

            if(localStorage.getItem(_self.study.studyId)===null) {
                _self.sampleTimepointStore.initialize(_self.clinicalSampleCategories[0].id, _self.clinicalSampleCategories[0].variable, _self.clinicalSampleCategories[0].datatype, "clinical");
                _self.undoRedoStore.saveVariableHistory("ADD VARIABLE", _self.clinicalSampleCategories[0].variable);
            }
            else{
                _self.undoRedoStore.deserializeLocalStorage();
            }
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
        let excludeDates = {};

        this.cbioAPI.patients.forEach(function (d) {
            sampleStructure[d.patientId] = [];
            excludeDates[d.patientId] = [];
            allPatients.push(d.patientId);
            let previousDate = -1;
            let currTP = 0;
            _self.cbioAPI.clinicalEvents[d.patientId].forEach(function (e, i) {
                if (!eventCategories.includes(e.eventType)) {
                    eventCategories.push(e.eventType);
                }
                if (e.eventType === "SPECIMEN") {
                    excludeDates[d.patientId].push(e.startNumberOfDaysSinceDiagnosis);
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
        this.maxTP = maxTP;
        this.sampleTimelineMap = sampleTimelineMap;
        this.timepointStore.setNumberOfPatients(allPatients.length);
        this.patientOrderPerTimepoint = allPatients;
        this.patientsPerTimepoint = patientsPerTimepoint;
        this.eventCategories = eventCategories;
        this.actualTimeLine = this.getTimeLine(sampleTimelineMap, this.timepointStructure, sampleStructure, maxTP);
        this.buildTimepointStructure(sampleStructure, maxTP);
        this.buildTransitionStructure();
        this.buildTimeGapStructure(sampleTimelineMap, this.timepointStructure, sampleStructure, maxTP);
        this.getEventAttributes(excludeDates);


    }

    /**
     * builds a simple timepoint structure
     * @param sampleStructure
     * @param numberOfTimepoints
     * @returns {Array} timepointStructure
     */
    buildTimepointStructure(sampleStructure, numberOfTimepoints) {
        let timepointStructure = [];
        const _self = this;
        for (let i = 0; i < numberOfTimepoints; i++) {
            let patientSamples = [];
            this.cbioAPI.patients.forEach(function (d, j) {
                if (_self.minTP === 0) {
                    _self.minTP = sampleStructure[d.patientId].length;
                }
                else {
                    if (sampleStructure[d.patientId].length < _self.minTP) {
                        _self.minTP = sampleStructure[d.patientId].length;
                    }
                }
                if (sampleStructure[d.patientId].length > i) {
                    patientSamples.push({patient: d.patientId, sample: sampleStructure[d.patientId][i][0]})
                }
            });
            timepointStructure.push(patientSamples);
        }
        this.timepointStructure = timepointStructure;
    }

    buildTransitionStructure() {
        let transitionStrucutre = [];
        this.patientsPerTimepoint.forEach(function (d, i) {
            if (i === 0) {
                transitionStrucutre.push(d);
            }
            transitionStrucutre.push(d);
        });
        this.transitionStructure = transitionStrucutre;
    }

    /**

     */
    buildTimeGapStructure(sampleTimelineMap, timepointStructure, sampleStructure, numberOfTimepoints) {
        this.timeGapMapping = {};
        const _self = this;
        for (let i = 0; i < numberOfTimepoints + 1; i++) {
            this.cbioAPI.patients.forEach(function (d, j) {
                if (!(d.patientId in _self.timeGapMapping)) {
                    _self.timeGapMapping[d.patientId] = [];
                }
                if (sampleStructure[d.patientId].length > i) {
                    if (i === 0) {
                        _self.timeGapMapping[d.patientId].push(undefined);
                    }
                    else {
                        _self.timeGapMapping[d.patientId].push(sampleTimelineMap[sampleStructure[d.patientId][i][0]].startNumberOfDaysSinceDiagnosis - sampleTimelineMap[sampleStructure[d.patientId][i - 1][0]].startNumberOfDaysSinceDiagnosis);
                    }
                }
                if (i === numberOfTimepoints && sampleStructure[d.patientId].length > i - 1) {
                    _self.timeGapMapping[d.patientId].push(undefined);
                }

            });
        }
    }

    /**
     * computes the maximum and minimum of a continuous mapper
     */
    static getMinMaxOfContinuous(mapper, type) {
        let max = Number.NEGATIVE_INFINITY;
        let min = Number.POSITIVE_INFINITY;
        if (type === "between") {
            for (let patient in mapper) {
                for (let i = 0; i < mapper[patient].length; i++) {
                    if (mapper[patient][i] > max) {
                        max = mapper[patient][i];
                    }
                    if (mapper[patient][i] < min) {
                        min = mapper[patient][i];
                    }
                }
            }
        }
        else {
            for (let sample in mapper) {
                if (mapper[sample] > max) {
                    max = mapper[sample];
                }
                if (mapper[sample] < min) {
                    min = mapper[sample];
                }
            }
        }
        return [min, max];

    }


    getTimeLine(sampleTimelineMap, timepointStructure, sampleStructure, numberOfTimepoints) {
        let timeLine = [];
        for (let i = 0; i < numberOfTimepoints; i++) {
            let patientSamples3 = [];
            this.cbioAPI.patients.forEach(function (d, j) {
                if (sampleStructure[d.patientId].length > i) {
                    patientSamples3.push(sampleTimelineMap[sampleStructure[d.patientId][i][0]].startNumberOfDaysSinceDiagnosis);
                }
            });
            timeLine.push(patientSamples3);
        }
        return timeLine;
    }


    /**
     * creates a dictionary mapping sample IDs onto clinical data
     * @returns {{}}
     */
    createClinicalSampleMapping() {
        const _self = this;
        _self.cbioAPI.clinicalSampleData.forEach(function (d) {
            let id;
            let hasId = _self.clinicalSampleCategories.map(function (f) {
                return f.originalId
            }).includes(d.clinicalAttributeId);
            if (hasId) {
                id = _self.clinicalSampleCategories.filter(function (f) {
                    return f.originalId === d.clinicalAttributeId;
                })[0].id;
            }
            else {
                id = uuidv4();
                _self.clinicalSampleCategories.push({
                    id: id,
                    variable: d.clinicalAttribute.displayName,
                    originalId: d.clinicalAttributeId,
                    datatype: d.clinicalAttribute.datatype
                });
            }
            if (!(id in _self.sampleMappers)) {
                _self.sampleMappers[id] = {}
            }
            let value = d.value;
            if (d.clinicalAttribute.datatype === "NUMBER") {
                value = parseFloat(value);
            }
            _self.sampleMappers[id][d.sampleId] = value;
        });
    }


    /**
     * creates a dictionary mapping sample IDs onto mutation counts
     * @returns {{}}
     */
    createMutationCountsMapping() {
        if (this.cbioAPI.mutationCounts.length !== 0) {
            this.hasMutationCount = true;
            const _self = this;
            this.sampleMappers[this.mutationCountId] = {};
            this.cbioAPI.mutationCounts.forEach(function (d) {
                _self.sampleMappers[_self.mutationCountId][d.sampleId] = d.mutationCount;
            });
        }
    }

    /**
     *creates a mapping of selected events to patients (OR)
     * @param eventType
     * @param selectedVariables
     * @param selectedCategory
     * @returns {any[]}
     */
    getEventMapping(eventType, selectedVariables, selectedCategory) {
        let mapper = {};
        const _self = this;
        for (let patient in this.cbioAPI.clinicalEvents) {
            if (!(patient in mapper)) {
                mapper[patient] = [];
            }
            let samples = [];
            //extract samples for current patient
            this.timepointStructure.forEach(function (g) {
                g.forEach(function (l) {
                    if (l.patient === patient) {
                        samples.push(l.sample);
                    }
                });
            });
            if (samples.length > 0) {
                let counter = 0;
                let currentStart = Number.NEGATIVE_INFINITY;
                let currentEnd = this.sampleTimelineMap[samples[counter]].startNumberOfDaysSinceDiagnosis;
                let i=0;
                while (i < this.cbioAPI.clinicalEvents[patient].length) {
                    if (mapper[patient].length <= counter) {
                        mapper[patient].push([]);
                    }
                    let start = this.cbioAPI.clinicalEvents[patient][i].startNumberOfDaysSinceDiagnosis;
                    let end = this.cbioAPI.clinicalEvents[patient][i].startNumberOfDaysSinceDiagnosis;
                    if (this.cbioAPI.clinicalEvents[patient][i].hasOwnProperty("endNumberOfDaysSinceDiagnosis")) {
                        end = this.cbioAPI.clinicalEvents[patient][i].endNumberOfDaysSinceDiagnosis;
                    }
                    if (RootStore.isInCurrentRange(this.cbioAPI.clinicalEvents[patient][i], currentStart, currentEnd)) {
                        let matchingId = _self.doesEventMatch(eventType, selectedVariables, selectedCategory, this.cbioAPI.clinicalEvents[patient][i]);
                        if (matchingId !== null) {
                            mapper[patient][counter].push({
                                variableId: matchingId,
                                value: true,
                                start: start,
                                end: end
                            });
                            _self.eventDetails.push({
                                time: counter,
                                patientId: patient,
                                eventDate: start,
                                eventEndDate: end,
                                varId: matchingId
                            });
                        }
                        i++;
                    }
                    else {
                        if (start >= currentEnd) {
                            currentStart = _self.sampleTimelineMap[samples[counter]].startNumberOfDaysSinceDiagnosis;
                            if (counter + 1 < samples.length) {
                                currentEnd = _self.sampleTimelineMap[samples[counter + 1]].startNumberOfDaysSinceDiagnosis;
                            }
                            else {
                                currentEnd = Number.POSITIVE_INFINITY;
                            }
                            counter++;
                        }
                        else{
                            i++;
                        }


                    }
                }
            }
        }
        return mapper;
    }

    /**
     * checks if an event has happened in a specific timespan
     * @param event
     * @param currMinDate
     * @param currMaxDate
     * @returns {boolean}
     */
    static isInCurrentRange(event, currMinDate, currMaxDate) {
        let isInRange = false;
        if (event.hasOwnProperty("endNumberOfDaysSinceDiagnosis")) {
            if (event.endNumberOfDaysSinceDiagnosis <= currMaxDate && event.startNumberOfDaysSinceDiagnosis >= currMinDate) {
                isInRange = true
            }

        }
        else if (event.startNumberOfDaysSinceDiagnosis < currMaxDate && event.startNumberOfDaysSinceDiagnosis >= currMinDate) {
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
        let matchingId = null;
        if (type === event.eventType) {
            values.forEach(function (d, i) {
                event.attributes.forEach(function (f) {
                    if (f.key === key && f.value === d.name) {
                        matchingId = d.id;
                    }
                })
            })
        }
        return matchingId;
    }

    /**
     * gets all the different attributes an event can have
     */
    getEventAttributes(excludeDates) {
        let attributes = {};
        for (let patient in this.cbioAPI.clinicalEvents) {
            this.cbioAPI.clinicalEvents[patient].forEach(function (d, i) {
                if (!excludeDates[patient].includes(d.startNumberOfDaysSinceDiagnosis)) {
                    if (!(d.eventType in attributes)) {
                        attributes[d.eventType] = {}
                    }
                    d.attributes.forEach(function (f, j) {
                        if (!(f.key in attributes[d.eventType])) {
                            attributes[d.eventType][f.key] = [];
                            attributes[d.eventType][f.key].push({name: f.value, id: uuidv4()});
                        }
                        else {
                            if (!attributes[d.eventType][f.key].map(function (g) {
                                    return g.name
                                }).includes(f.value)) {
                                attributes[d.eventType][f.key].push({name: f.value, id: uuidv4()});
                            }
                        }
                    })
                }
            })
        }
        this.eventAttributes = attributes;
    }

}

export default RootStore