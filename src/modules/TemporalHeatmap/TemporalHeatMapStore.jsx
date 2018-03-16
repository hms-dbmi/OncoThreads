import {extendObservable} from "mobx";

class TemporalHeatMapStore {
    constructor() {
        this.clinicalEvents = {};
        this.sampleClinicalMap = {};
        this.sampleStructure = {};
        extendObservable(this, {
            primarySampleData: [],
            secondarySampleData: [],
            currentTransitionData: []
        })
    }
    setClinicalEvents(events) {
        this.clinicalEvents = events;
    }
    setSampleClinicalMap(map) {
        this.sampleClinicalMap = map;
    }
    setSampleStructure(sampleStructure) {
        this.sampleStructure = sampleStructure;
    }
    setPrimarySampleData(category) {
        this.primarySampleData=this.getSampleData(category);
    }
    addSecondarySampleData(category) {
        let secondarySampleData=this.secondarySampleData.slice();
        secondarySampleData.push(this.getSampleData(category));
        this.secondarySampleData=secondarySampleData;
    }
    getSampleData(category) {
        let sampleData = [];
        for (let patient in this.sampleStructure) {
            let samples = [];
            for (let timepoint in this.sampleStructure[patient]) {
                samples.push(this.sampleStructure[patient][timepoint][0])
            }
            sampleData.push({"parient": patient, "samples": samples})
        }
        return sampleData;
    }
}

export default TemporalHeatMapStore;