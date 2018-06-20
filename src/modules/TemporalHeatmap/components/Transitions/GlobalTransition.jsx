import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';
/*
implements a LineTransition
 */
const GlobalTransition = observer(class GlobalTransition extends React.Component {
    /**
     * Draws a line for the Line transition
     * @param x0: x pos on first timepoint
     * @param x1: x pos on second timepoint
     * @param y0: y pos
     * @param y1: y pos + height
     * @param key (unique)
     * @param strokeColor
     * @returns Line
     */


    static drawLine(x0, x1, y0, y1, key, strokeColor) {
        const curvature = .5;
        const yi = d3.interpolateNumber(y0, y1),
            y2 = yi(curvature),
            y3 = yi(1 - curvature);

        let path = "M" + x0 + "," + y0
            + "L" + x1 + "," + y1;
            return (<path key={key} d={path} stroke={strokeColor} fill="none"/>)
    }

    drawLines(){
        let lines = [];
        const _self = this;
        let j=0;
        let y1=_self.props.allYPositionsy1.map(y=>y*700.00/_self.props.max);
        let y2=_self.props.allYPositionsy2.map(y=>y*700.00/_self.props.max);
        let globalInd=2;
        _self.props.from.forEach(function (d, i) {
            if (_self.props.to.includes(d)) {
                let strokeColor="lightgray";
                if(_self.props.selectedPatients.includes(d)){
                    strokeColor="black"
                }
                lines.push(
                    GlobalTransition.drawLine(_self.props.patientScale(d) + _self.props.visMap.sampleRectWidth / 2 - _self.props.visMap.sampleRectWidth / 4,
                    _self.props.patientScale(d) + _self.props.visMap.sampleRectWidth / 2 - _self.props.visMap.sampleRectWidth / 4,
                    y1[i] + _self.props.visMap.sampleRectWidth/2,
                    y2[j],
                    d+globalInd+i, strokeColor));
                j++;
                globalInd=globalInd+2;
            }
        });
        j=0;
        return lines;
    }

    static getMax(max, num) {
        return max>num? max: num;
    }
    render() {
            return (
                this.drawLines()
            )
    }
});
export default GlobalTransition;