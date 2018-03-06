import {extendObservable} from "mobx";

class SummaryStore{
    constructor(){
        extendObservable(this,{
            numberOfTimepoints: 0,
            numberOfSamples: 0,
            numberOfPatients: 0
        })
    }
    setNumberOfTimepoints(noTP){
        this.numberOfTimepoints=noTP;
    }
    setNumberOfSamples(noS){
        this.numberOfSamples=noS;
    }
    setNumberOfPatients(soP){
        this.numberOfPatients=soP;
    }
}
export default SummaryStore;