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
     * @returns Line
     */
    static drawLine(x0, x1, y0, y1, key, mode) {
        const curvature = .5;
        const yi = d3.interpolateNumber(y0, y1),
            y2 = yi(curvature),
            y3 = yi(1 - curvature);

        let path = "M" + x0 + "," + y0
            + "C" + x0 + "," + y2
            + " " + x1 + "," + y3
            + " " + x1 + "," + y1;

        //const line = d3.path();
        //line.moveTo(x0, y0);
        //line.lineTo(x1, y1);
        if(mode) {
            return (<path key={key+"-solid"} d={path} stroke={"gray"} fill="none"/>)
        } else {
            return (<path key={key+"-dashed"} d={path} stroke={"gray"} stroke-dasharray="5, 5" fill="none"/>)
        }
    }
    drawLines() {
        let lines = [];
        const _self = this;

        console.log(this.props.transition.timeGapStructure);
        console.log(this.props.transition.data.from);

        this.props.transition.data.from.forEach(function (d) {

            console.log(d);

            console.log( _self.props.firstHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2);

            console.log(_self.props.secondHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2);

            console.log(0 - _self.props.visMap.gap);

            console.log(_self.props.visMap.transitionSpace);

            if (_self.props.transition.data.to.includes(d)) {
                lines.push(
                    LineTransition.drawLine(
                    _self.props.firstHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2, 

                    _self.props.secondHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2, 

                    0 - _self.props.visMap.gap, 

                    _self.props.visMap.transitionSpace,

                    d, true)
                );
            }
        });
        return lines;
    }

    drawLines3() {
        let lines = [];
        const _self = this;

        console.log(this.props.transition.timeGapStructure);
        console.log(this.props.transition.data.from);

        var timeGapBetweenMap = {};

        var max = this.props.transition.timeGapStructure.map(t=> {
            timeGapBetweenMap[t.patient] = t.timeGapBetweenSample;
            return t.timeGapBetweenSample;
        }).reduce((m, cur) => m>cur? m: cur, 0);


        const getColor = _self.props.visMap.getColorScale(_self.props.colorData.variable, _self.props.variableType);
        var ind = -1;

        this.props.transition.data.from.forEach(function (d, i) {

            if (_self.props.transition.data.to.includes(d)) {
                ind++;
                lines.push(LineTransition.drawLine(
                    _self.props.firstHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2, 
                    _self.props.secondHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2, 
                    0 - _self.props.visMap.gap,
                    _self.props.visMap.transitionSpace*timeGapBetweenMap[d]/max, d, true
                ));
                if(timeGapBetweenMap[d]<max) {
                    lines.push(LineTransition.drawLine(
                        _self.props.firstHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2, 
                        _self.props.secondHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2, 
                        _self.props.visMap.transitionSpace*timeGapBetweenMap[d]/max,
                        _self.props.visMap.transitionSpace, d, false
                    ));
                    const color = getColor(_self.props.colorData.data[ind].value);
                    lines.push(
                        <rect
                            x={(_self.props.firstHeatmapScale(d) +_self.props.secondHeatmapScale(d) + _self.props.visMap.sampleRectWidth)/2-5}
                            y={_self.props.visMap.transitionSpace*timeGapBetweenMap[d]/max-5}
                            width={10}
                            height={10}
                            fill={color}
                        />);
                }
            }
        });
        return lines;
    }

    getMax(max, num) {
        return max>num? max: num;
    }




    render() {

        if(this.props.realTime) {
            return (
                this.drawLines3()
            )
        } else {
            return (
                this.drawLines()
            )
        }
    }
});
export default LineTransition;