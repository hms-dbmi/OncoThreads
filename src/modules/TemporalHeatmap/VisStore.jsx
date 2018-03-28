import {extendObservable, computed} from "mobx";

class VisStore{
    constructor(){
        this.numberOfTimepoints=0;
        extendObservable(this,{
            xPositions:[],
            timepointY:[],
            transY:[],
            transHeight:0
        })
    }
    setNumberOfTimepoints(numberOfTimepoints){
        this.numberOfTimepoints=numberOfTimepoints;
    }
    resetxPositions(){
        this.xPositions=Array(this.numberOfTimepoints).fill({});
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
    setxPosition(timepoint,key,x0,x1){
        this.xPositions[timepoint][key]={start:x0,end:x1}
    }
}
export default VisStore;