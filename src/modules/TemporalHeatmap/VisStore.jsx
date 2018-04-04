import {extendObservable} from "mobx";
import * as d3 from 'd3';


class VisStore{
    constructor(){
        extendObservable(this,{
            colorScales:{},
        })
    }
    getColorScale(variable){
        if(!(variable in this.colorScales)){
            this.colorScales[variable]=d3.scaleOrdinal().range(['#66c2a5','#fc8d62','#8da0cb','#e78ac3','#a6d854','#ffd92f'])
        }
        return this.colorScales[variable];
    }
}
export default VisStore;