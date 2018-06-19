import {extendObservable} from "mobx";
import SingleTimepoint from "./SingleTimepoint"
import VariableStore from "./VariableStore";

/*
stores information about sample timepoints
 */
class SampleTimepointStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.variableStore = new VariableStore(rootStore);
        extendObservable(this, {
            timepoints: [],
            timeline: []
        });
    }


    /**
     * initialize fields, used after the fist variable is added.
     * @param variableId
     * @param variable
     * @param type
     */
    initialize(variableId, variable, type) {
        this.variableStore.constructor(this.rootStore);
        this.variableStore.addOriginalVariable(variableId, variable, type);
        this.timepoints = [];
        for (let i = 0; i < this.rootStore.timepointStructure.length; i++) {
            this.timepoints.push(new SingleTimepoint(this.rootStore, variableId, this.rootStore.patientsPerTimepoint[i], "sample", i));
            this.timeline.push({type:"sample",data:{}});
        }
        this.rootStore.timepointStore.initialize();
        this.addHeatmapVariable(variableId);
    }
    update(){
        this.timepoints=[];
        const _self=this;
        this.variableStore.currentVariables.forEach(function (d,i) {
            if(!d.derived) {
                _self.addHeatmapVariable(d.id);
            }
            else{
                if(d.modificationType==="binned") {
                    _self.addHeatmapVariable(d.originalIds[0]);
                    _self.rootStore.timepointStore.bin(d.originalIds[0],d.id,d.modification.bins,d.modification.binNames)
                }
            }
        });
    }

    /**
     * adds variable to heatmap
     * @param variableId
     */
    addHeatmapVariable(variableId) {
        const _self = this;
        let mapper = this.rootStore.sampleMappers[variableId];
        let addToTimeline = _self.variableStore.getVariableIndex(variableId) === 0;
        this.rootStore.timepointStructure.forEach(function (d, i) {
            let variableData = [];
            d.forEach(function (f) {
                let value = mapper[f.sample];
                variableData.push({
                    patient: f.patient,
                    value: value

                });
                if (addToTimeline) {
                    let date=_self.rootStore.sampleTimelineMap[f.sample].startNumberOfDaysSinceDiagnosis;
                    _self.timeline[i].data[f.patient] = [{variableId:variableId,value:value,start:date,end:date}];
                }
            });

            _self.timepoints[i].heatmap.push({variable: variableId, sorting: 0, data: variableData});
        });
    }


    /**
     * adds variable to sample data
     * 1. Add heatmap sample data
     * 2. Regroup data at timepoints which are grouped
     * @param variableId
     * @param variable
     * @param type
     */
    addVariable(variableId, variable, type) {
        this.variableStore.addOriginalVariable(variableId, variable, type);
        this.addHeatmapVariable(variableId);
        this.rootStore.timepointStore.regroupTimepoints();
        this.rootStore.undoRedoStore.saveVariableHistory("ADD VARIABLE", variable)
    }


    /**
     * Removes a variable from sample data
     * @param variableId
     */
    removeVariable(variableId) {
        let variableName=this.variableStore.getById(variableId).name;
        if (this.variableStore.currentVariables.length !== 1) {
            this.timepoints.forEach(function (d) {
                if (d.primaryVariableId === variableId) {
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
            this.timepoints = [];
            this.variableStore.constructor(this.rootStore);
            this.rootStore.timepointStore.initialize();
        }
        this.rootStore.undoRedoStore.saveVariableHistory("REMOVE VARIABLE", variableName);
    }



}


export default SampleTimepointStore;