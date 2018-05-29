import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';
/*
implements a LineTransition
 */
const LineTransition = observer(class LineTransition extends React.Component {
    /**
     * Draws a line for the Line transition
     * @param x0: x pos on first timepoint
     * @param x1: x pos on second timepoint
     * @param y0: y pos
     * @param y1: y pos + height
     * @param key (unique)
     * @param mode
     * @param strokeColor
     * @returns Line
     */


    static drawLine(x0, x1, y0, y1, key, mode, strokeColor) {
        const curvature = .5;
        const yi = d3.interpolateNumber(y0, y1),
            y2 = yi(curvature),
            y3 = yi(1 - curvature);

        let path = "M" + x0 + "," + y0
            + "C" + x0 + "," + y2
            + " " + x1 + "," + y3
            + " " + x1 + "," + y1;
        if(mode) {
            return (<path key={key+"-solid"} d={path} stroke={strokeColor} fill="none"/>)
        } else {
            return (<path key={key+"-dashed"} d={path} stroke={strokeColor} strokeDasharray="5, 5" fill="none"/>)
        }
    }
    drawDefaultLines() {
        let lines = [];
        const _self = this;
        this.props.transition.data.from.forEach(function (d,i) {
        let globalInd=1;

            if (_self.props.transition.data.to.includes(d)) {
                let strokeColor="lightgray";
                if(_self.props.selectedPatients.includes(d)){
                    strokeColor="black"
                }
                lines.push(LineTransition.drawLine(_self.props.firstHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2,
                    _self.props.secondHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2,
                    0 - _self.props.visMap.gap, _self.props.visMap.transitionSpace,
                    d+globalInd+i, true, strokeColor));
                globalInd++;
            }
        });
        return lines;
    }

    drawLinesGlobalWithTransition(){
        let lines = [];
        const _self = this;


        let j=0;

        let y1=_self.props.allYPositionsy1; //.map(y=>y*700.00/_self.props.max);


        let y2=_self.props.allYPositionsy2; //.map(y=>y*700.00/_self.props.max);

        if(y1 && y2){

            y1=y1.map(y=>y*700.00/_self.props.max);

            y2=y2.map(y=>y*700.00/_self.props.max);

            let globalInd=2;


            this.props.transition.data.from.forEach(function (d, i) {

                if (_self.props.toPatients.includes(d)) {
                    let strokeColor="lightgray";
                    if(_self.props.selectedPatients.includes(d)){
                        strokeColor="black"
                    }
                    lines.push(LineTransition.drawLine(_self.props.firstHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2,
                        _self.props.secondHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2,
                        //0 - _self.props.visMap.gap,
                        y1[j] + _self.props.visMap.sampleRectWidth,
                        //_self.props.visMap.transitionSpace,
                        y2[j], // + _self.props.visMap.sampleRectWidth / 2,
                        d+globalInd+i, true, strokeColor));
                    j++;
                    globalInd=globalInd+2;
                }

            });

            j=0;

        }
        return lines;
    }

    drawLinesGlobal() {
        let lines = [];
        const _self = this;


        let j=0;

        let y1=_self.props.allYPositionsy1.map(y=>y*700.00/_self.props.max);


        let y2=_self.props.allYPositionsy2.map(y=>y*700.00/_self.props.max);


        let globalInd=2;

        _self.props.transition.data.from.forEach(function (d, i) {

            if (_self.props.transition.data.to.includes(d)) {
                let strokeColor="lightgray";
                if(_self.props.selectedPatients.includes(d)){
                    strokeColor="black"
                }
                lines.push(LineTransition.drawLine(_self.props.firstHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2,
                    _self.props.secondHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2,
                    //0 - _self.props.visMap.gap,
                    y1[i] + _self.props.visMap.sampleRectWidth,
                    //_self.props.visMap.transitionSpace,
                    y2[j], // + _self.props.visMap.sampleRectWidth / 2,
                    d+globalInd+i, true, strokeColor));
                j++;
                globalInd=globalInd+2;
            }
        });

        j=0;

        return lines;
    }



    drawRealtimeLines() {
        let lines = [];
        const _self = this;

        let max =0;
        for(let timegap in this.props.transition.timeGapStructure){
            if(this.props.transition.timeGapStructure[timegap]>max){
                max=this.props.transition.timeGapStructure[timegap];
            }
        }

        const getColor = _self.props.visMap.getColorScale(_self.props.secondPrimary.id, _self.props.secondPrimary.datatype);
        const currentRow=_self.props.secondTimepoint.heatmap.filter(function (d,i) {
            return d.variable===_self.props.secondPrimary.id
        })[0].data;
        let ind = -1;

        this.props.transition.data.from.forEach(function (d) {

            if (_self.props.transition.data.to.includes(d)) {
                let strokeColor="lightgray";
                if(_self.props.selectedPatients.includes(d)){
                    strokeColor="black"
                }
                const frac = _self.props.transition.timeGapStructure[d]/max;
                ind++;
                lines.push(LineTransition.drawLine(
                    (_self.props.firstHeatmapScale(d)) + _self.props.visMap.sampleRectWidth / 2,
                    _self.props.firstHeatmapScale(d)*(1-frac) +_self.props.secondHeatmapScale(d)*(frac) + _self.props.visMap.sampleRectWidth / 2,
                    0 - _self.props.visMap.gap,
                    _self.props.visMap.transitionSpace*_self.props.transition.timeGapStructure[d]/max, d, true, strokeColor
                ));
                if(_self.props.transition.timeGapStructure[d]<max) {
                    lines.push(LineTransition.drawLine(
                        _self.props.firstHeatmapScale(d)*(1-frac) +_self.props.secondHeatmapScale(d)*(frac) + _self.props.visMap.sampleRectWidth / 2,
                        _self.props.secondHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2,
                        _self.props.visMap.transitionSpace*frac,
                        _self.props.visMap.transitionSpace, d, false, strokeColor
                    ));
                    const color = getColor(currentRow[ind].value);
                    lines.push(
                        <rect
                            x={_self.props.firstHeatmapScale(d)*(1-frac) +_self.props.secondHeatmapScale(d)*(frac) + _self.props.visMap.sampleRectWidth/2-_self.props.visMap.sampleRectWidth / 6}
                            y={_self.props.visMap.transitionSpace*_self.props.transition.timeGapStructure[d]/max-5}
                            width={_self.props.visMap.sampleRectWidth / 3}
                            height={_self.props.visMap.sampleRectWidth / 3}
                            fill={color}
                        />);
                }
            }
        });
        return lines;
    }

    static getMax(max, num) {
        return max>num? max: num;
    }




    render() {
        if(this.props.realTime) {
            return (
                this.drawRealtimeLines()
            )
        }
        else if(this.props.globalTime && !this.props.transitionOn){
            return (
                this.drawLinesGlobal()
            )
        }
        else if(this.props.globalTime && this.props.transitionOn){
            return (
                //this.drawLinesGlobal()  //or, 
                this.drawLinesGlobalWithTransition()
            )
        }
        else {
            return (
                this.drawDefaultLines()
            )
        }
    }
});
export default LineTransition;