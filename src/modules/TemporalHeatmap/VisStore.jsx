import {extendObservable, computed} from "mobx";
import * as d3 from 'd3';


class VisStore{
    constructor(){
        this.numberOfTimepoints=0;
        extendObservable(this,{
            timepointY:[],
            transY:[],
            transHeight:0,
            colorScales:{},
        })
    }
    setNumberOfTimepoints(numberOfTimepoints){
        this.numberOfTimepoints=numberOfTimepoints;
        this.xPositions=Array(this.numberOfTimepoints).fill({});
    }
    getColorScale(variable){
        if(!(variable in this.colorScales)){
            this.colorScales[variable]=d3.scaleOrdinal().range(['#66c2a5','#fc8d62','#8da0cb','#e78ac3','#a6d854','#ffd92f'])
        }
        return this.colorScales[variable];
    }
    computeYpositions(currTPheight,currTransHeight){
        this.transHeight=currTransHeight;
        let timepointY=[];
        let transY=[];
        for(let i=0;i<this.numberOfTimepoints;i++){
            timepointY.push(i*(currTPheight+currTransHeight));
            transY.push(currTPheight+i*(currTransHeight+currTPheight));
        }
        this.timepointY=timepointY;
        this.transY=transY;
    }
}
export default VisStore;