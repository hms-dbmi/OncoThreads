import SummaryStore from "./Summary/SummaryStore.jsx";
import MutationCountStore from "./Histogram/MutationCountStore.jsx";
import EventStore from "./Timeline/EventStore.jsx";
import SankeyStore from "./Sankey/SankeyStore.jsx";
import {extendObservable} from "mobx";
import StackedBarChartStore from "./StackedBar/StackedBarChartStore";

class RootStore {
    constructor(cbioAPI) {
        this.cbioAPI = cbioAPI;
        this.summaryStore = new SummaryStore();
        this.mutationCountStore = new MutationCountStore();
        this.eventStore = new EventStore();
        this.sankeyStore = new SankeyStore();
        this.stackedBarChartStore=new StackedBarChartStore();
        extendObservable(this,{
            parsed:false
        })
    }

    setStudyID(studyID) {
        const _self=this;
        this.cbioAPI.getAllData(studyID, function () {
            _self.buildPatientStructure();
            _self.eventStore.setClinicalEvents(_self.cbioAPI.clinicalEvents);
            _self.eventStore.setPatientAttributes(_self.cbioAPI.clinicalPatientData);
            _self.eventStore.computeAttributes();
            _self.sankeyStore.createSankeyData();
            _self.stackedBarChartStore.setClinicalPatientData(_self.cbioAPI.allClinicalPatientData);
            _self.stackedBarChartStore.setClinicalEvents(_self.cbioAPI.allClinicalEvents);
            _self.stackedBarChartStore.setPatients(_self.cbioAPI.patients);
            _self.parsed=true;
        });
    }

    /**
     * combines clinical events of sort "SPECIMEN" and clinical data in one datastructure,
     * creates dataset for histogram of mutation counts
     */
    buildPatientStructure() {
        const _self = this;
        let sampleStructure = {};
        let clinicalCat = [];
        let numberOfTimepoints = 0;
        let PriHistogramData = [];
        let RecHistogramData = [];

        this.cbioAPI.patients.forEach(function (d) {
            sampleStructure[d.patientId] = {"timepoints": {}};
            let previousDate = -1;
            let currTP = 0;
            _self.cbioAPI.clinicalEvents[d.patientId].forEach(function (e, i) {
                if (e.eventType === "SPECIMEN" && e.attributes.length === 2) {
                    numberOfTimepoints += 1;
                    if (e.startNumberOfDaysSinceDiagnosis === 0) {
                        PriHistogramData.push(RootStore.getSampleMutationCounts(_self.cbioAPI.mutationCounts, e.attributes[1].value));
                    }
                    else {
                        RecHistogramData.push(RootStore.getSampleMutationCounts(_self.cbioAPI.mutationCounts, e.attributes[1].value));
                    }
                    let sampleInfo = {"clinicalData": {}, "name": e.attributes[1].value};
                    let sampleClinicalData = _self.getSampleClinicalData(_self.cbioAPI.clinicalSampleData, e.attributes[1].value);
                    sampleClinicalData.forEach(function (f, i) {
                        if (clinicalCat.indexOf(f.clinicalAttributeId) === -1) {
                            clinicalCat.push(f.clinicalAttributeId);
                        }
                        sampleInfo.clinicalData[f.clinicalAttributeId] = f.value;
                    });
                    if (e.startNumberOfDaysSinceDiagnosis !== previousDate) {
                        sampleStructure[d.patientId].timepoints[currTP] = [];
                        sampleStructure[d.patientId].timepoints[currTP].push(sampleInfo);
                        currTP += 1;
                    }
                    else {
                        sampleStructure[d.patientId].timepoints[currTP - 1].push(sampleInfo);
                    }
                    previousDate = e.startNumberOfDaysSinceDiagnosis;
                }
            })
        });
        this.sankeyStore.setSampleStructure(sampleStructure);
        this.sankeyStore.setClinicalCategories(clinicalCat);
        this.summaryStore.setNumberOfPatients(this.cbioAPI.patients.length);
        this.summaryStore.setNumberOfSamples(this.cbioAPI.mutationCounts.length);
        this.summaryStore.setNumberOfTimepoints(numberOfTimepoints);
        this.mutationCountStore.setHistogramData(PriHistogramData, RecHistogramData);

    }


    /**
     * get the clinical data for a sample
     * @param clinicalData
     * @param sampleId
     */
    getSampleClinicalData(clinicalData, sampleId) {
        return clinicalData.filter(function (d, i) {
            return d.sampleId === sampleId;
        })
    }

    /**
     * get tha mutation counts for a sample
     * @param mutationCounts
     * @param sampleId
     * @returns mutation counts of sample
     */
    static getSampleMutationCounts(mutationCounts, sampleId) {
        let counts = -1;
        for (let i = 0; i < mutationCounts.length; i++) {
            if (mutationCounts[i].sampleId === sampleId) {
                counts = mutationCounts[i].mutationCount;
                break;
            }
        }
        return counts;
    }

}

export default RootStore