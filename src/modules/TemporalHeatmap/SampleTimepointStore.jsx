import {extendObservable} from "mobx";
import SingleTimepoint from "./SingleTimepoint"

/*
stores information about sample timepoints
 */
class SampleTimepointStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.sampleClinicalMap = {};
        this.sampleMutationCountMap = {};
        this.timepointStructure = {};
        this.maxMutationCount = 0;
        extendObservable(this, {
            timepoints: [],
            currentVariables: [],
        });
    }

    setSampleClinicalMap(map) {
        this.sampleClinicalMap = map;
    }

    setSampleMutationCountMap(map) {
        this.sampleMutationCountMap = map;
    }

    setTimepointStructure(timepointStructure) {
        this.timepointStructure = timepointStructure;
    }


    /**
     * computes the maximum mutation count
     */
    computeMaxMutationCount() {
        let max = 0;
        for (let sample in this.sampleMutationCountMap) {
            if (this.sampleMutationCountMap[sample] > max) {
                max = this.sampleMutationCountMap[sample];
            }
        }
        this.maxMutationCount = max;
    }

    /**
     * initialize fields, used after the fist variable is added.
     * @param variable
     */
    initialize(variable) {
        for(let i=0;i<this.timepointStructure.length;i++){
            this.timepoints.push(new SingleTimepoint(this.rootStore,variable,this.rootStore.patientsPerTimepoint[i],"sample",i));
        }
        this.rootStore.timepointStore.initialize();
    }

    /**
     * adds variable to heatmap
     * @param variable: variable to add
     * @param dataset
     */
    addHeatmapVariable(variable, dataset) {
        const _self = this;
        this.timepointStructure.forEach(function (d, i) {
            let variableData = [];
            d.forEach(function (f) {
                let value;
                if (dataset === "clinical") {
                    value = _self.sampleClinicalMap[f.sample][variable]
                }
                else if (dataset === "mutationCount") {
                    value = _self.sampleMutationCountMap[f.sample]
                }
                variableData.push({
                    patient: f.patient,
                    value: value
                });
            });
            _self.timepoints[i].heatmap.push({variable: variable, sorting: 0, data: variableData});
        });
    }


    /**
     * adds variable to sample data
     * 1. Add heatmap sample data
     * 2. Regroup data at timepoints which are grouped
     * @param variable
     * @param type
     * @param dataset
     */
    addVariable(variable, type, dataset) {
        this.addHeatmapVariable(variable, dataset);
        this.currentVariables.push({variable: variable, type: type});
        this.rootStore.timepointStore.regroupTimepoints();
    }


    /**
     * Removes a variable from sample data
     * @param variable
     */
    removeVariable(variable) {
        if (this.currentVariables.length !== 1) {
                this.timepoints.forEach(function (d) {
                    if(d.primaryVariable===variable) {
                        d.adaptPrimaryVariable(variable);
                    }
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


export default SampleTimepointStore;