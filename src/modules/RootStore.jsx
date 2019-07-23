import DataStore from "./TemporalHeatmap/stores/DataStore"

import VisStore from "./TemporalHeatmap/stores/VisStore.jsx"
import {action, extendObservable, observable, reaction, toJS} from "mobx";
import uuidv4 from 'uuid/v4';
import UndoRedoStore from "./UndoRedoStore";
import OriginalVariable from "./TemporalHeatmap/stores/OriginalVariable";
import MolProfileMapping from "./MolProfileMapping";
import SvgExport from "./SvgExport";
import cBioAPI from "../cBioAPI";
import FileAPI from "../FileAPI";
import LocalFileLoader from "../LocalFileLoader";
import GeneNamesLocalAPI from "../GeneNamesLocalAPI";

/*
Store containing all the other stores
gets the data with either the cBioAPI or from local files, transforms it and gives it to the other stores
 */
class RootStore {
    constructor(uiStore) {
        this.study = null; //current study
        this.patients = []; // patients ids in the current study

        this.events = []; // array of all events

        this.initialVariable = {}; // initial variable saved for reset

        this.scoreStructure = {};

        //this.scoreStructureTimeLine = {};

        this.TimeLineVariability = {};

        this.timeDistanceId = uuidv4(); // random id for time distance variable

        this.mutationMappingTypes = ["Binary", "Mutation type", "Protein change", "Variant allele frequency"]; // possible variable types of mutation data
        this.eventCategories = []; // available event types
        this.eventAttributes = []; // available event attributes
        this.sampleTimelineMap = {}; // map of sample ids to dates of sample collection
        this.staticMappers = {}; // mappers of sample id to pre-loaded variables (clinical sample data, clinical patient data)

        this.sampleStructure = {}; // structure of samples per patient

        this.api = null; // current api in use: cBioAPI or FileAPI
        this.molProfileMapping = new MolProfileMapping(this); // substore for loading mutation data and molecular data on demand
        this.dataStore = new DataStore(this); // substore containing the main data
        this.visStore = new VisStore(this); // substore for visual parameters of the visualiztion
        this.svgExport = new SvgExport(this); // substore for SVG export


        this.geneNamesAPI = new GeneNamesLocalAPI();
        this.localFileLoader = new LocalFileLoader(); // substore for loading local files
        this.uiStore = uiStore;

        extendObservable(this, {
            // current state of data and data parsing
            isOwnData: false,
            timelineParsed: false,
            variablesParsed: false,
            firstLoad: true,

            // maps event ids to event dates
            eventTimelineMap: observable.map(),

            // Global timeline: current axis scale
            timeVar: 1,
            timeValue: "days",

            // available clinical sample variables
            clinicalSampleCategories: [],
            // available clinical patient variables
            clinicalPatientCategories: [],
            // array of available molecular profiles
            availableProfiles: [],


            // current structure of sample timepoints
            timepointStructure: [],

            /**
             * removes an event
             * @param {string} variableId - id of event to be removed
             */
            removeEvent: action(variableId => {
                this.eventTimelineMap.delete(variableId);
            }),
            /**
             * resets everything
             */
            reset: action(() => {
                this.variablesParsed = false;
                this.dataStore.reset();
                this.resetTimepointStructure(false);
                this.addInitialVariable();
                this.variablesParsed = true;
            }),
            /**
             * sets global timeline axis scale
             * @param {number} id
             * @param {string} value
             */
            setTimeData: action((id, value) => {
                this.timeValue = value;
                this.timeVar = id;
            }),
            /**
             * sets if own data or cBio data is displayed
             * @param {boolean} isOwn
             */
            setIsOwnData: action(isOwn => {
                this.isOwnData = isOwn
            }),
            /**
             * resets the timepoint structure to the default alignment
             * @param {boolean} update - keep variables (true) or completely reset view (false)
             */
            resetTimepointStructure: action(update => {
                this.timepointStructure = [];
                for (let patient in this.sampleStructure) {
                    this.sampleStructure[patient].forEach((d, i) => {
                        if (this.timepointStructure.length === i) {
                            this.timepointStructure.push([]);
                        }
                        this.timepointStructure[i].push({patient: patient, sample: d})
                    })
                }
                if (update) {
                    this.dataStore.update(this.patients);
                }
                else {
                    this.dataStore.initialize();
                }
            }),
            /**
             * parses timeline data
             * @param {Object} study
             * @param {loadFinishedCallback} callback
             */
            parseTimeline: action((study, callback) => {
                this.study = study;
                if (this.isOwnData) {
                    this.api = new FileAPI(this.localFileLoader, this.geneNamesAPI);
                }
                else {
                    this.api = new cBioAPI(this.study.studyId);
                    this.geneNamesAPI.geneList = {};
                }
                this.staticMappers = {};
                this.scoreStructure = {};
                this.TimeLineVariability={};
                this.eventTimelineMap.clear();
                this.clinicalPatientCategories.clear();
                this.clinicalSampleCategories.clear();
                this.variablesParsed = false;
                this.timelineParsed = false;
                this.api.getPatients(patients => {
                    this.patients = patients;
                    this.api.getEvents(patients, events => {
                        this.events = events;
                        this.buildTimelineStructure();
                        this.createTimeGapMapping();

                        this.timelineParsed = true;
                        callback();
                    })
                })
            }),


            /*
           * calculate score for variability
           */


            //calculateVScore: action(() => {
            calculateVScore(){

            var SM= this.staticMappers;

            var ST=this.sampleStructure;

            var numOfPatients = Object.keys(ST).length;

            var timeLineLength=this.timepointStructure.length;

            let self=this;



            var dTypeRet=function(q){
                return self.clinicalSampleCategories
                    .filter(function(d){return d.id===q;})[0].datatype;
            };

            //let scoreStructure = {};
            var m=0;
            for(var i=1; i<Object.keys(SM).length; i++){
                var iK= Object.keys(SM)[i],
                iV= Object.values(SM)[i];

                //var dType = self.clinicalSampleCategories.filter(function(d){ if(d.id===iK) return d})[0].datatype;

                var dType= dTypeRet(iK);

                if(dType==="STRING"){
                    var all_vals=Object.values(iV);
                    var unique_vals=[...new Set(all_vals)];

                    var total_val=unique_vals.length;

                    //console.log("num of values: " + total_val);

                    //console.log("for " +iK +": score = ");

                    for(var j=0; j<Object.keys(ST).length; j++){
                        //console.log(Object.keys(ST)[j]);

                        for(var k=0; k<Object.values(ST)[j].length-1; k++){
                            //console.log(Object.values(ST)[j][k]);
                            if(iV[Object.values(ST)[j][k]]!== iV[Object.values(ST)[j][k+1]]){
                                //console.log(Object.values(ST)[j][k]);
                                //console.log(iV[Object.values(ST)[j][k]]);
                                //console.log(iV[Object.values(ST)[j][k+1]]);
                                m++;
                            }
                            else{
                                if(iK==="Timepoint"){
                                    //console.log(iV[Object.values(ST)[j][k]]);
                                    //console.log(iV[Object.values(ST)[j][k+1]]);
                                }
                            }
                        }

                    }

                    m=m/total_val;

                    m= m/timeLineLength;

                    m= this.getNumWithSetDec(m/numOfPatients,2);

                }
                else if(dType==="NUMBER"){
                    all_vals=Object.values(iV);
                    unique_vals=[...new Set(all_vals)];

                    //var total_val=unique_vals.length;

                    var range_val= Math.max(...all_vals)-Math.min(...all_vals) + 1;

                    //console.log("range: " + range_val);


                    //console.log("for " +iK +": score = ");

                    for( j=0; j<Object.keys(ST).length; j++){
                        //console.log(Object.keys(ST)[j]);

                        for( k=0; k<Object.values(ST)[j].length-1; k++){
                            //console.log(Object.values(ST)[j][k]);
                            if(iV[Object.values(ST)[j][k]]!== iV[Object.values(ST)[j][k+1]]){

                                m=m + Math.abs(iV[Object.values(ST)[j][k]] - iV[Object.values(ST)[j][k+1]]);

                            }
                        }

                    }

                    m=m/range_val;

                    m=m/timeLineLength;
                    
                    m = this.getNumWithSetDec(m/numOfPatients,2);

                }

                //console.log(m);

                this.scoreStructure[iK]=m;


                m=0;
            }

            //console.log(this.scoreStructure);

        //}),
        },


        getNumWithSetDec: action( (num, numOfDec ) =>{
            var pow10s = Math.pow( 10, numOfDec || 0 );
            return ( numOfDec ) ? Math.round( pow10s * num ) / pow10s : num;
        }),

        getAverageFromNumArr: action((numArr, numOfDec ) => {
            //if( !isArray( numArr ) ){ return false;	}
            var i = numArr.length,
                sum = 0;
            while( i-- ){
                sum += numArr[ i ];
            }
            return this.getNumWithSetDec( (sum / numArr.length ), numOfDec );
        }),

        getVariance: action((numArr, numOfDec ) => {
            //if( !isArray(numArr) ){ return false; }
            var avg = this.getAverageFromNumArr( numArr, numOfDec ),
                i = numArr.length,
                v = 0;

            //console.log("avg= "+avg);


            while( i-- ){
                v = v+ Math.pow( (numArr[ i ] - avg), 2 );
            }

            //console.log(v);

            v = v/numArr.length;

            //console.log(v);

            return this.getNumWithSetDec( v, numOfDec );
        }),

    


        calculateVScoreWithinTimeLine: action(() => {


            var SM= this.staticMappers;

            var ST=this.sampleStructure;

            let self=this;

            
            Object.keys(SM).forEach((iK,i) => {
                if(!i) {
                    return;
                }
                var iV= SM[iK];
                
                this.TimeLineVariability[iK]={};

                
                var dType = self.clinicalSampleCategories.filter((d) => d.id===iK)[0].datatype;

                if(dType==="STRING"){

                    var samples=Object.values(ST);

                    var sample_length=samples.map(function(d){return d.length});
                    

                    var max_sample=Math.max(...sample_length);

                    [...Array(max_sample).keys()].forEach(a => {

                    //for(var a=0; a<max_sample; a++){

                        //var r=[];

                        //samples.forEach(function(d){if(d[a]) r.push(d[a])});
                        var r = samples.filter(d=> d[a]).map((d)=>d[a]);

                        

                        //var set1 = new Set();

                        var temp=[];
                        for(var j=0; j<r.length; j++){
                            //set1.add(iV[r[j]]);
                            temp.push(iV[r[j]]);
                        }
                        
                        //console.log(temp);

                        var uniq=[...new Set(temp)];

                        var u_vals=[];

                        for(var x=0; x<uniq.length; x++){
                            let q=uniq[x];

                            let t_num=temp.filter(d=>d===q).length;

                            u_vals.push(t_num);



                        }

                        //console.log(u_vals);

                        //u_vals contains number of variables in each category. Now calculate the variability

                        //var m=0;

                        var t_v=0;

                        //console.log(iK);
                        //console.log("\n n is " + temp.length);
                        /*if(dType==="NUMBER"){
                            for(x=0; x<u_vals.length; x++){
                                if(temp.length * temp.length - temp.length !== 0){ //avoid divide by zero with this condition
                                    t_v=t_v + (u_vals[x]*(temp.length-u_vals[x]))/(temp.length * temp.length - temp.length);
                                }
                                else{
                                    t_v=t_v + (u_vals[x]*(temp.length-u_vals[x]));
                                }
                                
                            }
                        }*/
                        //else{
                            for(x=0; x<u_vals.length; x++){
                                t_v=t_v + (u_vals[x]*(temp.length-u_vals[x]))/(temp.length * temp.length);
                            }
                        //}
                        

                        //this.TimeLineVariability[iK][a]=set1.size; ///r.length;
                        
                        t_v= this.getNumWithSetDec(t_v,2);

                        this.TimeLineVariability[iK][a]= t_v;

                    });

                    

                }
                //standard deviation //DO NOT DELETE THIS YET
                else if(dType==="NUMBER"){ 

                    samples=Object.values(ST);

                    sample_length=samples.map(function(d){return d.length});
                    

                    max_sample=Math.max(...sample_length);

                    for(var a=0; a<max_sample; a++){

                        var r=[];

                        //samples.map(function(d){if(d[a]) r.push(d[a])});                 
                        //samples.filter(d=> {if(d[a]) r.push(d[a])});                 

                        for(let p=0; p<samples.length; p++){
                            if(samples[p][a]){
                                   r.push(samples[p][a]);
                               }
                           }
                        

                        //var set1 = new Set();

                        var temp=[];
                        for(var j=0; j<r.length; j++){
                            //set1.add(iV[r[j]]);
                            temp.push(iV[r[j]]);
                        }
                        
                        //console.log(temp);

                        
                        //this.TimeLineVariability[iK][a]=set1.size; ///r.length;
                        
                        var t_v=this.getVariance( temp, 2 ); //variance;

                        //get standard deviation

                        //t_v=this.getNumWithSetDec(Math.sqrt(this.getVariance( temp, 4 )), 2);
                        this.TimeLineVariability[iK][a]= t_v;

                    }



                } 
                
                //console.log(m);

                //this.TimeLineVariability[iK][a]= t_v;


               // m=0;
            });


            //console.log(this.TimeLineVariability);

        }),


            /**
             *  gets variable data and sets parameters
             *  @param {loadFinishedCallback} callback
             */
            parseCBio: action((callback) => {
                this.api.getAvailableMolecularProfiles(profiles => {
                    this.availableProfiles = profiles;
                    this.api.getClinicalSampleData(data => {
                        this.createClinicalSampleMapping(data);
                        if (data.length !== 0) {
                            this.initialVariable = this.clinicalSampleCategories[0];
                            this.initialVariable.source="clinSample";
                            this.variablesParsed = true;
                            this.firstLoad = false;
                        }
                        this.api.getClinicalPatientData(data => {
                            this.createClinicalPatientMappers(data);
                            if (data.length !== 0) {
                                if(!this.variablesParsed) {
                                    this.initialVariable = this.clinicalPatientCategories[0];
                                    this.initialVariable.source="clinPatient";
                                }
                                this.variablesParsed = true;
                                this.firstLoad = false;
                            }
                            callback();
                        })


                    });
                });


            }),
            /**
             * creates a dictionary mapping sample IDs onto clinical sample data
             * @param {Object[]} data - raw clinical sample data
             */
            createClinicalSampleMapping: action(data => {
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

                this.calculateVScore();

                this.calculateVScoreWithinTimeLine();

            }),
            /**
             * creates dictionaries mapping sample IDs onto clinical patient data
             * @param {Object[]} data - raw clinical patient data
             */
            createClinicalPatientMappers: action(data => {
                data.forEach(d => {
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
            }),


            /**
             * creates timepoint and sample structure
             */
            buildTimelineStructure: action(() => {
                let sampleStructure = {};
                let sampleTimelineMap = {};
                let eventCategories = [];
                let timepointStructure = [];
                let excludeDates = {};

                this.patients.forEach(patient => {
                    sampleStructure[patient] = [];
                    excludeDates[patient] = [];
                    let previousDate = -1;
                    let currTP = 0;
                    this.events[patient].forEach(e => {
                        if (!eventCategories.includes(e.eventType)) {
                            eventCategories.push(e.eventType);
                        }
                        if (e.eventType === "SPECIMEN") {
                            let sampleId = e.attributes.filter(d => d.key === "SAMPLE_ID")[0].value;
                            excludeDates[patient].push(e.startNumberOfDaysSinceDiagnosis);
                            sampleTimelineMap[sampleId] = e.startNumberOfDaysSinceDiagnosis;
                            if (e.startNumberOfDaysSinceDiagnosis !== previousDate) {
                                sampleStructure[patient].push(sampleId);
                                if (timepointStructure.length <= currTP) {
                                    timepointStructure.push([]);
                                }
                                timepointStructure[currTP].push({patient: patient, sample: sampleId});
                                currTP += 1;
                            }
                            previousDate = e.startNumberOfDaysSinceDiagnosis;
                        }
                    });
                });
                this.sampleTimelineMap = sampleTimelineMap;
                this.eventCategories = eventCategories;
                this.sampleStructure = sampleStructure;
                this.timepointStructure = timepointStructure;
                this.createEventAttributes(excludeDates);

            }),
            /**
             * updates the timepoint structure after patients are moved up or down
             * @param {string[]} patients - patients to be moves
             * @param {number} timepoint - index of timepoint that is moved
             * @param {boolean} up - up movement (true) or down movement (false)
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
                this.dataStore.update(this.dataStore.timepoints[timepoint].heatmapOrder.slice());
                this.dataStore.variableStores.sample.childStore.updateNames(this.createNameList(up, oldSampleTimepointNames, patients));
            }),
            /**
             * creates a mapping of an event to sampleIDs (events are mapped to the subsequent event)
             * @param {string} eventType - event Type of event variable
             * @param {Object} selectedVariable - event variable object with id and name
             * @returns {Object}
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
             * @returns {Object[][]}
             */
            get eventBlockStructure() {
                let eventBlockStructure = [];
                eventBlockStructure.push(this.timepointStructure[0].slice());
                for (let i = 1; i < this.timepointStructure.length; i++) {
                    let newEntry = this.timepointStructure[i].slice();
                    this.timepointStructure[i - 1].forEach(d => {
                        if (!(this.timepointStructure[i].map(d => d.patient).includes(d.patient))) {
                            newEntry.push({patient: d.patient, sample: d.sample + "_post"})
                        }
                    });
                    eventBlockStructure.push(newEntry);
                }
                eventBlockStructure.push(this.timepointStructure[this.timepointStructure.length - 1].map(d => ({
                    sample: d.sample + "_post",
                    patient: d.patient
                })));
                return eventBlockStructure;
            },
            /**
             * gets first and last day for each patient plus the very last state (DECEASED,LIVING,undefined) and maps it to patientIds
             * @return {Object}
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
        // initialize dataStore and add initial variable if variables are parsed
        reaction(() => this.variablesParsed, parsed => {
            if (parsed) {
                this.dataStore.initialize();
                this.addInitialVariable();
                this.visStore.fitToScreenHeight();
                this.visStore.fitToScreenWidth();
            }
        });
        // reset timelineParsed if data input is changed
        reaction(() => this.isOwnData, isOwnData => {
            if (isOwnData && !this.geneNamesAPI.geneListLoaded) {
                this.geneNamesAPI.getAllGeneSymbols();
            }
            this.timelineParsed = false;
        });
        // reset timelineParsed if eventsParsed in localFileLoader is reset
        reaction(() => this.localFileLoader.eventsParsed, parsed => {
            if (!parsed) {
                this.timelineParsed = false;
            }
        });
        // reacts to change in stacking mode
        reaction(() => this.uiStore.horizontalStacking,
            horizontalStacking => {
                if (horizontalStacking) {
                    //this.visStore.setGap(8);
                    this.visStore.setBandRectHeight(0);
                    this.visStore.setColorRectHeight(0);

                }
                else {
                    //this.visStore.setGap(1);
                    this.visStore.setBandRectHeight(15);
                    this.visStore.setColorRectHeight(2);
                }
            });
        this.reset = this.reset.bind(this);

    }

    /**
     * adds variable in the beginning or after reset
     */
    addInitialVariable() {
        this.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable(this.initialVariable.id, this.initialVariable.variable, this.initialVariable.datatype, this.initialVariable.description, [], [], this.staticMappers[this.initialVariable.id], this.initialVariable.source, "clinical"));
        this.dataStore.globalPrimary = this.initialVariable.id;
    }

    /**
     * Adapts the old names of the timepoints to the new timepoint structure
     * @param {boolean} up - up movement (true), down movement (false)
     * @param {string[]} oldNames
     * @param {string[]} patients
     * @returns {string[]}
     */
    createNameList(up, oldNames, patients) {
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
     * computes survival events if OS_MONTHS and OS_STATUS exist
     * @return {Object[]} - array of objects specifying patient, date and state of the survival event
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
     * @param {string} type
     * @param {Object} value
     * @param {Object} event
     * @returns {string} - matching id or null
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
     * @param {Object} event
     * @param {number} currMinDate
     * @param {number} currMaxDate
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
     * @param {number[]} excludeDates - dates to exclude
     */
    createEventAttributes(excludeDates) {
        this.eventAttributes = {};
        for (let patient in this.events) {
            this.events[patient].forEach(d => {
                //if (!excludeDates[patient].includes(d.startNumberOfDaysSinceDiagnosis) || d.hasOwnProperty("endNumberOfDaysSinceDiagnosis")) {
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
                //}
            })
        }
    }
}

export default RootStore