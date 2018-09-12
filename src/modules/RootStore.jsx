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
        this.visStore = new VisStore(this);
        this.undoRedoStore = new UndoRedoStore(this);

        this.hasMutationCount = false;

        //maximum and minum amount of timepoints a patient has in the dataset
        this.maxTP = 0;
        this.minTP = Number.POSITIVE_INFINITY;

        this.clinicalSampleCategories = [];
        this.mutationCountId = "mutCount";
        this.timeDistanceId = "timeDist";
        this.eventCategories = [];
        this.eventAttributes = [];
        this.patientOrderPerTimepoint = [];
        this.sampleTimelineMap = {};
        this.sampleMappers = {};
        this.eventDetails = [];

        this.sampleStructure = [];

        //this.globalPrimary="";

        this.maxTimeInDays = 0;

        this.originalTimePointLength = 0;

        this.reset = this.reset.bind(this);

        extendObservable(this, {
            parsed: false,
            firstLoad: firstLoad,

            globalPrimary:'',

            timeVar: 1,
            timeValue: "days",

            timepointStructure: [],
            get actualTimeLine() {
                const _self = this;
                let timeline = [];
                this.timepointStructure.forEach(function (d) {
                    let singleTP = [];
                    d.forEach(function (f) {
                        singleTP.push(_self.sampleTimelineMap[f.sample].startNumberOfDaysSinceDiagnosis)
                    });
                    timeline.push(singleTP);
                });
                return timeline;
            },
            get transitionStructure() {
                let transitionStructure = [];
                transitionStructure.push(this.timepointStructure[0].map(d => d.patient));
                for (let i = 1; i < this.timepointStructure.length; i++) {
                    const _self = this;
                    let patients = this.timepointStructure[i - 1].map(d => d.patient);
                    this.timepointStructure[i].map(d => d.patient).forEach(function (d) {
                        if (!(_self.timepointStructure[i - 1].map(d => d.patient).includes(d))) {
                            patients.push(d);
                        }
                    });
                    transitionStructure.push(patients);
                    if (i === this.timepointStructure.length - 1) {
                        transitionStructure.push(this.timepointStructure[this.timepointStructure.length - 1].map(d => d.patient));
                    }
                }
                return transitionStructure;
            },
            get timeGapMapping() {
                let timeGapMapping = {};
                const _self = this;
                for (let i = 0; i < this.timepointStructure.length + 1; i++) {
                    this.cbioAPI.patients.forEach(function (d, j) {
                        if (!(d.patientId in timeGapMapping)) {
                            timeGapMapping[d.patientId] = [];
                        }
                        if (_self.sampleStructure[d.patientId].length > i) {
                            if (i === 0) {
                                timeGapMapping[d.patientId].push(undefined);
                            }
                            else {
                                timeGapMapping[d.patientId].push(_self.sampleTimelineMap[_self.sampleStructure[d.patientId][i][0]].startNumberOfDaysSinceDiagnosis - _self.sampleTimelineMap[_self.sampleStructure[d.patientId][i - 1][0]].startNumberOfDaysSinceDiagnosis);
                            }
                        }
                        if (i === _self.timepointStructure.length && _self.sampleStructure[d.patientId].length > i - 1) {
                            timeGapMapping[d.patientId].push(undefined);
                        }

                    });
                }
                return timeGapMapping;
            }

        })
    }

    /**
     * resets everything
     */
    reset() {
        this.parsed = false;
        this.timepointStore.globalTime = false;
        this.timepointStore.realTime = false;
        this.timepointStore.addAsGroup = false;
        this.timepointStore.selectedPatients = [];
        this.timepointStore.transitionOn = false;
        this.resetTimepointStructure(false);
        this.betweenTimepointStore.reset();
        this.sampleTimepointStore.initialize(this.clinicalSampleCategories[0].id, this.clinicalSampleCategories[0].variable, this.clinicalSampleCategories[0].datatype, "clinical", this.patientOrderPerTimepoint);
        this.undoRedoStore.saveVariableHistory("ADD VARIABLE", this.clinicalSampleCategories[0].variable);
        this.parsed = true;
        this.globalPrimary=this.clinicalSampleCategories[0].id;
    }

    /**
     * resets the timepoint structure to the default alignment
     */
    resetTimepointStructure(update) {
        let timepointStructure = [];
        const _self = this;
        for (let i = 0; i < this.maxTP; i++) {
            let patientSamples = [];
            this.cbioAPI.patients.forEach(function (d, j) {
                if (_self.minTP === 0) {
                    _self.minTP = _self.sampleStructure[d.patientId].length;
                }
                else {
                    if (_self.sampleStructure[d.patientId].length < _self.minTP) {
                        _self.minTP = _self.sampleStructure[d.patientId].length;
                    }
                }
                if (_self.sampleStructure[d.patientId].length > i) {
                    patientSamples.push({patient: d.patientId, sample: _self.sampleStructure[d.patientId][i][0]})
                }
            });
            timepointStructure.push(patientSamples);
        }
        this.timepointStructure = timepointStructure;
        this.eventDetails = [];
        if(update){
            this.sampleTimepointStore.update(this.patientOrderPerTimepoint);
            this.betweenTimepointStore.update();
        }
        this.timepointStore.initialize();
    }

    /*
    gets data from cBio and sets parameters in other stores
     */
    parseCBio() {
        const _self = this;
        this.firstLoad = false;
        this.cbioAPI.getAllData(this.study.studyId, function () {
            _self.buildPatientStructure();
            _self.createClinicalSampleMapping();
            _self.createMutationCountsMapping();

            // if (localStorage.getItem(_self.study.studyId) === null) {
            _self.sampleTimepointStore.initialize(_self.clinicalSampleCategories[0].id, _self.clinicalSampleCategories[0].variable, _self.clinicalSampleCategories[0].datatype, "clinical");
            _self.undoRedoStore.saveVariableHistory("ADD VARIABLE", _self.clinicalSampleCategories[0].variable);
            /*}
            else {
                _self.undoRedoStore.deserializeLocalStorage();
            }*/
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
        let minTP = Number.POSITIVE_INFINITY;
        let timepointStructure = [];
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
                        if (timepointStructure.length <= currTP) {
                            timepointStructure.push([]);
                        }
                        timepointStructure[currTP].push({patient: d.patientId, sample: e.attributes[1].value});
                        currTP += 1;

                    }
                    else {
                        sampleStructure[d.patientId][currTP - 1].push(e.attributes[1].value);
                    }
                    previousDate = e.startNumberOfDaysSinceDiagnosis;
                }
            });
            if (sampleStructure[d.patientId].length > maxTP) {
                maxTP = currTP;
            }
            if (sampleStructure[d.patientId].length < minTP) {
                minTP = currTP;
            }
        });
        this.maxTP = maxTP;
        this.minTP = minTP;
        this.sampleTimelineMap = sampleTimelineMap;
        this.timepointStore.setNumberOfPatients(allPatients.length);
        this.patientOrderPerTimepoint = allPatients;
        this.eventCategories = eventCategories;
        this.sampleStructure = sampleStructure;
        this.timepointStructure = timepointStructure;
        this.getEventAttributes(excludeDates);

        this.originalTimePointLength = this.actualTimeLine.length;
    }


    sortByPatientOrder(ObjectStructure) {
        return ObjectStructure.sort((d1, d2) => {
            return this.patientOrderPerTimepoint.indexOf(d1.patient) - this.patientOrderPerTimepoint.indexOf(d2.patient);
        })
    }

    /**
     * updates the timepoint structure after a patient is moved up or down
     * @param patient
     * @param timepoint
     * @param xposition
     * @param up
     */
    updateTimepointStructure(patient, timepoint, up) {
        var timeline = this.timepointStructure[timepoint];

        //var element = timeline[xposition];

        var index = this.timepointStructure[timepoint].map(d => d.patient).indexOf(patient);


        var indexedElements;

        var element = timeline[index];

        var el, el2;

        el = element;

        const _self = this;

        if (up === 0) { //down movement
            if (timepoint === this.timepointStore.timepoints.length - 1) {
                _self.timepointStructure.push([el]);
            }
            else {
                for (let i = timepoint; i < this.sampleTimepointStore.timepoints.length; i++) {
                    if (i + 1 < _self.timepointStructure.length) {
                        indexedElements = _self.timepointStructure[i + 1]
                            .filter(d => d)
                            .map((d, j) => {
                                return {index: j, patient: d.patient};
                            }).find(d => d.patient === patient);
                        //}).find(d => d.patient===element.patient);
                        //if(_self.timepointStructure[i+1].map(d=>d.patient).includes(patient)){
                        if (indexedElements) {
                            el2 = _self.timepointStructure[i + 1][indexedElements.index];
                            _self.timepointStructure[i + 1][indexedElements.index] = el;
                            el = el2;
                        }
                        else {
                            //_self.timepointStructure[i + 1].push(el);
                            //_self.patientsPerTimepoint[i + 1].push(el.patient);
                            _self.timepointStructure[i + 1].push(el);
                            _self.timepointStructure[i + 1] = _self.sortByPatientOrder(_self.timepointStructure[i + 1]);

                            break;
                        }

                    } else {
                        _self.timepointStructure.push([el]);
                    }


                }
            }


        }
        else { //up movement
            //if(timepoint=== 0){
            //do nothing right now
            //}
            //else{
            for (let i = timepoint; i >= 0; i--) {

                //el=_self.timepointStructure[i][xposition];

                if ((i - 1) >= 0 && _self.timepointStructure[i - 1]) { //if the timeline exists

                    indexedElements = _self.timepointStructure[i - 1]
                        .filter(d => d)
                        .map((d, j) => {
                            return {index: j, patient: d.patient};
                        }).find(d => d.patient === patient);
                    //}).find(d => d.patient===element.patient);
                    //if(_self.timepointStructure[i+1].map(d=>d.patient).includes(patient)){
                    if (indexedElements) {
                        //el=_self.timepointStructure[i][indexedElements.index];
                        el2 = _self.timepointStructure[i - 1][indexedElements.index];
                        _self.timepointStructure[i - 1][indexedElements.index] = el;

                        el = el2;
                    }
                    else {
                        //_self.timepointStructure[i - 1].push(el);
                        //_self.patientsPerTimepoint[i - 1].push(el.patient);
                        _self.timepointStructure[i - 1].push(el);
                        _self.timepointStructure[i - 1] = _self.sortByPatientOrder(_self.timepointStructure[i - 1]);
                        break;
                    }

                }
                else {
                    _self.timepointStructure.unshift([el]);
                }


            }
            //}


        } //else end


        timeline.splice(index, 1);

        this.timepointStructure = this.timepointStructure.filter(struct => struct.length);
        this.visStore.resetTransitionSpace();
        let heatmapOrder = this.timepointStore.timepoints[timepoint].heatmapOrder.slice();
        this.eventDetails = [];
        this.sampleTimepointStore.update(heatmapOrder);
        this.betweenTimepointStore.update();
        //this.timepointStore.applyPatientOrderToAll(timepoint);
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
                id = d.clinicalAttributeId;
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
                let i = 0;
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
                        else {
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
                //if(!excludeDates[patient].includes(d.startNumberOfDaysSinceDiagnosis)||d.hasOwnProperty("endNumberOfDaysSinceDiagnosis")) {    
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

        //console.log(attributes);
        this.eventAttributes = attributes;
    }

}

export default RootStore