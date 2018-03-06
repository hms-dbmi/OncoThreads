import {extendObservable} from "mobx";

class StackedBarChartStore{
    constructor(){
        extendObservable(this,{
            patients: [],
            clinicalPatientData: [],
            clinicalEvents: []
        })
    }
    setPatients(patients){
        this.patients=patients;
    }
    setClinicalPatientData(clinicalPatientData){
        this.clinicalPatientData=clinicalPatientData;
    }
    setClinicalEvents(clinicalEvents){
        this.clinicalEvents=clinicalEvents;
    }
}
export default StackedBarChartStore;