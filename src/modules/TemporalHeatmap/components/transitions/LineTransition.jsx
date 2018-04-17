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
     * @param strokeColor
     * @returns Line
     */
    static drawLine(x0, x1, y0, y1, key, strokeColor) {
        const curvature = .5;
        const yi = d3.interpolateNumber(y0, y1),
            y2 = yi(curvature),
            y3 = yi(1 - curvature);

        let path = "M" + x0 + "," + y0
            + "C" + x0 + "," + y2
            + " " + x1 + "," + y3
            + " " + x1 + "," + y1;

        const line = d3.path();
        line.moveTo(x0, y0);
        line.lineTo(x1, y1);
        return (<path key={key} d={path} stroke={strokeColor} fill="none"/>)
    }
    drawLines() {
        let lines = [];
        const _self = this;
        this.props.transition.data.from.forEach(function (d) {
            if (_self.props.transition.data.to.includes(d)) {
                let strokeColor="lightgray";
                if(_self.props.selectedPatients.includes(d)){
                    strokeColor="black"
                }
                lines.push(LineTransition.drawLine(_self.props.firstHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2, _self.props.secondHeatmapScale(d) + _self.props.visMap.sampleRectWidth / 2, 0 - _self.props.visMap.gap, _self.props.visMap.transitionSpace, d,strokeColor));
            }
        });
        return lines;
    }


    render() {
        return (
            this.drawLines()
        )
    }
});
export default LineTransition;