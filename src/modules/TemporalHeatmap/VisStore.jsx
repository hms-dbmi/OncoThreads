import * as d3 from 'd3';
import {extendObservable} from "mobx";

/*
stores information about current visual parameters
 */
class VisStore{
    constructor(){
        this.categoricalColor={};
        this.continousColor={};
        this.binaryColor=d3.scaleOrdinal().range(['#f7f7f7','#8da0cb','#f7f7f7']).domain([undefined,true,false]);
        //width of rects in sampleTomepoints
        this.sampleRectWidth=0;
        //width of rects in betweenTimepoints
        this.betweenRectWidth=0;
        //height of rects in a row which is primary
        this.primaryHeight=0;
        //gap between rows in heatmap
        this.gap=0;
        //space for transitions
        this.transitionSpace=0;
        //gap between partitions in grouped timepoints
        this.partitionGap=0;
        extendObservable(this,{
            timepointY:[],
            transY:[],
            svgWidth:0,
            svgHeight:0
        })
    }
    setContinousColorScale(variable,min,max){
        this.continousColor[variable]=d3.scaleLinear().range(['#e6e6e6','#000000']).domain([min,max])
    }
    setGap(gap){
        this.gap=gap;
    }
    setPartitionGap(partitionGap){
        this.partitionGap=partitionGap;
    }
    setTransitionSpace(transitionSpace){
        this.transitionSpace=transitionSpace;
    }
    setSampleRectWidth(width){
        this.sampleRectWidth=width;
    }
    setBetweenRectWidth(width){
        this.betweenRectWidth=width;
    }
    setPrimaryHeight(height){
        this.primaryHeight=height;
    }
    setSecondaryHeight(height){
        this.secondaryHeight=height;
    }

    /**
     * computes the height of a timepoint
     * @param numVar
     * @returns {*}
     */
    getTimepointHeight(numVar){
        if(numVar===0){
            return 0;
        }
        else {
            return (this.primaryHeight + this.gap + (numVar - 1) * (this.secondaryHeight + this.gap));
        }
    }

    getColorScale(variable,type){
        if(type==="categorical") {
            if (!(variable in this.categoricalColor)) {
                this.categoricalColor[variable] = d3.scaleOrdinal().range(['#f7f7f7','#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f']).domain([undefined]);

            }
            return this.categoricalColor[variable];
        }
        else if(type==="binary"){
            return this.binaryColor;
        }
        else{
            return this.continousColor[variable];
        }
    }
}
export default VisStore;