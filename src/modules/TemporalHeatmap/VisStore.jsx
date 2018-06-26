import * as d3 from 'd3';
import {extendObservable} from "mobx";

/*
stores information about current visual parameters
 */
class VisStore{
    constructor(){
        this.categoricalColor={};
        this.continuousColor={};
        this.binnedColor={};
        this.binaryColor=d3.scaleOrdinal().range(['#f7f7f7','#ffd92f','#8da0cb']).domain([undefined,true,false]);
        //width of rects in sampleTomepoints
        this.sampleRectWidth=0;
        //width of rects in betweenTimepoints
        this.betweenRectWidth=0;
        //height of rects in a row which is primary
        this.primaryHeight=0;
        this.secondaryHeight=0;
        //gap between rows in heatmap
        this.gap=0;
        //space for transitions
        this.transitionSpace=0;
        //gap between partitions in grouped timepoints
        this.partitionGap=0;
        this.GlobalTransitionColors= d3.scaleOrdinal().range(['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#38aab0', '#f0027f', '#bf5b17', '#6a3d9a', '#ff7f00', '#e31a1c']);
        extendObservable(this,{
            timepointY:[],
            transY:[],
            svgWidth:0,
            svgHeight:0
        })
    }

    /**
     * creates a continous color scale for a variable between min and max
     * @param variable
     * @param min
     * @param max
     */
    setContinousColorScale(variable,min,max){
        if(min<0){
            let lowerLimit,upperLimit;
            if(-min>max){
                lowerLimit=min;
                upperLimit=-min;
            }
            else{
                lowerLimit=-max;
                upperLimit=max;
            }
            this.continuousColor[variable]= d3.scaleLinear().range(['#0571b0','#f7f7f7', '#ca0020']).domain([lowerLimit,0, upperLimit]);
        }
        else {
            this.continuousColor[variable] = d3.scaleLinear().range(['#e6e6e6', '#000000']).domain([min, max])
        }
        }

    /**
     * creates a binned color scale for a binned variable using its corresponding continuous scale
     * @param newId
     * @param oldId
     * @param binNames: domain of scale
     * @param binValues: bins
     */
    setBinnedColorScale(newId,oldId,binNames,binValues){
        const continousScale=this.continuousColor[oldId];
        let colors=[];
        for(let i=0;i<binNames.length;i++){
            colors.push(continousScale((binValues[i+1]+binValues[i])/2));
        }
        this.binnedColor[newId]=d3.scaleOrdinal().range(colors).domain(binNames).unknown('white');
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

    /**
     * returns a color scale for a variable depending on its type.
     * @param variable
     * @param type
     * @returns {*}
     */
    getBlockColorScale(variable, type){
        if(type==="STRING") {
            if (!(variable in this.categoricalColor)) {
                this.categoricalColor[variable] = d3.scaleOrdinal().range(['#f7f7f7','#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f']).domain([undefined]);
            }
            return this.categoricalColor[variable];
        }
        else if(type==="binary"){
            return this.binaryColor;
        }
        else if(type==="BINNED"){
            return this.binnedColor[variable];
        }
        else{
            return this.continuousColor[variable];
        }
    }
    getGlobalTransitionColorScale(){
        return this.GlobalTransitionColors;
    }
}
export default VisStore;