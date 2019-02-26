import DataStore from "./TemporalHeatmap/stores/DataStore"

import VisStore from "./TemporalHeatmap/stores/VisStore.jsx"
import {action, extendObservable, observable, toJS} from "mobx";
import uuidv4 from 'uuid/v4';
import UndoRedoStore from "./UndoRedoStore";
import OriginalVariable from "./TemporalHeatmap/stores/OriginalVariable";
import MolProfileMapping from "./MolProfileMapping";
import SvgExport from "./SvgExport";
import cBioAPI from "../cBioAPI";


/*
gets the data with the cBioAPI and gives it to the other stores
 */
class RootStore {
    constructor(uiStore) {
        this.study = "";

        this.hasMutations = false;
        this.mutations = [];
        this.events = [];

        //maximum and minimum amount of timepoints a patient has in the dataset
        this.maxTP = 0;
        this.minTP = Number.POSITIVE_INFINITY;

        this.mutationCountId = uuidv4();
        this.timeDistanceId = uuidv4();

        this.clinicalSampleCategories = [];
        this.clinicalPatientCategories = [];
        this.availableProfiles = [];
        this.mutationMappingTypes = ["Binary", "Mutation type", "Protein change", "Variant allele frequency"];
        this.eventCategories = [];
        this.eventAttributes = [];
        this.patients = [];
        this.sampleTimelineMap = {};
        this.staticMappers = {};

        this.sampleStructure = [];
        extendObservable(this, {
            parsed: false,
            firstLoad: true,
            display: false,
            eventTimelineMap: observable.map(),

            timeVar: 1,
            timeValue: "days",

            timepointStructure: [],
            removeEvent: action(variableId => {
                this.eventTimelineMap.delete(variableId);
            }),
            /**
             * resets everything
             */
            reset: action(() => {
                this.parsed = false;
                this.dataStore.reset();
                this.resetTimepointStructure(false);
                this.addInitialVariable(this.clinicalSampleCategories[0].id);
                this.parsed = true;
            }),
            setTimeData: action((id, value) => {
                this.timeValue = value;
                this.timeVar = id;
            }),
            /**
             * resets the timepoint structure to the default alignment
             */
            resetTimepointStructure: action(update => {
                this.timepointStructure = [];
                for (let i = 0; i < this.maxTP; i++) {
                    let patientSamples = [];
                    this.patients.forEach((d, j) => {
                        if (this.minTP === 0) {
                            this.minTP = this.sampleStructure[d].length;
                        }
                        else {
                            if (this.sampleStructure[d].length < this.minTP) {
                                this.minTP = this.sampleStructure[d].length;
                            }
                        }
                        if (this.sampleStructure[d].length > i) {
                            patientSamples.push({patient: d, sample: this.sampleStructure[d][i]})
                        }
                    });
                    this.timepointStructure.push(patientSamples);
                }
                if (update) {
                    this.dataStore.update(this.patients);
                }
                else {
                    this.dataStore.initialize();
                }
            }),

            /*
            gets data from cBio and sets parameters in other stores
             */
            parseCBio: action((study, callback) => {
                this.staticMappers={};
                this.eventTimelineMap.clear();
                this.clinicalPatientCategories=[];
                this.clinicalSampleCategories=[];
                this.study = study;
                this.firstLoad = false;
                this.parsed = false;
                this.cbioAPI.getPatients(this.study.studyId, patients => {
                    this.patients = patients;
                    this.cbioAPI.getEvents(this.study.studyId, patients, events => {
                        this.events = events;
                        this.buildTimelineStructure();
                        this.createTimeGapMapping();
                        this.cbioAPI.getClinialPatientData(this.study.studyId, patients, data => {
                            this.createClinicalPatientMappers(data);
                        });
                        this.cbioAPI.getClinicalSampleData(this.study.studyId, data => {
                            this.createClinicalSampleMapping(data);
                            this.dataStore.initialize();
                            this.addInitialVariable(data[0].clinicalAttributeId);
                            callback();
                            this.visStore.fitToScreenWidth();
                            this.parsed = true;
                            this.firstLoad = false;
                            this.display = true;
                        });
                        this.cbioAPI.getAvailableMolecularProfiles(this.study.studyId, profiles => {
                            this.availableProfiles = profiles;
                            const mutationIndex = profiles.map(d => d.molecularAlterationType).indexOf("MUTATION_EXTENDED");
                            if (mutationIndex !== -1) {
                                this.hasMutations = true;
                                this.cbioAPI.getAllMutations(this.study.studyId, profiles[mutationIndex].molecularProfileId, data => {
                                    this.createMutationsStructure(data);
                                });
                                this.cbioAPI.getMutationCounts(this.study.studyId, profiles[mutationIndex].molecularProfileId, data => {
                                    this.createMutationCountsMapping(data);
                                });
                            }
                        })
                    })
                })
            }),

            /**
             * combines clinical events of sort "SPECIMEN" and clinical data in one datastructure,
             * sets some variables in the other stores
             */
            buildTimelineStructure: action(() => {
                let sampleStructure = {};
                let timelineStructure = [];
                let sampleTimelineMap = {};
                let eventCategories = [];
                let maxTP = 0;
                let minTP = Number.POSITIVE_INFINITY;
                let timepointStructure = [];
                let excludeDates = {};

                this.patients.forEach(patient => {
                    sampleStructure[patient] = [];
                    timelineStructure[patient] = [];
                    excludeDates[patient] = [];
                    let previousDate = -1;
                    let currTP = 0;
                    this.events[patient].forEach(e => {
                        if (!eventCategories.includes(e.eventType)) {
                            eventCategories.push(e.eventType);
                        }
                        if (e.eventType === "SPECIMEN") {
                            excludeDates[patient].push(e.startNumberOfDaysSinceDiagnosis);
                            sampleTimelineMap[e.attributes[1].value] = e.startNumberOfDaysSinceDiagnosis;
                            if (e.startNumberOfDaysSinceDiagnosis !== previousDate) {
                                sampleStructure[patient].push(e.attributes[1].value);
                                timelineStructure[patient].push({
                                    sampleId: e.attributes[1].value,
                                    date: e.startNumberOfDaysSinceDiagnosis
                                });
                                if (timepointStructure.length <= currTP) {
                                    timepointStructure.push([]);
                                }
                                timepointStructure[currTP].push({patient: patient, sample: e.attributes[1].value});
                                currTP += 1;

                            }
                            previousDate = e.startNumberOfDaysSinceDiagnosis;
                        }
                    });
                    if (sampleStructure[patient].length > maxTP) {
                        maxTP = currTP;
                    }
                    if (sampleStructure[patient].length < minTP) {
                        minTP = currTP;
                    }
                });
                this.maxTP = maxTP;
                this.minTP = minTP;
                this.sampleTimelineMap = sampleTimelineMap;
                this.eventCategories = eventCategories;
                this.sampleStructure = sampleStructure;
                this.timepointStructure = timepointStructure;
                this.createEventAttributes(excludeDates);
            }),
            /**
             * updates the timepoint structure after patients are moved up or down
             * @param patients
             * @param timepoint
             * @param up
             */
            updateTimepointStructure: action((patients, timepoint, up) => {
                const oldSampleTimepointNames = this.dataStore.variableStores.sample.childStore.timepoints.map(d => d.name);
                let timepointStructure = toJS(this.timepointStructure);
                if (!up) { //down movement
                    timepointStructure = timepointStructure.reverse();
                }
                for (let i = 0; i < timepointStructure.length; i++) {
                    patients.forEach(patient => {
                        let currIndex = timepointStructure[i].map(d => d.patient).indexOf(patient);
                        if (i !== 0) {
                            if (currIndex !== -1) {
                                let prevIndex = timepointStructure[i - 1].map(d => d.patient).indexOf(patient);
                                if (prevIndex === -1) {
                                    timepointStructure[i - 1].push(timepointStructure[i][currIndex]);
                                }
                                else {
                                    timepointStructure[i - 1][prevIndex] = timepointStructure[i][currIndex];
                                }
                                timepointStructure[i].splice(currIndex, 1);
                            }
                        }
                        else {
                            if (currIndex !== -1) {
                                timepointStructure.unshift([timepointStructure[i][currIndex]]);
                            }
                        }
                    });
                }
                if (timepointStructure[timepointStructure.length - 1].length === 0) {
                    timepointStructure.splice(timepointStructure.length - 1, 1);
                }
                if (!timepointStructure.map(d => d.length).includes(0)) {
                    if (!up) {
                        this.timepointStructure.replace(UndoRedoStore.deserializeTPStructure(this.timepointStructure, timepointStructure.reverse()));
                    }
                    else {
                        this.timepointStructure.replace(UndoRedoStore.deserializeTPStructure(this.timepointStructure, timepointStructure));
                    }
                }
                console.log(timepoint,this.dataStore.timepoints);
                this.dataStore.update(this.dataStore.timepoints[timepoint].heatmapOrder.slice());
                this.dataStore.variableStores.sample.childStore.updateNames(this.createNameList(up, this.dataStore.variableStores.sample.childStore.timepoints, oldSampleTimepointNames, patients));
            }),
            /**
             *creates a mapping of an events to sampleIDs (events are mapped to the subsequent event)
             * @param eventType
             * @param selectedVariable
             * @returns {any[]}
             */
            getSampleEventMapping: action((eventType, selectedVariable) => {
                let sampleMapper = {};
                this.eventTimelineMap.set(selectedVariable.id, []);
                for (let patient in this.events) {
                    let samples = [];
                    //extract samples for current patient
                    this.eventBlockStructure.forEach(g => {
                        g.forEach(l => {
                            if (l.patient === patient) {
                                if (!(l.sample in sampleMapper)) {
                                    sampleMapper[l.sample] = false;
                                }
                                samples.push(l.sample);
                            }
                        });
                    });
                    if (samples.length > 0) {
                        let counter = 0;
                        let currentStart = Number.NEGATIVE_INFINITY;
                        let currentEnd = this.sampleTimelineMap[samples[counter]];
                        let i = 0;
                        while (i < this.events[patient].length) {
                            let start = this.events[patient][i].startNumberOfDaysSinceDiagnosis;
                            let end = this.events[patient][i].startNumberOfDaysSinceDiagnosis;
                            if (this.events[patient][i].hasOwnProperty("endNumberOfDaysSinceDiagnosis")) {
                                end = this.events[patient][i].endNumberOfDaysSinceDiagnosis;
                            }
                            if (RootStore.isInCurrentRange(this.events[patient][i], currentStart, currentEnd)) {
                                let matchingId = this.doesEventMatch(eventType, selectedVariable, this.events[patient][i]);
                                if (matchingId !== null) {
                                    sampleMapper[samples[counter]] = true;
                                    let events = this.eventTimelineMap.get(matchingId).concat({
                                        time: counter,
                                        patientId: patient,
                                        sampleId: samples[counter],
                                        eventStartDate: start,
                                        eventEndDate: end,
                                    });
                                    this.eventTimelineMap.set(matchingId, events);
                                }
                                i++;
                            }
                            else {
                                if (start >= currentEnd) {
                                    currentStart = this.sampleTimelineMap[samples[counter]];
                                    if (counter + 1 < samples.length - 1) {
                                        currentEnd = this.sampleTimelineMap[samples[counter + 1]];
                                    }
                                    else {
                                        currentEnd = Number.POSITIVE_INFINITY;
                                    }
                                    counter++;
                                }
                                else {
                                    i++;
                                }
                            }
                        }
                    }
                }
                return sampleMapper;
            }),
            /**
             * gets block structure for events
             * @returns {Array}
             */
            get eventBlockStructure() {
                let transitionStructure = [];
                transitionStructure.push(this.timepointStructure[0].slice());
                for (let i = 1; i < this.timepointStructure.length; i++) {
                    let newEntry = this.timepointStructure[i].slice();
                    this.timepointStructure[i - 1].forEach(d => {
                        if (!(this.timepointStructure[i].map(d => d.patient).includes(d.patient))) {
                            newEntry.push({patient: d.patient, sample: d.sample + "_post"})
                        }
                    });
                    transitionStructure.push(newEntry);
                }
                transitionStructure.push(this.timepointStructure[this.timepointStructure.length - 1].map(d => ({
                    sample: d.sample + "_post",
                    patient: d.patient
                })));
                return transitionStructure;
            },
            /**
             * first and last day for each patient plus the very last state (DECEASED,LIVING,undefined)
             */
            get minMax() {
                let minMax = {};
                let survivalEvents = this.computeSurvival();
                for (let patient in this.sampleStructure) {
                    let value = undefined;
                    let max = Math.max(...this.sampleStructure[patient].map(d => this.sampleTimelineMap[d]));
                    let min = Math.min(...this.sampleStructure[patient].map(d => this.sampleTimelineMap[d]));
                    this.eventTimelineMap.forEach((value) => {
                        max = Math.max(max, Math.max(...value.filter(d => d.patientId === patient).map(d => d.eventEndDate)));
                        min = Math.min(min, Math.min(...value.filter(d => d.patientId === patient).map(d => d.eventStartDate)));
                    });
                    if (survivalEvents.map(d => d.patient).includes(patient)) {
                        let survivalEvent = survivalEvents.filter(d => d.patient === patient)[0];
                        if (survivalEvent.date > max) {
                            max = survivalEvent.date;
                            value = survivalEvent.status;
                        }
                    }
                    minMax[patient] = {start: min, end: max, value: value}
                }
                return minMax;
            },
            /**
             * very last event of all patients
             * @returns {number}
             */
            get maxTimeInDays() {
                let max = 0;
                for (let patient in this.minMax) {
                    if (this.minMax[patient].end > max) {
                        max = this.minMax[patient].end;
                    }
                }
                return max;
            },

        });
        this.reset = this.reset.bind(this);
        this.cbioAPI = new cBioAPI();
        this.molProfileMapping = new MolProfileMapping(this);
        this.dataStore = new DataStore(this);
        this.visStore = new VisStore(this);
        this.svgExport = new SvgExport(this);
        this.uiStore=uiStore;
    }

    /**
     * adds variable in the beginning or after reset
     * @param id: id of variable to add
     */
    addInitialVariable(id) {
        let initialVariable = this.clinicalSampleCategories.filter(d => d.id === id)[0];
        this.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable(initialVariable.id, initialVariable.variable, initialVariable.datatype, initialVariable.description, [], [], this.staticMappers[initialVariable.id], "clinSample", "clinical"));
        this.dataStore.globalPrimary = initialVariable.id;
    }

    /**
     * Adapts the old names of the timepoints to the new timepoint structure
     * @param up
     * @param timepoints
     * @param oldNames
     * @param patients
     * @returns {*}
     */
    createNameList(up, timepoints, oldNames, patients) {
        let newNames = oldNames;
        if (this.timepointStructure.length > oldNames.length) {
            if (up) {
                newNames.unshift("new");
            }
            else {
                newNames.push("new");
            }
        }
        else if (this.timepointStructure.length < oldNames.length) {
            if (up) {
                newNames.pop();
            }
            else {
                newNames.shift();
            }
        }
        else {
            let longestPatientTimeline = patients.every(patient => this.timepointStructure
                .filter(row => row.map(d => d.patient).includes(patient)).length === this.timepointStructure.length);
            if (longestPatientTimeline) {
                if (up) {
                    newNames.unshift("new");
                    newNames.pop();
                }
                else {
                    newNames.push("new");
                    newNames.shift();
                }
            }
        }
        return newNames;
    }

    /**
     * creates a dictionary mapping sample IDs onto clinical sample data
     */
    createClinicalSampleMapping(data) {
        data.forEach(d => {
            if (d)
                if (!(d.clinicalAttributeId in this.staticMappers)) {
                    this.clinicalSampleCategories.push({
                        id: d.clinicalAttributeId,
                        variable: d.clinicalAttribute.displayName,
                        datatype: d.clinicalAttribute.datatype,
                        description: d.clinicalAttribute.description
                    });
                    this.staticMappers[d.clinicalAttributeId] = {}
                }
            if (this.sampleStructure[d.patientId].includes(d.sampleId)) {
                if (d.clinicalAttribute.datatype !== "NUMBER") {
                    return this.staticMappers[d.clinicalAttributeId][d.sampleId] = d.value;
                }
                else {
                    return this.staticMappers[d.clinicalAttributeId][d.sampleId] = parseFloat(d.value);
                }
            }
        });

    }

    /**
     * creates a dictionary mapping sample IDs onto mutation counts
     */
    createMutationCountsMapping(data) {
        this.staticMappers[this.mutationCountId] = {};
        data.forEach(d => {
            this.staticMappers[this.mutationCountId][d.sampleId] = d.mutationCount;
        });
        this.clinicalSampleCategories.push({
            id: this.mutationCountId,
            variable: "Mutation Count",
            datatype: "NUMBER",
            description: "Number of mutations"
        });
    }

    /**
     * creates a dictionary mapping sample IDs onto time between timepoints
     */
    createTimeGapMapping() {
        let timeGapMapping = {};
        this.patients.forEach(d => {
            let curr = this.sampleStructure[d];
            for (let i = 1; i < curr.length; i++) {
                if (i === 1) {
                    timeGapMapping[curr[i - 1]] = undefined
                }
                timeGapMapping[curr[i]] = this.sampleTimelineMap[curr[i]] - this.sampleTimelineMap[curr[i - 1]]
            }
            timeGapMapping[curr[curr.length - 1] + "_post"] = undefined;
        });
        this.staticMappers[this.timeDistanceId] = timeGapMapping;

    }

    /**
     * creates data structure for mutations
     * @param data
     */
    createMutationsStructure(data) {
        this.mutations = {};
        data.forEach(mutation => {
            if (!(mutation.entrezGeneId in this.mutations)) {
                this.mutations[mutation.entrezGeneId] = [];
            }
            this.mutations[mutation.entrezGeneId].push({
                patientId: mutation.patientId,
                sampleId: mutation.sampleId,
                mutationType: mutation.mutationType,
                proteinChange: mutation.proteinChange,
                vaf: mutation.tumorAltCount / (mutation.tumorAltCount + mutation.tumorRefCount)
            });
        });

    }

    /**
     * creates dictionaries mapping sample IDs onto clinical patient data
     * @param data
     */
    createClinicalPatientMappers(data) {
        data.forEach(d => {
            d.forEach(d => {
                if (d)
                    if (!(d.clinicalAttributeId in this.staticMappers)) {
                        this.clinicalPatientCategories.push({
                            id: d.clinicalAttributeId,
                            variable: d.clinicalAttribute.displayName,
                            datatype: d.clinicalAttribute.datatype,
                            description: d.clinicalAttribute.description
                        });
                        this.staticMappers[d.clinicalAttributeId] = {}
                    }
                this.sampleStructure[d.patientId].forEach(f => {
                    if (d.clinicalAttribute.datatype !== "NUMBER") {
                        return this.staticMappers[d.clinicalAttributeId][f] = d.value;
                    }
                    else {
                        return this.staticMappers[d.clinicalAttributeId][f] = parseFloat(d.value);
                    }
                });
            })
        });
    }

    /*
    computes survival events if OS_MONTHS and OS_STATUS exist
     */
    computeSurvival() {
        const survivalMonths = "OS_MONTHS";
        const survivalStatus = "OS_STATUS";
        let survivalEvents = [];
        let hasStatus = this.clinicalPatientCategories.map(d => d.id).includes(survivalStatus);
        if (this.clinicalPatientCategories.map(d => d.id).includes(survivalMonths)) {
            for (let patient in this.sampleStructure) {
                let status = undefined;
                if (hasStatus) {
                    status = this.staticMappers[survivalStatus][this.sampleStructure[patient][0]];
                }
                survivalEvents.push({
                    patient: patient,
                    date: this.staticMappers[survivalMonths][this.sampleStructure[patient][0]] * 30,
                    status: status
                })
            }
        }
        return survivalEvents;
    }


    /**
     * checks of the selected event matches the current event
     * @param type
     * @param value
     * @param event
     * @returns {*}
     */
    doesEventMatch(type, value, event) {
        let matchingId = null;
        if (type === event.eventType) {
            event.attributes.forEach(f => {
                if (f.key === value.eventType && f.value === value.name) {
                    matchingId = value.id;
                }
            })
        }
        return matchingId;
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
            isInRange = (event.endNumberOfDaysSinceDiagnosis <= currMaxDate && event.endNumberOfDaysSinceDiagnosis > currMinDate) || (event.startNumberOfDaysSinceDiagnosis < currMaxDate && event.startNumberOfDaysSinceDiagnosis >= currMinDate);
        }
        else {
            isInRange = event.startNumberOfDaysSinceDiagnosis < currMaxDate && event.startNumberOfDaysSinceDiagnosis >= currMinDate;
        }
        return isInRange;
    }


    /**
     * gets all the different attributes an event can have
     */
    createEventAttributes(excludeDates) {
        this.eventAttributes = {};
        for (let patient in this.events) {
            this.events[patient].forEach(d => {
                if (!excludeDates[patient].includes(d.startNumberOfDaysSinceDiagnosis) || d.hasOwnProperty("endNumberOfDaysSinceDiagnosis")) {
                    if (!(d.eventType in this.eventAttributes)) {
                        this.eventAttributes[d.eventType] = {}
                    }
                    d.attributes.forEach(f => {
                        if (!(f.key in this.eventAttributes[d.eventType])) {
                            this.eventAttributes[d.eventType][f.key] = [];
                            this.eventAttributes[d.eventType][f.key].push({
                                name: f.value,
                                id: uuidv4(),
                                eventType: f.key
                            });
                        }
                        else {
                            if (!this.eventAttributes[d.eventType][f.key].map(g => {
                                return g.name
                            }).includes(f.value)) {
                                this.eventAttributes[d.eventType][f.key].push({
                                    name: f.value,
                                    id: uuidv4(),
                                    eventType: f.key
                                });
                            }
                        }
                    })
                }

            })
        }
    }
}

export default RootStore