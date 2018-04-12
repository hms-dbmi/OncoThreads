import {extendObservable} from "mobx";

class SampleTimepointStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.sampleClinicalMap = {};
        this.sampleMutationCountMap = {};
        this.timepointStructure = {};
        this.maxMutationCount = 0;
        extendObservable(this, {
            timepointData: [],
            currentVariables: [],
            primaryVariables: [],
            groupOrder: [],
            patientsPerTimepoint: [],
            patientOrderPerTimepoint: []
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
     * initialize variables, used after the fist variable is added.
     * @param variable
     */
    initialize(variable) {
        this.primaryVariables = Array(this.timepointStructure.length).fill(variable);
        this.timepointData = Array(this.timepointStructure.length).fill({
            type: "sample",
            heatmap: [],
            group: {data: []}
        });
        this.groupOrder = Array(this.timepointStructure.length).fill({isGrouped: false, order: 1});
        this.patientsPerTimepoint = this.rootStore.patientsPerTimepoint;
        this.patientOrderPerTimepoint=this.rootStore.patientOrderPerTimepoint;
        this.rootStore.timepointStore.initialize();
    }

    /**
     * adds variable to heatmap sample data
     * @param variable: variable to add
     * @param type
     */
    addHeatmapVariable(variable, type) {
        const _self = this;
        this.timepointStructure.forEach(function (d, i) {
            let variableData = [];
            d.forEach(function (f, j) {
                let value;
                if (type === "categorical") {
                    value = _self.sampleClinicalMap[f.sample][variable]
                }
                else {
                    value = _self.sampleMutationCountMap[f.sample]
                }
                variableData.push({
                    patient: f.patient,
                    value: value
                });
            });
            _self.timepointData[i].heatmap.push({variable: variable, sorting: 0, data: variableData});
        });
    }


    /**
     * adds variable to sample data
     * 1. Add heatmap sample data
     * 2. Regroup data at timepoints which are grouped
     * @param variable
     * @param type
     */
    addVariable(variable, type) {
        this.addHeatmapVariable(variable, type);
        this.currentVariables.push({variable: variable, type: type});
        this.rootStore.timepointStore.regroupTimepoints();
    }


    /**
     * Removes a variable from sample data
     * @param variable
     */
    removeVariable(variable) {
        if (this.primaryVariables.includes(variable)) {
            this.adaptPrimaryVariables(variable);
        }
        const index = this.currentVariables.map(function (d, i) {
            return d.variable
        }).indexOf(variable);
        for (let i = 0; i < this.timepointData.length; i++) {
            this.timepointData[i].heatmap.splice(index, 1);
        }
        this.currentVariables.splice(index, 1);
        this.rootStore.timepointStore.regroupTimepoints();
    }

    adaptPrimaryVariables(variable) {
        const _self = this;
        let newVariableIndex = 0;
        if (this.currentVariables.map(function (d) {
                return d.variable
            }).indexOf(variable) === 0) {
            newVariableIndex = 1
        }
        this.primaryVariables = this.primaryVariables.map(function (d) {
            if (d === variable) {
                return _self.currentVariables[newVariableIndex].variable;
            }
            else return d;
        });
    }


}


export default SampleTimepointStore;