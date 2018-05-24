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
        this.sampleEventList=[];
        this.patientOrderForEvents=[];
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
        //disable realtime view if a between variable is added
        this.rootStore.realTime=false;
          //one additional timepoint for events after the last samples
        this.timepoints.push(new SingleTimepoint(this.rootStore,variable,this.rootStore.patientsPerTimepoint[0],"between",0));
        for(let i=1;i<this.timepointStructure.length+1;i++){
            this.timepoints.push(new SingleTimepoint(this.rootStore,variable,this.rootStore.patientsPerTimepoint[i-1],"between",i))
        }
        this.rootStore.timepointStore.initialize();
    }
    reset(){
        this.timepoints=[];
        this.currentVariables=[];
    }


    addHeatmapVariable(type, selectedValues, selectedKey, name) {
        let timepoints = this.timepoints.slice();
        for (let j = 0; j < this.timepointStructure.length; j++) {
            timepoints[j].heatmap.push({variable: name, sorting: 0, data: []});
        }
        const addIndex = timepoints[0].heatmap.length - 1;
        const _self = this;

        let eventDetails=[];
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

            let eventDate=-1, eventEndDate;


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
                        let dt=_self.eventStartDays(type, selectedValues, selectedKey, _self.clinicalEvents[f][eventCounter]);
                        let dt1=Object.keys(dt);
                        
                        

                        if(dt1.length>0) {

                            eventDate=Object.values(dt)[0].startNumberOfDaysSinceDiagnosis;

                            eventEndDate=Object.values(dt)[0].endNumberOfDaysSinceDiagnosis;

                            eventDetails.push({time: currTimepoint, patientId: f, eventDate: eventDate, eventEndDate: eventEndDate});

                            _self.sampleEventList.push(dt);

                            _self.patientOrderForEvents.push(f);
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
                    "value": attributeFound,
                    "eventDate": eventDate
                });

                eventDate=-1;

                currTimepoint += 1;
            }
        });

        this.rootStore.eventDetails=this.rootStore.eventDetails.concat(eventDetails);
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
     * check if an event has a specific attribute (key-value pair) and return the number of days
     * @param type: type of the event (Status/Treatment/Surgery)
     * @param values
     * @param key
     * @param event
     * @returns {structure}
     */
    eventStartDays(type, values, key, event) {

        let sampleEvents = {};

        //let ddate=999;

        let hasAttribute = false;
        //let startDays = -1;
        if (type === event.eventType) {
            values.forEach(function (d, i) {
                event.attributes.forEach(function (f, j) {
                    if (f.key === key && f.value === d) {
                        hasAttribute = true;
                       // startDays = event.startNumberOfDaysSinceDiagnosis;

                       


                    }
                })

                if(hasAttribute){

                    if(event.endNumberOfDaysSinceDiagnosis){
                        //sampleEvents[event.patientId+event.eventType+event.startNumberOfDaysSinceDiagnosis] = {
                        sampleEvents[event.patientId+event.startNumberOfDaysSinceDiagnosis] = {    
                            "patientId": event.patientId,
                            "hasAttribute": hasAttribute,
                            "startNumberOfDaysSinceDiagnosis": event.startNumberOfDaysSinceDiagnosis,
                            "endNumberOfDaysSinceDiagnosis": event.endNumberOfDaysSinceDiagnosis
                        };
                    }
                    else{
                        sampleEvents[event.patientId+event.startNumberOfDaysSinceDiagnosis] = {
                            "patientId": event.patientId,
                            "hasAttribute": hasAttribute,
                            "startNumberOfDaysSinceDiagnosis": event.startNumberOfDaysSinceDiagnosis,
                            "endNumberOfDaysSinceDiagnosis": event.startNumberOfDaysSinceDiagnosis
                        };

                    }
                }
                /*else{
                    sampleEvents[event.patientId+event.eventType+"-1"] = {
                        "patientId": event.patientId,
                        "hasAttribute": hasAttribute,
                        "startNumberOfDaysSinceDiagnosis": -1
                    };

                }*/
              
                hasAttribute=false;


            })
        }
        
        return sampleEvents;
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

        this.rootStore.realTime=false;
        //this.rootStore.globalTime=false;

        this.rootStore.transitionOn=true;
        
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