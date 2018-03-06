import {extendObservable} from "mobx";

class MutationCountStore{
    constructor(){
        extendObservable(this,{
            PriHistogramData: [],
            RecHistogramData: [],
        })
    }
    setHistogramData(priHistogramData,recHistogramData){
        this.PriHistogramData=priHistogramData;
        this.RecHistogramData=recHistogramData;
    }
}
export default MutationCountStore;