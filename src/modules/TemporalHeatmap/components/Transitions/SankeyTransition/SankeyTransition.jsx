import React from 'react';
import {inject, observer} from 'mobx-react';
import Band from './Band'
import * as d3 from "d3";

/**
 * Component for a transition between grouped timepoints ("Sankey Transition")
 */
const SankeyTransition = inject("dataStore", "visStore", "uiStore")(observer(class SankeyTransition extends React.Component {

    /**
     * draws a curve or rect for the band proxy
     * @param {number} x
     * @param {number} y
     * @param {number} sharedWidth
     * @param {number} width
     * @param {number} height
     * @param {string} color
     * @param {boolean} inverse
     * @param {string} key
     * @return {path}
     */
    static drawBandProxy(x, y, sharedWidth, width, height, color, inverse, key) {
        const curvature = 1;
        let y0, y1, y2, y3;
        const yi = d3.interpolateNumber(y, y + height);
        if (sharedWidth < width) {
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
     * draws transitions between all partitions of the first and the second timepoint
     * @returns {*[]}
     */
    drawTransitions() {
        let transitions = [];
        let proxies = [];
        let currXtarget = {};
        let sourcePartitionPos = 0;
        let allSourcePatients = [].concat(...this.props.firstGrouped.map(d => d.patients));
        this.props.firstGrouped.forEach((sourcePartition, i) => {
                let currXsource = sourcePartitionPos;
                if (!this.props.uiStore.horizontalStacking) {
                    proxies.push(<rect key={sourcePartition.partition + "source"}
                                     x={sourcePartitionPos}
                                     y={this.props.visStore.gap}
                                     width={this.props.visStore.groupScale(sourcePartition.patients.length)}
                                     height={this.props.visStore.colorRectHeight}
                                     fill={this.props.firstPrimary.colorScale(sourcePartition.partition)}/>);
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
                            proxies.push(<rect key={targetPartition.partition + "target"}
                                             x={targetPartitionPos}
                                             y={this.props.visStore.transitionSpace - this.props.visStore.colorRectHeight - this.props.visStore.gap}
                                             width={this.props.visStore.groupScale(targetPartition.patients.length)}
                                             height={this.props.visStore.colorRectHeight}
                                             fill={this.props.secondPrimary.colorScale(targetPartition.partition)}/>)
                        }
                        let rectColor = "#dddddd";
                        if (targetPartition.patients.filter(patient => this.props.dataStore.selectedPatients.includes(patient)).length > 0) {
                            rectColor = "#afafaf";
                        }
                        const shared = targetPartition.patients.filter(patient => allSourcePatients.includes(patient));
                        if (shared.length > 0) {
                            proxies.push(SankeyTransition.drawBandProxy(targetPartitionPos,
                                this.props.visStore.transitionSpace - this.props.visStore.colorRectHeight -
                                this.props.visStore.gap * 2 - this.props.visStore.bandRectHeight,
                                this.props.visStore.groupScale(shared.length), this.props.visStore.groupScale(targetPartition.patients.length),
                                this.props.visStore.bandRectHeight, rectColor, true, targetPartition.partition + "targetBand"));
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
                if (allTargetPatients.length > 0) {
                    proxies.push(SankeyTransition.drawBandProxy(sourcePartitionPos, this.props.visStore.gap + this.props.visStore.colorRectHeight,
                        this.props.visStore.groupScale(allTargetPatients.length), this.props.visStore.groupScale(sourcePartition.patients.length),
                        this.props.visStore.bandRectHeight, rectColor, false, sourcePartition.partition + "sourceBand"));
                }
                sourcePartitionPos += this.props.visStore.groupScale(sourcePartition.patients.length) + this.props.visStore.partitionGap;
            }
        );
        return [transitions, proxies];
    }


    render() {
        return (
            this.drawTransitions()
        )
    }
}));
export default SankeyTransition;