import TransitionStore from "./TemporalHeatmap/TransitionStore.jsx"
import DataStore from "./TemporalHeatmap/DataStore"

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

        this.hasMutations = false;

        //maximum and minum amount of timepoints a patient has in the dataset
        this.maxTP = 0;
        this.minTP = Number.POSITIVE_INFINITY;

        this.clinicalSampleCategories = [];
        this.mutationCountId = "mutCount";
        this.timeDistanceId = "timeGapMapping";
        this.eventCategories = [];
        this.eventAttributes = [];
        this.patientOrderPerTimepoint = [];
        this.sampleTimelineMap = {};
        this.eventTimelineMap = {};
        this.staticMappers = {};

        this.sampleStructure = [];

        this.reset = this.reset.bind(this);

        this.exportSVG = this.exportSVG.bind(this);
        //this.onSubmit = this.onSubmit.bind(this);

        extendObservable(this, {
            parsed: false,
            firstLoad: firstLoad,


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
                const _self = this;
                let transitionStructure = [];
                transitionStructure.push(this.timepointStructure[0].slice());
                for (let i = 1; i < this.timepointStructure.length; i++) {
                    let newEntry = this.timepointStructure[i].slice();
                    this.timepointStructure[i - 1].forEach(function (d) {
                        if (!(_self.timepointStructure[i].map(d => d.patient).includes(d.patient))) {
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
            get maxTimeInDays() {
                let max = 0;
                for (let variable in this.eventTimelineMap) {
                    for (let i = 0; i < this.eventTimelineMap[variable].length; i++) {
                        if (this.eventTimelineMap[variable][i].eventEndDate > max) {
                            max = this.eventTimelineMap[variable][i].eventEndDate;
                        }
                    }
                }
                for (let sample in this.sampleTimelineMap) {
                    if (this.sampleTimelineMap[sample].startNumberOfDaysSinceDiagnosis > max) {
                        max = this.sampleTimelineMap[sample].startNumberOfDaysSinceDiagnosis;
                    }
                }
                return max;
            }

        });
        this.timepointStore = new DataStore(this);
        this.transitionStore = new TransitionStore(this);
        this.visStore = new VisStore(this);
        this.undoRedoStore = new UndoRedoStore(this);
    }


    /*onSubmit = (e) => {
        e.preventDefault();
        // get our form data out of state
        const {results} = this.state;

        axios.post('/', { results })
          .then((result) => {
            //access the results here....
            console.log(result)
          });
      }*/
    exportSVG(){
        var tmp;
        if(this.timepointStore.globalTime) {
            tmp = document.getElementById("timeline-view");
        } else {
            tmp = document.getElementById("block-view");
        }
        var svg_all = tmp.getElementsByTagName("svg");

        var print_svg='';
        var minW=null, minH=null, maxW=null, maxH=null;

        var prev_right=0, new_x, new_right, prev_x=0;


        for(var i=0; i<svg_all.length; i++){
            var t = "";
            for(var c = 0; c<svg_all[i].children.length; c++) {
                var child = svg_all[i].children[c];
                t = t + (new XMLSerializer()).serializeToString(child);
            };
            var boundingRect = svg_all[i].getBoundingClientRect();

            new_x=boundingRect.x, new_right=boundingRect.right;

            if(minW==null || boundingRect.left<minW) {
                minW = boundingRect.left;
            }
            if(maxW==null || boundingRect.right>maxW) {
                maxW = boundingRect.right;
                new_x=maxW;
            }
            if(minH==null || boundingRect.top>minH) {
                minH = boundingRect.top;
            }
            if(maxH==null || boundingRect.bottom>maxH) {
                maxH = boundingRect.bottom;
            }

            new_x= boundingRect.x;
            new_right=boundingRect.right;

            if(boundingRect.x<prev_right){
                
                new_right=prev_right+boundingRect.width;
                new_x=prev_right;
            }

            prev_right=new_right-1;
            prev_x=new_x-1;

            print_svg= print_svg + 
                    '<g width="' +boundingRect.width + '" height= "' + boundingRect.height + '" transform="translate(' + new_x+ ','+boundingRect.y+')" >' +
                    
                      t  +

                    '</g>';
        }

        var svg_xml = '<svg xmlns="http://www.w3.org/2000/svg" width = "' +(minW+maxW).toString() + '" height= "' + (minH+maxH).toString() + '">' +
                    
                        print_svg  +

                    '</svg>';


        // Submit the <FORM> to the server.
        // The result will be an attachment file to download.
        var form = document.getElementById("svgform");
       // form['output_format'].value = output_format;
        //form['data'].value = svg_xml ;

        form[0].value = "svg";
        form[1].value = svg_xml ;
        this.downloadFile(svg_xml);
    }


    downloadFile(content) {
        var element = document.createElement("a");
        var file = new Blob([content], {type: 'image/svg+xml'});
        element.href = URL.createObjectURL(file);
        element.download = "download.svg";
        //element.target = "_blank";
        element.click();
    }
    /**
     * resets everything
     */
    reset() {
        this.parsed = false;
        this.timepointStore.reset();
        this.resetTimepointStructure(false);
        let initialVariable = this.clinicalSampleCategories[0];
        this.timepointStore.variableStores.sample.addOriginalVariable(initialVariable.id, initialVariable.variable, initialVariable.datatype, initialVariable.description, [], true, this.staticMappers[initialVariable.id]);
        this.timepointStore.globalPrimary = initialVariable.id;
        this.parsed = true;
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
        if (update) {
            this.timepointStore.update(this.patientOrderPerTimepoint);
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
            _self.timepointStore.initialize();

            /*if (localStorage.getItem(_self.study.studyId) !== null) {
                const confirm = window.confirm("Load from local storage?");
                if (confirm) {
                    _self.undoRedoStore.deserializeLocalStorage();
                }
                else {
                    let initialVariable = _self.clinicalSampleCategories[0];
                    _self.timepointStore.variableStores.sample.addOriginalVariable(initialVariable.id, initialVariable.variable, initialVariable.datatype, initialVariable.description, [], true, _self.staticMappers[initialVariable.id]);
                    _self.timepointStore.globalPrimary = initialVariable.id;
                }
            } else {*/
            let initialVariable = _self.clinicalSampleCategories[0];
            _self.timepointStore.variableStores.sample.addOriginalVariable(initialVariable.id, initialVariable.variable, initialVariable.datatype, initialVariable.description, [], true, _self.staticMappers[initialVariable.id]);
            _self.timepointStore.globalPrimary = initialVariable.id;
            //}
            _self.parsed = true;

        });
    }

    /**
     * Gets all currently selected mutations
     * @param HUGOsymbols
     * @param mappingType
     */
    getMutationsAllAtOnce(HUGOsymbols, mappingType) {
        const _self = this;
        let datatype;
        if (mappingType === "binary") {
            datatype = "binary";
        }
        else if (mappingType === "vaf") {
            datatype = "NUMBER"
        }
        else {
            datatype = "STRING"
        }
        _self.cbioAPI.getGeneIDs(HUGOsymbols, function (entrezIDs) {
                if (entrezIDs.length !== 0) {
                    _self.cbioAPI.getAllMutations(_self.study.studyId, entrezIDs, function (response) {
                        let geneDict = {};
                        let noMutationsFound = [];
                        entrezIDs.forEach(function (d, i) {
                            const containedIds = response.filter(entry => entry.entrezGeneId === d.entrezGeneId);
                            geneDict[d.entrezGeneId] = containedIds;
                            if (containedIds.length === 0) {
                                noMutationsFound.push({hgncSymbol: d.hgncSymbol, entrezGeneId: d.entrezGeneId});
                            }
                        });
                        let confirm = false;
                        if (noMutationsFound.length > 0) {
                            confirm = window.confirm("WARNING: No mutations found for " + noMutationsFound.map(entry => entry.hgncSymbol) + "\n Add anyway?");
                        }
                        if (!confirm) {
                            noMutationsFound.forEach(function (d) {
                                delete geneDict[d.entrezGeneId];
                            });
                        }
                        for (let entry in geneDict) {
                            if (!_self.timepointStore.variableStores.sample.isDisplayed(entry + mappingType)) {
                                const symbol = entrezIDs.filter(d => d.entrezGeneId === parseInt(entry, 10))[0].hgncSymbol;
                                _self.timepointStore.variableStores.sample.addOriginalVariable(entry + mappingType, symbol + "_" + mappingType, datatype, 'mutation in ' + symbol + " " + mappingType, [], true, _self.createMutationMapping(geneDict[entry], entry, mappingType, confirm), true);
                            }
                        }
                    })
                }
            }
        )
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
        this.staticMappers["timeGapMapping"] = this.createTimeGapMapping();
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
     * @param up
     */
    updateTimepointStructure(patient, timepoint, up) {
        const oldSampleTimepointNames = this.timepointStore.variableStores.sample.childStore.timepoints.map(d => d.name);
        let timeline = this.timepointStructure[timepoint];
        const index = this.timepointStructure[timepoint].map(d => d.patient).indexOf(patient);
        let indexedElements;
        let element = timeline[index];
        let el2;
        const _self = this;
        if (!up) { //down movement
            if (timepoint === this.timepointStore.timepoints.length - 1) {
                _self.timepointStructure.push([element]);
            }
            else {
                for (let i = timepoint; i < this.timepointStore.variableStores.sample.childStore.timepoints.length; i++) {
                    if (i + 1 < _self.timepointStructure.length) {
                        indexedElements = _self.timepointStructure[i + 1]
                            .filter(d => d)
                            .map((d, j) => {
                                return {index: j, patient: d.patient};
                            }).find(d => d.patient === patient);
                        if (indexedElements) {
                            el2 = _self.timepointStructure[i + 1][indexedElements.index];
                            _self.timepointStructure[i + 1][indexedElements.index] = element;
                            element = el2;
                        }
                        else {
                            _self.timepointStructure[i + 1].push(element);
                            _self.timepointStructure[i + 1] = _self.sortByPatientOrder(_self.timepointStructure[i + 1]);
                            break;
                        }

                    } else {
                        _self.timepointStructure.push([element]);
                    }
                }
            }
        }
        else { //up movement
            for (let i = timepoint; i >= 0; i--) {
                if ((i - 1) >= 0 && _self.timepointStructure[i - 1]) { //if the timeline exists
                    indexedElements = _self.timepointStructure[i - 1]
                        .filter(d => d)
                        .map((d, j) => {
                            return {index: j, patient: d.patient};
                        }).find(d => d.patient === patient);
                    if (indexedElements) {
                        el2 = _self.timepointStructure[i - 1][indexedElements.index];
                        _self.timepointStructure[i - 1][indexedElements.index] = element;
                        element = el2;
                    }
                    else {
                        _self.timepointStructure[i - 1].push(element);
                        _self.timepointStructure[i - 1] = _self.sortByPatientOrder(_self.timepointStructure[i - 1]);
                        break;
                    }
                }
                else {
                    _self.timepointStructure.unshift([element]);
                }
            }
        } //else end
        timeline.splice(index, 1);
        this.timepointStructure = this.timepointStructure.filter(struct => struct.length);
        let heatmapOrder = this.timepointStore.timepoints[timepoint].heatmapOrder.slice();
        this.timepointStore.update(heatmapOrder, this.createNameList(up, this.timepointStore.variableStores.sample.childStore.timepoints, oldSampleTimepointNames, patient));

    }

    /**
     * Adapts the old names of the timepoints to the new timepoint structure
     * @param up
     * @param timepoints
     * @param oldNames
     * @param patient
     * @returns {*}
     */
    createNameList(up, timepoints, oldNames, patient) {
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
            let longestPatientTimeline = true;
            this.timepointStructure.forEach(function (d) {
                if (!(d.map(d => d.patient).includes(patient))) {
                    longestPatientTimeline = false;
                }
            });
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
                    datatype: d.clinicalAttribute.datatype,
                    description: d.clinicalAttribute.description
                });
            }
            if (!(id in _self.staticMappers)) {
                _self.staticMappers[id] = {}
            }
            let value = d.value;
            if (d.clinicalAttribute.datatype === "NUMBER") {

                //console.log("here ............");
                //console.log(id);

                //console.log(d);

                value = parseFloat(value);
                if(id==='mutCount'){
                    console.log(id);
                }
            }
            _self.staticMappers[id][d.sampleId] = value;
        });
    }

    /**
     * creates a dictionary mapping sample IDs onto mutation counts
     * @returns {{}}
     */
    createMutationCountsMapping() {
        if (this.cbioAPI.mutationCounts.length !== 0) {
            this.hasMutations = true;
            const _self = this;
            this.staticMappers[this.mutationCountId] = {};
            this.cbioAPI.mutationCounts.forEach(function (d) {
                _self.staticMappers[_self.mutationCountId][d.sampleId] = d.mutationCount;
            });
        }
        else{
            console.log("test.....");
        }
    }

    /**
     * creates a dictionary mapping sample IDs onto time between timepoints
     */
    createTimeGapMapping() {
        let timeGapMapping = {};
        const _self = this;
        this.cbioAPI.patients.forEach(function (d) {
            let curr = _self.sampleStructure[d.patientId];
            for (let i = 1; i < curr.length; i++) {
                if (i === 1) {
                    curr[i - 1].forEach(f => timeGapMapping[f] = undefined)
                }
                curr[i].forEach(f => timeGapMapping[f] = _self.sampleTimelineMap[curr[i][0]].startNumberOfDaysSinceDiagnosis - _self.sampleTimelineMap[curr[i - 1][0]].startNumberOfDaysSinceDiagnosis)
            }
        });
        return timeGapMapping;

    }


    /**
     * creates sample id mapping for mutations
     * @param list
     * @param geneId
     * @param mappingType
     * @param addEmptyVariables
     */
    createMutationMapping(list, geneId, mappingType, addEmptyVariables) {
        let mappingFunction;
        if (mappingType === "binary") {
            mappingFunction = function (currentSample) {
                return (list.filter(d => d.sampleId === currentSample).length > 0)
            }
        }
        else if (mappingType === "proteinChange") {
            mappingFunction = function (currentSample) {
                const entry = list.filter(d => d.sampleId === currentSample)[0];
                let proteinChange = 'wild type';
                if (entry !== undefined) {
                    proteinChange = entry.proteinChange;
                }
                return (proteinChange);
            }
        }
        else if (mappingType === "mutationType") {
            mappingFunction = function (currentSample) {
                const entry = list.filter(d => d.sampleId === currentSample)[0];
                let mutationType = 'wild type';
                if (entry !== undefined) {
                    mutationType = entry.mutationType;
                }
                return (mutationType);
            }
        }
        else {
            mappingFunction = function (currentSample) {
                const entry = list.filter(d => d.sampleId === currentSample)[0];
                let vaf = undefined;
                if (entry !== undefined && entry.mutationType === "Missense_Mutation") {
                    vaf = entry.tumorAltCount / (entry.tumorAltCount + entry.tumorRefCount);
                }
                return (vaf);
            }
        }
        let mapper = {};
        this.timepointStructure.forEach(function (d) {
            d.forEach(function (f) {
                if (list.length === 0) {
                    mapper[f.sample] = undefined;
                }
                else {
                    mapper[f.sample] = mappingFunction(f.sample);
                }
            });
        });
        return mapper;
    }


    /**
     *creates a mapping of an events to sampleIDs (events are mapped to the subsequent event)
     * @param eventType
     * @param selectedVariable
     * @returns {any[]}
     */
    getSampleEventMapping(eventType, selectedVariable) {
        let sampleMapper = {};
        this.eventTimelineMap[selectedVariable.id] = [];
        const _self = this;
        for (let patient in this.cbioAPI.clinicalEvents) {
            let samples = [];
            //extract samples for current patient
            this.transitionStructure.forEach(function (g) {
                g.forEach(function (l) {
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
                let currentEnd = this.sampleTimelineMap[samples[counter]].startNumberOfDaysSinceDiagnosis;
                let i = 0;
                while (i < this.cbioAPI.clinicalEvents[patient].length) {
                    let start = this.cbioAPI.clinicalEvents[patient][i].startNumberOfDaysSinceDiagnosis;
                    let end = this.cbioAPI.clinicalEvents[patient][i].startNumberOfDaysSinceDiagnosis;
                    if (this.cbioAPI.clinicalEvents[patient][i].hasOwnProperty("endNumberOfDaysSinceDiagnosis")) {
                        end = this.cbioAPI.clinicalEvents[patient][i].endNumberOfDaysSinceDiagnosis;
                    }
                    if (RootStore.isInCurrentRange(this.cbioAPI.clinicalEvents[patient][i], currentStart, currentEnd)) {
                        let matchingId = _self.doesEventMatch(eventType, selectedVariable, this.cbioAPI.clinicalEvents[patient][i]);
                        if (matchingId !== null) {
                            sampleMapper[samples[counter]] = true;
                            _self.eventTimelineMap[matchingId].push({
                                time: counter,
                                patientId: patient,
                                sampleId: samples[counter],
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
                            if (counter + 1 < samples.length - 1) {
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
        return sampleMapper;
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
            event.attributes.forEach(function (f) {
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
            if ((event.endNumberOfDaysSinceDiagnosis <= currMaxDate && event.endNumberOfDaysSinceDiagnosis > currMinDate) || (event.startNumberOfDaysSinceDiagnosis < currMaxDate && event.startNumberOfDaysSinceDiagnosis >= currMinDate)) {
                isInRange = true
            }

        }
        else if (event.startNumberOfDaysSinceDiagnosis < currMaxDate && event.startNumberOfDaysSinceDiagnosis >= currMinDate) {
            isInRange = true;
        }
        return isInRange;
    }


    /**
     * gets all the different attributes an event can have
     */
    getEventAttributes(excludeDates) {
        let attributes = {};
        for (let patient in this.cbioAPI.clinicalEvents) {
            this.cbioAPI.clinicalEvents[patient].forEach(function (d, i) {
                if (!excludeDates[patient].includes(d.startNumberOfDaysSinceDiagnosis) || d.hasOwnProperty("endNumberOfDaysSinceDiagnosis")) {
                    if (!(d.eventType in attributes)) {
                        attributes[d.eventType] = {}
                    }
                    d.attributes.forEach(function (f, j) {
                        if (!(f.key in attributes[d.eventType])) {
                            attributes[d.eventType][f.key] = [];
                            attributes[d.eventType][f.key].push({name: f.value, id: uuidv4(), eventType: f.key});
                        }
                        else {
                            if (!attributes[d.eventType][f.key].map(function (g) {
                                return g.name
                            }).includes(f.value)) {
                                attributes[d.eventType][f.key].push({name: f.value, id: uuidv4(), eventType: f.key});
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