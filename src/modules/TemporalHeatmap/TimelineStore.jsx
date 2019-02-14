import {extendObservable} from "mobx";
import MapperCombine from "./MapperCombineFunctions";

/*
stores information about timepoints. Combines betweenTimepoints and sampleTimepoints
 */
class TimelineStore {
    constructor(rootStore, sampleStructure, sampleTimelineMap, survivalData) {
        this.rootStore = rootStore;
        this.sampleStructure = sampleStructure;
        this.sampleTimelineMap = sampleTimelineMap;
        this.survivalData = survivalData;
        extendObservable(this, {
            sampleTimeline: [],
            eventTimeline: []
        });

    }

    changeSampleTimelineData(primaryVariable) {
        let sampleTimeline = [];
        for (let patient in this.sampleStructure) {
            this.sampleStructure[patient].forEach(sample => {
                sampleTimeline.push({
                    patientId: patient,
                    sampleId: sample,
                    value: this.rootStore.dataStore.variableStores.sample.referencedVariables[primaryVariable].mapper[sample],
                    date: this.sampleTimelineMap[sample].startNumberOfDaysSinceDiagnosis
                });
            })

        }
        this.sampleTimeline.replace(sampleTimeline);
        console.log(this.sampleTimeline);
    }

    /*
    eventTimeline:
        {variableName, variableId, events:[patient, start, end, detail]}
     */
    changeEventTimelineData(variableIds) {
        this.eventTimeline = variableIds.map(variableId => {
            let variable = this.rootStore.dataStore.variableStores.between.referencedVariables[variableId];
            return ({variableId: variable.id, variableName: variable.name, events: this.filterEvents(variable)});
        });
        console.log(this.eventTimeline);
    }

    filterEvents(variable, events) {
        let filterMapper = {};
        if (variable.datatype === "BINARY") {
            filterMapper = variable.mapper;
        }
        if (variable.derived && variable.modificationType === "binaryCombine" && variable.modification.datatype === "STRING") {
            filterMapper = MapperCombine.createBinaryCombinedMapper(variable.originalIds.map(d => this.rootStore.dataStore.variableStores.between.getById(d).mapper),
                {operator: variable.modification.operator, datatype: "BINARY"}, []);
        }
        return events.filter((d) => filterMapper[d.sampleId]);
    }

    getAllEvents(variable, array) {
        if (variable.type === "event") {
            this.rootStore.eventTimelineMap[variable.id].forEach(d => array.push(d));
            return array;
        }
        else if (variable.type === "derived") {
            variable.originalIds.forEach(f => {
                this.getAllEvents(this.rootStore.dataStore.variableStores.between.referencedVariables[f], array);
            });
            return array;
        }
        else {
            return array;
        }
    }
}


export default TimelineStore;