import SummaryStore from "./Summary/SummaryStore.jsx";
import MutationCountStore from "./Histogram/MutationCountStore.jsx";
import EventStore from "./Timeline/EventStore.jsx";
import SankeyStore from "./Sankey/SankeyStore.jsx";
import TemporalHeatMapStore from "./TemporalHeatmap/TemporalHeatMapStore.jsx"
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
        this.temporalHeatMapStore=new TemporalHeatMapStore();

        this.clinicalSampleCategories=[];
        extendObservable(this,{
            parsed:false
        })
    }

    setStudyID(studyID) {
        const _self=this;
        this.cbioAPI.getAllData(studyID, function () {
            _self.buildPatientStructure();
            _self.eventStore.setPatientAttributes(_self.cbioAPI.clinicalPatientData);
            _self.eventStore.setClinicalEvents(_self.cbioAPI.clinicalEvents);
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
        let numberOfSamples=0;
        let sampleClinicalMap={};

        this.cbioAPI.patients.forEach(function (d) {
            sampleStructure[d.patientId] = {"timepoints": {}};
            let previousDate = -1;
            let currTP = 0;
            _self.cbioAPI.clinicalEvents[d.patientId].forEach(function (e, i) {
                if (e.eventType === "SPECIMEN") {
                    numberOfSamples+=1;
                    sampleClinicalMap[e.attributes[1].value]=_self.getSampleClinicalData(_self.cbioAPI.clinicalSampleData,e.attributes[1].value);
                    if (e.startNumberOfDaysSinceDiagnosis === 0) {
                        PriHistogramData.push(RootStore.getSampleMutationCounts(_self.cbioAPI.mutationCounts, e.attributes[1].value));
                    }
                    else {
                        RecHistogramData.push(RootStore.getSampleMutationCounts(_self.cbioAPI.mutationCounts, e.attributes[1].value));
                    }
                    if (e.startNumberOfDaysSinceDiagnosis !== previousDate) {
                        sampleStructure[d.patientId].timepoints[currTP] = [];
                        sampleStructure[d.patientId].timepoints[currTP].push(e.attributes[1].value);
                        currTP += 1;
                        numberOfTimepoints += 1;
                    }
                    else {
                        sampleStructure[d.patientId].timepoints[currTP - 1].push(e.attributes[1].value);
                    }
                    previousDate = e.startNumberOfDaysSinceDiagnosis;
                }
            })
        });
        this.temporalHeatMapStore.setSampleClinicalMap(sampleClinicalMap);
        this.temporalHeatMapStore.setClinicalEvents(this.cbioAPI.clinicalEvents);
        this.sankeyStore.setSampleStructure(sampleStructure);
        this.sankeyStore.setSampleClinicalMap(sampleClinicalMap);
        this.sankeyStore.setClinicalCategories(_self.clinicalSampleCategories);
        this.summaryStore.setNumberOfPatients(this.cbioAPI.patients.length);
        this.summaryStore.setNumberOfSamples(numberOfSamples);
        this.summaryStore.setNumberOfTimepoints(numberOfTimepoints);
        this.mutationCountStore.setHistogramData(PriHistogramData, RecHistogramData);
    }


    /**
     * get the clinical data for a sample
     * @param clinicalData
     * @param sampleId
     */
    getSampleClinicalData(clinicalData, sampleId) {
        let _self=this;
        let sampleClinicalDict={};
        let sampleClinicalArray= clinicalData.filter(function (d, i) {
            return d.sampleId === sampleId;
        });
        sampleClinicalArray.forEach(function (d,i) {
            if(!_self.clinicalSampleCategories.includes(d.clinicalAttributeId)){
                _self.clinicalSampleCategories.push(d.clinicalAttributeId);
            }
            sampleClinicalDict[d.clinicalAttributeId]=d.value;
        });
        return sampleClinicalDict;
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