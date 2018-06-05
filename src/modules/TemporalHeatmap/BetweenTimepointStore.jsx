import {extendObservable} from "mobx";
import SingleTimepoint from "./SingleTimepoint";
import VariableStore from "./VariableStore";
import uuidv4 from 'uuid/v4';


/*
stores information about betweenTimepoint
 */
class BetweenTimepointStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.variableStore = new VariableStore();
        this.sampleEventList = [];
        this.patientOrderForEvents = [];
        extendObservable(this, {
            timepoints: [],
        });
    }

    reset() {
        this.timepoints = [];
        this.variableStore.constructor();
    }

    /**
     * adds variable to heatmap timepointData
     * @param mapper
     * @param variableId
     */
    addHeatmapVariable(mapper, variableId) {
        let timepoints = this.timepoints.slice();
        const _self = this;
        this.rootStore.transitionStructure.forEach(function (d, i) {
            let variableData = [];
            d.forEach(function (f) {
                let value = mapper[i][f];
                variableData.push({
                    patient: f,
                    value: value
                });
            });
            _self.timepoints[i].heatmap.push({variable: variableId, sorting: 0, data: variableData});
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
                    if (f.key === key && f.value === d.name) {
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
                    if (f.key === key && f.value === d.name) {
                        hasAttribute = true;
                        // startDays = event.startNumberOfDaysSinceDiagnosis;


                    }
                });
                if (hasAttribute) {
                    if (event.endNumberOfDaysSinceDiagnosis) {
                        //sampleEvents[event.patientId+event.eventType+event.startNumberOfDaysSinceDiagnosis] = {
                        sampleEvents[event.patientId + event.startNumberOfDaysSinceDiagnosis] = {
                            "patientId": event.patientId,
                            "hasAttribute": hasAttribute,
                            "startNumberOfDaysSinceDiagnosis": event.startNumberOfDaysSinceDiagnosis,
                            "endNumberOfDaysSinceDiagnosis": event.endNumberOfDaysSinceDiagnosis
                        };
                    }
                    else {
                        sampleEvents[event.patientId + event.startNumberOfDaysSinceDiagnosis] = {
                            "patientId": event.patientId,
                            "hasAttribute": hasAttribute,
                            "startNumberOfDaysSinceDiagnosis": event.startNumberOfDaysSinceDiagnosis,
                            "endNumberOfDaysSinceDiagnosis": event.startNumberOfDaysSinceDiagnosis
                        };

                    }
                }
                hasAttribute = false;
                })
        }

        return sampleEvents;
    }

    /**
     * adds userdefined OR variable to timepoints
     * 1. Add heatmap sample data
     * 2. Regroup data at timepoints which are grouped
     * @param type
     * @param selectedValues
     * @param selectedKey
     * @param name
     */
    addORVariable(type, selectedValues, selectedKey, name) {
        const _self = this;
        // Add original variables to all variables
        selectedValues.forEach(function (d) {
            if (!_self.variableStore.hasVariable(d.id)) {
                _self.variableStore.addToAllVariables(d.id, d.name, "binary")
            }
        });
        // create new Id
        let derivedId = uuidv4();
        // add derived variable
        this.variableStore.addDerivedVariable(derivedId, name, "binary", selectedValues.map(function (d, i) {
            return d.id;
        }), "or", null);
        //initialize if the variable is the first variable to be added
        if (this.timepoints.length === 0) {
            this.rootStore.transitionOn=true;
            this.rootStore.realTime = false;
            for (let i = 0; i < this.rootStore.transitionStructure.length; i++) {
                this.timepoints.push(new SingleTimepoint(this.rootStore, this.variableStore.getById(derivedId), this.rootStore.transitionStructure[i], "between", i))
            }
            this.rootStore.timepointStore.initialize();
        }
        let timepoints = this.timepoints.slice();
        for (let j = 0; j < this.rootStore.transitionStructure.length; j++) {
            timepoints[j].heatmap.push({variable: derivedId, sorting: 0, data: []});
        }
        const addIndex = timepoints[0].heatmap.length - 1;

        let eventDetails = [];
        this.rootStore.patientOrderPerTimepoint.forEach(function (f) {
            let samples = [];
            _self.rootStore.timepointStructure.forEach(function (g) {
                g.forEach(function (l) {
                    if (l.patient === f) {
                        samples.push(l.sample);
                    }
                });
            });
            let currTimepoint = 0;
            let startAtEvent = 0;
            let eventDate = -1, eventEndDate;
            let eventCounter;

            //var a=false, b=false, c=false;

            //var findName;

            let getEventId = function(d) {
                return !d.derived && _self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes
                    .map(attr =>  attr.value===d.name)
                    .reduce((next, result) => result || next, false);
            }

            /*let getEventId = function(d) {

                a=false; b=false; c=false;

                if(_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes.length===3 && !d.derived){
                    a = d.name === (_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes[0].value);
                    b = d.name === (_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes[1].value );
                    c = d.name ===  (_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes[2].value ) ;
                    

                    if(a) findName=_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes[0].value;
                    if(b) findName=_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes[1].value;
                    if(c) findName=_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes[2].value;

                    //return a|| b || c;


                }  
                else if(_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes.length===2 && !d.derived){
                    a = d.name === (_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes[0].value);
                    b = d.name === (_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes[1].value );
                       
                    if(a) findName=_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes[0].value;
                    if(b) findName=_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes[1].value;

                    //return a||b;

                }  

                else{
                    a= (d.name === _self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes[0].value) && !d.derived;

                    if(a) findName=_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes[0].value;
                }  
                //console.log(findName);  
                return a || b || c;     
            };*/
            while (currTimepoint < samples.length + 1) {
                eventCounter = startAtEvent;
                let attributeFound = false;
                while (eventCounter < _self.rootStore.cbioAPI.clinicalEvents[f].length) {
                    let currMaxDate;
                    if (currTimepoint === samples.length) {
                        currMaxDate = Number.POSITIVE_INFINITY;
                    }
                    else {
                        currMaxDate = _self.rootStore.sampleTimelineMap[samples[currTimepoint]].startNumberOfDaysSinceDiagnosis;
                    }
                    const currEventInRange = BetweenTimepointStore.isInCurrentRange(_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter], currMaxDate);
                    if (currEventInRange) {
                        if (_self.doesEventMatch(type, selectedValues, selectedKey, _self.rootStore.cbioAPI.clinicalEvents[f][eventCounter])) {
                            attributeFound = true;
                        }
                        let dt = _self.eventStartDays(type, selectedValues, selectedKey, _self.rootStore.cbioAPI.clinicalEvents[f][eventCounter]);
                        let dt1 = Object.keys(dt);
                        if (dt1.length > 0) {
                            eventDate = Object.values(dt)[0].startNumberOfDaysSinceDiagnosis;
                            eventEndDate = Object.values(dt)[0].endNumberOfDaysSinceDiagnosis;
                            var variable = _self.variableStore.allVariables.find(getEventId);
                            var vId = variable.id;
                            var findName = variable.name;
                            eventDetails.push({
                                time: currTimepoint,
                                patientId: f,
                                eventDate: eventDate,
                                eventEndDate: eventEndDate,
                                eventType: _self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].eventType,
                                eventTypeDetailed: findName, //_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter].attributes[0].value,
                                varId: vId
                            });
                            _self.sampleEventList.push(dt);
                            _self.patientOrderForEvents.push(f);
                        }
                        if (eventCounter < _self.rootStore.cbioAPI.clinicalEvents[f].length - 1) {
                            const nextEventInRange = BetweenTimepointStore.isInCurrentRange(_self.rootStore.cbioAPI.clinicalEvents[f][eventCounter + 1], currMaxDate);
                            if (!nextEventInRange) {
                                startAtEvent = eventCounter + 1;
                                break;
                            }
                        }
                    }
                    eventCounter += 1;
                }
                timepoints[currTimepoint].heatmap[addIndex].data.push({
                    "patient": f,
                    "value": attributeFound,
                    "eventDate": eventDate,
                    "eventName": findName
                });
                eventDate = -1;
                currTimepoint += 1;
            }
        });

        this.rootStore.eventDetails = this.rootStore.eventDetails.concat(eventDetails);
        this.timepoints = timepoints;
        this.rootStore.timepointStore.regroupTimepoints();
    }

    /**
     *
     * @param variableId
     */
    addTimepointDistance(variableId) {
        if (!this.variableStore.hasVariable(variableId)) {
            this.variableStore.addOriginalVariable(variableId, "Timepoint Distance", "NUMBER");
            if (this.timepoints.length === 0) {
                this.rootStore.realTime = false;
                for (let i = 0; i < this.rootStore.transitionStructure.length; i++) {
                    this.timepoints.push(new SingleTimepoint(this.rootStore, this.variableStore.getById(variableId), this.rootStore.transitionStructure[i], "between", i))
                }
                this.rootStore.timepointStore.initialize();
            }
            this.addHeatmapVariable(this.rootStore.timeGapMapping, variableId);
            this.rootStore.timepointStore.regroupTimepoints();
        }
    }


    /**
     * Removes a variable from sample data
     * @param variableId
     */
    removeVariable(variableId) {


        //remove from eventDetails too;

        //console.log(this.rootStore.eventDetails);

        const _self=this;

        var indexToDelete=_self.variableStore.currentVariables.map(function (d) {
            return d.id
        }).indexOf(variableId);

        var originalIdsDel=_self.variableStore.currentVariables[indexToDelete].originalIds;


        var flag=false;

        //for(var j=0; j<originalIdsDel.length; j++){ //for every variable to delete

        Array.from(Array(originalIdsDel.length).keys()).forEach(
            function(j){
            _self.variableStore.currentVariables.forEach(function(d, i){ // go over the list of current variables
                var k=d.originalIds; //console.log(k);
                if(k.includes(originalIdsDel[j]) && i!==indexToDelete) {
                    //console.log("true");
                    flag=true;
                } 
                
                else {
                    //console.log("false");

                   
            
                }
            })
            if(!flag){
                for(var l=0; l<_self.rootStore.eventDetails.length; ){

                    //console.log(originalIds.includes(this.rootStore.eventDetails[i].varId));
                    
                    if(originalIdsDel[j].includes(_self.rootStore.eventDetails[l].varId)){
                        _self.rootStore.eventDetails.splice(l, 1);
                    }
                    else{ l++;}
                }
            }
            flag=false;
        })
        //}

        
       /* if(!flag){
            for(var i=0; i<this.rootStore.eventDetails.length; ){

                //console.log(originalIds.includes(this.rootStore.eventDetails[i].varId));
                
                if(originalIds.includes(this.rootStore.eventDetails[i].varId)){
                    this.rootStore.eventDetails.splice(i, 1);
                }
                else{ i++;}
            }
        }*/

        //console.log(this.rootStore.eventDetails);
        
        if (this.variableStore.currentVariables.length !== 1) {
            this.timepoints.forEach(function (d) {
                if (d.primaryVariable.id === variableId) {
                    d.adaptPrimaryVariable(variableId);
                }
            });
            const index = this.variableStore.currentVariables.map(function (d) {
                return d.id
            }).indexOf(variableId);
            for (let i = 0; i < this.timepoints.length; i++) {
                this.timepoints[i].heatmap.splice(index, 1);
            }
            this.variableStore.removeVariable(variableId);
            this.rootStore.timepointStore.regroupTimepoints();
        }
        //case: last timepoint variableId was removed
        else {
            this.rootStore.transitionOn=false;
            this.timepoints = [];
            this.variableStore.constructor();
            this.rootStore.timepointStore.initialize();
        }

   

    }
}


export default BetweenTimepointStore;