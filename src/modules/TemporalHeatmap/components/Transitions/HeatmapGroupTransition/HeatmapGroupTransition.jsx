import React from 'react';
import {inject, observer} from 'mobx-react';
import TriangleCurve from './TriangleCurve'
import * as d3 from "d3";

/**
 * Component for creating transitions between heatmap and grouped timepoints
 */
const HeatmapGroupTransition = inject("dataStore", "visStore", "uiStore")(observer(class HeatmapGroupTransition extends React.Component {
    /**
     * draws a small rectangle to repeat the color of a partition with the primary Variable
     * @param {number} x - x position
     * @param {number} y - y position
     * @param {number} width - widthof rect
     * @param {number} height - height of rect
     * @param {string} color - color of rect
     * @param {string} key - (unique)
     * @param {number} opacity
     * @param {boolean} hasStroke
     * @returns {rect}
     */
    static drawHelperRect(x, y, width, height, color, key, opacity, hasStroke) {
        let stroke = "";
        let strokeArray = "";
        if (hasStroke) {
            stroke = "#cccccc";
            strokeArray = 0 + "," + width + "," + height + "," + width + "," + height;
        }
        return <rect key={key} x={x} y={y} width={width} height={height} fill={color} opacity={opacity} stroke={stroke}
                     style={{strokeDasharray: strokeArray}}/>
    }

    drawHelperCurve(x, y, sharedWidth, width, height, color, key) {
        const curvature = 1;
        let y0, y1, y2, y3;
        const yi = d3.interpolateNumber(y, y + height);
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
        let rects = [];
        let sourcePartitionPos = 0;
        this.props.partitions.forEach((currentPartition) => {
            let currXsource = sourcePartitionPos;
            const transitionPatients = this.sortTransitionPatients(currentPartition.patients.filter(patient => this.props.nonGrouped.patients.includes(patient)),
                this.props.heatmapScale);
            if (!this.props.uiStore.horizontalStacking) {
                rects.push(HeatmapGroupTransition.drawHelperRect(sourcePartitionPos, colorRecty, this.props.visStore.groupScale(currentPartition.patients.length),
                    this.props.visStore.colorRectHeight, this.props.colorScale(currentPartition.partition), currentPartition.partition, 1, false));
            }
            if (transitionPatients.length > 0) {
                let rectColor = "#dddddd";
                if (transitionPatients.filter(patient => this.props.dataStore.selectedPatients.includes(patient)).length > 0) {
                    rectColor = "#afafaf";
                }
                if (transitionPatients.length < currentPartition.patients.length) {
                    rects.push(this.drawHelperCurve(sourcePartitionPos, bandRectY, this.props.visStore.groupScale(transitionPatients.length),
                        this.props.visStore.groupScale(currentPartition.patients.length), this.props.visStore.bandRectHeight, rectColor, currentPartition.partition + "curve"));
                }
                else {
                    rects.push(HeatmapGroupTransition.drawHelperRect(sourcePartitionPos, bandRectY, this.props.visStore.groupScale(currentPartition.patients.length),
                        this.props.visStore.bandRectHeight, rectColor, currentPartition.partition + "band", 0.5, true));
                }
            }
            if (transitionPatients.length !== 0) {
                const transitionWidth = this.props.visStore.groupScale(currentPartition.patients.length) / currentPartition.patients.length;
                transitionPatients.forEach(f => {
                    transitions.push(<TriangleCurve key={f} selectedPatients={this.props.dataStore.selectedPatients}
                                                    x0={currXsource} x1={currXsource + transitionWidth}
                                                    x2={this.props.heatmapScale(f) + 0.5 * this.props.visStore.sampleRectWidth}
                                                    y0={y0}
                                                    y1={y1} patient={f}/>);
                    currXsource += transitionWidth;
                });
            }
            sourcePartitionPos += this.props.visStore.groupScale(currentPartition.patients.length) + this.props.visStore.partitionGap;
        });
        return (
            [transitions, rects]
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