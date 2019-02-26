import React from 'react';
import * as d3 from 'd3';
import {observer,inject} from 'mobx-react';
/*
implements a LineTransition
 */
const LineTransition = inject("dataStore","visStore","uiStore")(observer(class LineTransition extends React.Component {
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
        if (mode) {
            return (<path key={key + "-solid"} d={path} stroke={strokeColor} fill="none"/>)
        } else {
            return (<path key={key + "-dashed"} d={path} stroke={strokeColor} strokeDasharray="5, 5" fill="none"/>)
        }
    }

    drawDefaultLines() {
        let lines = [];
        const _self = this;
        this.props.from.forEach(function (d, i) {
            let globalInd = 1;

            if (_self.props.to && _self.props.to.includes(d)) {
                let strokeColor = "lightgray";
                if (_self.props.dataStore.selectedPatients.includes(d)) {
                    strokeColor = "black"
                }
                lines.push(LineTransition.drawLine(_self.props.firstHeatmapScale(d) + _self.props.visStore.sampleRectWidth / 2,
                    _self.props.secondHeatmapScale(d) + _self.props.visStore.sampleRectWidth / 2,
                    0, _self.props.visStore.transitionSpace,
                    d + globalInd + i, true, strokeColor));
                globalInd++;
            }
        });
        return lines;
    }

    drawRealtimeLines() {
        let lines = [];
        const _self = this;

        let max = 0;
        for (let timegap in this.props.timeGapStructure) {
            if (this.props.timeGapStructure[timegap] > max) {
                max = this.props.timeGapStructure[timegap];
            }
        }

        const getColor = _self.props.colorScale;
        const currentRow = _self.props.secondTimepoint.heatmap.filter(function (d, i) {
            return d.variable === _self.props.secondTimepoint.primaryVariableId
        })[0].data;
        let maximum=Math.max(...currentRow.map(row=>this.props.timeGapMapper[row.sample]).filter(d=>d!==undefined));
        currentRow.forEach((d,i) => {
            let strokeColor = "lightgray";
            if (_self.props.dataStore.selectedPatients.includes(d.patient)) {
                strokeColor = "black"
            }
            let frac=this.props.timeGapMapper[d.sample]/maximum;
            if(this.props.from.includes(d.patient)) {
                lines.push(LineTransition.drawLine(
                    _self.props.firstHeatmapScale(d.patient) + _self.props.visStore.sampleRectWidth / 2,
                    _self.props.firstHeatmapScale(d.patient) * (1 - frac) + _self.props.secondHeatmapScale(d.patient) * (frac) + _self.props.visStore.sampleRectWidth / 2,
                    0,
                    _self.props.visStore.transitionSpace * frac, d.patient, true, strokeColor
                ));
                if (frac!==1) {
                    lines.push(LineTransition.drawLine(
                        _self.props.firstHeatmapScale(d.patient) * (1 - frac) + _self.props.secondHeatmapScale(d.patient) * (frac) + _self.props.visStore.sampleRectWidth / 2,
                        _self.props.secondHeatmapScale(d.patient) + _self.props.visStore.sampleRectWidth / 2,
                        _self.props.visStore.transitionSpace * frac,
                        _self.props.visStore.transitionSpace, d.patient, false, strokeColor
                    ));
                    const color = getColor(d.value);
                    lines.push(
                        <rect
                            key={d.patient + "_proxy"}
                            x={_self.props.firstHeatmapScale(d.patient) * (1 - frac) + _self.props.secondHeatmapScale(d.patient) * (frac)+this.props.visStore.sampleRectWidth/4}
                            y={_self.props.visStore.transitionSpace * frac}
                            width={_self.props.visStore.sampleRectWidth/2}
                            height={_self.props.visStore.sampleRectWidth / 6}
                            fill={color}
                        />);
                }
            }
        });
        return lines;
    }

    render() {
        if (this.props.uiStore.realTime) {
            return (
                this.drawRealtimeLines()
            )
        }
        else {
            return (
                this.drawDefaultLines()
            )
        }
    }
}));
export default LineTransition;