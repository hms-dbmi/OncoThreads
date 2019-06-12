import React from 'react';
import {inject, observer} from 'mobx-react';
import TriangleCurve from './TriangleCurve'
import * as d3 from "d3";

/**
 * Component for creating transitions between heatmap and grouped timepoints
 */
const HeatmapGroupTransition = inject("dataStore", "visStore", "uiStore")(observer(class HeatmapGroupTransition extends React.Component {

    /**
     * draws a curve or rect for the band proxy
     * @param {number} x
     * @param {number} y
     * @param {number} sharedWidth
     * @param {number} width
     * @param {number} height
     * @param {string} color
     * @param {string} key
     * @return {path}
     */
    drawBandProxy(x, y, sharedWidth, width, height, color, key) {
        const curvature = 1;
        let y0, y1, y2, y3;
        const yi = d3.interpolateNumber(y, y + height);
        if (sharedWidth < width) {
            if (!this.props.inverse) {
                y0 = y;
                y1 = y + height;
                y2 = yi(curvature);
                y3 = yi(1 - curvature);
            }
            else {
                y0 = y + height;
                y1 = y;
                y3 = yi(curvature);
                y2 = yi(1 - curvature);
            }
            return <g key={key}>
                <path d={"M" + x + "," + y0
                + "L" + (x + width) + "," + y0
                + "C" + (x + sharedWidth) + "," + y2
                + " " + (x + sharedWidth) + "," + y3
                + " " + (x + sharedWidth) + "," + y1
                + "L" + x + "," + y1
                + "L" + x + "," + y0} fill={color} opacity={0.5}/>
                <path d={"M" + x + "," + y0
                + "L" + (x + width) + "," + y0
                + "C" + (x + sharedWidth) + "," + y2
                + " " + (x + sharedWidth) + "," + y3
                + " " + (x + sharedWidth) + "," + y1}
                      fill={"none"} stroke={"#cccccc"} opacity={0.5}/>
                <path d={"M" + x + "," + y1
                + "L" + x + "," + y0} fill={"none"} stroke={"#cccccc"} opacity={0.5}/>
            </g>
        }
        else {
            return <rect key={key} x={x} y={y} width={width} height={height} fill={color} opacity={0.5}
                         stroke={"#cccccc"}
                         style={{strokeDasharray: 0 + "," + width + "," + height + "," + width + "," + height}}/>
        }
    }

    /**
     * gets all the transitions between a grouped and an ungrouped timepoint
     * @param {number} colorRecty - y position of the helper rectangle
     * @param {number} bandRectY
     * @param {number} y0 - y position of grouped timepoint
     * @param {number} y1 - y position of ungrouped timepoint
     * @returns {(rect|TriangleCurve)[]}
     */
    getTransitions(colorRecty, bandRectY, y0, y1) {
        let transitions = [];
        let proxies = [];
        let sourcePartitionPos = 0;
        this.props.partitions.forEach((currentPartition) => {
            let currXsource = sourcePartitionPos;
            const transitionPatients = this.sortTransitionPatients(currentPartition.patients.filter(patient => this.props.nonGrouped.patients.includes(patient)), this.props.heatmapScale);
            if (!this.props.uiStore.horizontalStacking) {
                proxies.push(<rect key={currentPartition.partition}
                                   x={sourcePartitionPos}
                                   y={colorRecty}
                                   width={this.props.visStore.groupScale(currentPartition.patients.length)}
                                   height={this.props.visStore.colorRectHeight}
                                   fill={this.props.colorScale(currentPartition.partition)}/>);
            }
            if (transitionPatients.length > 0) {
                let rectColor = "#dddddd";
                if (transitionPatients.filter(patient => this.props.dataStore.selectedPatients.includes(patient)).length > 0) {
                    rectColor = "#afafaf";
                }
                proxies.push(this.drawBandProxy(sourcePartitionPos, bandRectY, this.props.visStore.groupScale(transitionPatients.length),
                    this.props.visStore.groupScale(currentPartition.patients.length), this.props.visStore.bandRectHeight, rectColor, currentPartition.partition + "curveProxy"));
            }
            if (transitionPatients.length !== 0) {
                const transitionWidth = this.props.visStore.groupScale(currentPartition.patients.length) / currentPartition.patients.length;
                transitionPatients.forEach(f => {
                    transitions.push(<TriangleCurve key={f}
                                                    selectedPatients={this.props.dataStore.selectedPatients}
                                                    x0={currXsource}
                                                    x1={currXsource + transitionWidth}
                                                    x2={this.props.heatmapScale(f) + 0.5 * this.props.visStore.sampleRectWidth}
                                                    y0={y0}
                                                    y1={y1} patient={f}/>);
                    currXsource += transitionWidth;
                });
            }
            sourcePartitionPos += this.props.visStore.groupScale(currentPartition.patients.length) + this.props.visStore.partitionGap;
        });
        return (
            [transitions, proxies]
        )
    }

    /**
     * Sort patients in the transition by the heatmapscale of the heatmap timepoint to reduce overlapping transitions
     * @param {string[]} transitionPatients - patients in the transition
     * @param {function} heatmapScale
     * @return {string[]}
     */
    sortTransitionPatients(transitionPatients, heatmapScale) {
        return transitionPatients.sort(function (a, b) {
            if (heatmapScale(a) < heatmapScale(b)) {
                return -1;
            }
            else if (heatmapScale(a) > heatmapScale(b)) {
                return 1;
            }
            else return 0;
        })
    }

    render() {
        let y0, y1, recty, bandRectY;
        if (this.props.inverse) {
            y0 = this.props.visStore.transitionSpace - this.props.visStore.colorRectHeight - this.props.visStore.gap - this.props.visStore.bandRectHeight;
            y1 = this.props.visStore.gap;
            recty = this.props.visStore.transitionSpace - this.props.visStore.colorRectHeight - this.props.visStore.gap;
            bandRectY = y0
        }
        else {
            recty = this.props.visStore.gap;
            bandRectY = recty + this.props.visStore.colorRectHeight;
            y0 = bandRectY + this.props.visStore.bandRectHeight;
            y1 = this.props.visStore.transitionSpace;
        }
        return (this.getTransitions(recty, bandRectY, y0, y1))
    }
}));
export default HeatmapGroupTransition;