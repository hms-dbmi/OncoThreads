import React from 'react';
import {inject, observer} from 'mobx-react';
import Band from './Band'
import * as d3 from "d3";

/**
 * Component for a transition between grouped timepoints ("Sankey Transition")
 */
const SankeyTransition = inject("dataStore", "visStore", "uiStore")(observer(class SankeyTransition extends React.Component {

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
        return (<rect key={key} x={x} y={y} width={width} height={height} fill={color} opacity={opacity} stroke={stroke}
                      style={{strokeDasharray: strokeArray}}/>)
    }

    static drawHelperCurve(x, y, sharedWidth, width, height, color,inverse) {
        const curvature = 1;
       let y0, y1, y2, y3;
        const yi = d3.interpolateNumber(y, y + height);
        if (!inverse) {
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
        return <g>
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
     * draws transitions between all partitions of the first and the second timepoint
     * @returns {(rect|Band)[]}
     */
    drawTransitions() {
        let transitions = [];
        let rects = [];
        let currXtarget = {};
        let sourcePartitionPos = 0;
        let allSourcePatients = [].concat(...this.props.firstGrouped.map(d => d.patients));
        this.props.firstGrouped.forEach((sourcePartition, i) => {
                let currXsource = sourcePartitionPos;
                if (!this.props.uiStore.horizontalStacking) {
                    rects.push(SankeyTransition.drawHelperRect(sourcePartitionPos, this.props.visStore.gap, this.props.visStore.groupScale(sourcePartition.patients.length),
                        this.props.visStore.colorRectHeight, this.props.firstPrimary.colorScale(sourcePartition.partition), sourcePartition.partition + "source", 1, false));
                }
                let rectColor = "#dddddd";
                if (sourcePartition.patients.filter(patient => this.props.dataStore.selectedPatients.includes(patient)).length > 0) {
                    rectColor = "#afafaf";
                }
                let targetPartitionPos = 0;
                let allTargetPatients = [];
                this.props.secondGrouped.forEach(targetPartition => {
                    if (i === 0) {
                        if (!this.props.uiStore.horizontalStacking) {
                            rects.push(SankeyTransition.drawHelperRect(targetPartitionPos, this.props.visStore.transitionSpace - this.props.visStore.colorRectHeight - this.props.visStore.gap,
                                this.props.visStore.groupScale(targetPartition.patients.length), this.props.visStore.colorRectHeight, this.props.secondPrimary.colorScale(targetPartition.partition),
                                targetPartition.partition + "target", 1, false));
                        }
                        let rectColor = "#dddddd";
                        if (targetPartition.patients.filter(patient => this.props.dataStore.selectedPatients.includes(patient)).length > 0) {
                            rectColor = "#afafaf";
                        }
                        const shared = targetPartition.patients.filter(patient => allSourcePatients.includes(patient));
                        if (shared.length < targetPartition.patients.length) {
                            if (shared.length > 0) {
                                rects.push(SankeyTransition.drawHelperCurve(targetPartitionPos,
                                    this.props.visStore.transitionSpace - this.props.visStore.colorRectHeight -
                                    this.props.visStore.gap * 2 - this.props.visStore.bandRectHeight,
                                    this.props.visStore.groupScale(shared.length), this.props.visStore.groupScale(targetPartition.patients.length),
                                    this.props.visStore.bandRectHeight, rectColor,true));
                            }
                        }
                        else{
                            rects.push(SankeyTransition.drawHelperRect(targetPartitionPos, this.props.visStore.transitionSpace - this.props.visStore.colorRectHeight -
                                this.props.visStore.gap * 2 - this.props.visStore.bandRectHeight, this.props.visStore.groupScale(shared.length),
                                this.props.visStore.bandRectHeight, rectColor, targetPartition.partition + "targetBand", 0.5, true));
                        }
                    }

                    let patientIntersection = sourcePartition.patients.filter(patient => targetPartition.patients.includes(patient));
                    allTargetPatients.push(...patientIntersection);
                    if (!(targetPartition.partition in currXtarget)) {
                        currXtarget[targetPartition.partition] = targetPartitionPos
                    }
                    if (patientIntersection.length !== 0) {
                        const transitionWidth = patientIntersection.length * (this.props.visStore.groupScale(sourcePartition.patients.length) / sourcePartition.patients.length);
                        transitions.push(
                            <Band key={sourcePartition.partition + "->" + targetPartition.partition}
                                  x0={currXsource}
                                  x1={currXtarget[targetPartition.partition]}
                                  {...this.props.tooltipFunctions}
                                  width={transitionWidth}
                                  firstPartition={sourcePartition.partition}
                                  secondPartition={targetPartition.partition}
                                  patients={patientIntersection}
                                  firstPrimary={this.props.firstPrimary}
                                  secondPrimary={this.props.secondPrimary}
                            />);
                        currXsource += transitionWidth;
                        currXtarget[targetPartition.partition] += transitionWidth;
                    }
                    targetPartitionPos += this.props.visStore.groupScale(targetPartition.patients.length) + this.props.visStore.partitionGap;
                });
                if (sourcePartition.patients.length > allTargetPatients.length) {
                    if (allTargetPatients.length > 0) {
                        rects.push(SankeyTransition.drawHelperCurve(sourcePartitionPos, this.props.visStore.gap + this.props.visStore.colorRectHeight,
                            this.props.visStore.groupScale(allTargetPatients.length), this.props.visStore.groupScale(sourcePartition.patients.length), this.props.visStore.bandRectHeight, rectColor,false));
                    }
                }
                else {
                    rects.push(SankeyTransition.drawHelperRect(sourcePartitionPos, this.props.visStore.gap + this.props.visStore.colorRectHeight,
                        this.props.visStore.groupScale(sourcePartition.patients.length), this.props.visStore.bandRectHeight, rectColor,
                        sourcePartition.partition + "sourceBand", 0.5, true));
                }
                sourcePartitionPos += this.props.visStore.groupScale(sourcePartition.patients.length) + this.props.visStore.partitionGap;
            }
        );
        return [transitions, rects];
    }


    render() {
        return (
            this.drawTransitions()
        )
    }
}));
export default SankeyTransition;