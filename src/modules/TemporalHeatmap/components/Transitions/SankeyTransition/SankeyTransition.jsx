import React from 'react';
import {inject, observer} from 'mobx-react';
import Band from './Band'

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
     * @returns {rect}
     */
    static drawHelperRect(x, y, width, height, color, key, opacity) {
        return (<rect key={key} x={x} y={y} width={width} height={height} fill={color} opacity={opacity}/>)
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
        this.props.firstGrouped.forEach((sourcePartition, i) => {
                let currXsource = sourcePartitionPos;
                if (!this.props.uiStore.horizontalStacking) {
                    rects.push(SankeyTransition.drawHelperRect(sourcePartitionPos, this.props.visStore.gap, this.props.visStore.groupScale(sourcePartition.patients.length),
                        this.props.visStore.colorRectHeight, this.props.firstPrimary.colorScale(sourcePartition.partition), sourcePartition.partition + "source", 1));
                }
                let rectColor = "#dddddd";
                if (sourcePartition.patients.filter(patient => this.props.dataStore.selectedPatients.includes(patient)).length > 0) {
                    rectColor = "#afafaf";
                }
                rects.push(SankeyTransition.drawHelperRect(sourcePartitionPos, this.props.visStore.gap + this.props.visStore.colorRectHeight,
                    this.props.visStore.groupScale(sourcePartition.patients.length), this.props.visStore.bandRectHeight, rectColor,
                    sourcePartition.partition + "sourceBand", 0.5));
                let targetPartitionPos = 0;
                this.props.secondGrouped.forEach(targetPartition => {
                    if (i === 0) {
                        if (!this.props.uiStore.horizontalStacking) {
                            rects.push(SankeyTransition.drawHelperRect(targetPartitionPos, this.props.visStore.transitionSpace - this.props.visStore.colorRectHeight - this.props.visStore.gap,
                                this.props.visStore.groupScale(targetPartition.patients.length), this.props.visStore.colorRectHeight, this.props.secondPrimary.colorScale(targetPartition.partition),
                                targetPartition.partition + "target", 1));
                        }
                        let rectColor = "#dddddd";
                        if (targetPartition.patients.filter(patient => this.props.dataStore.selectedPatients.includes(patient)).length > 0) {
                            rectColor = "#afafaf";
                        }
                        rects.push(SankeyTransition.drawHelperRect(targetPartitionPos, this.props.visStore.transitionSpace - this.props.visStore.colorRectHeight -
                            this.props.visStore.gap * 2 - this.props.visStore.bandRectHeight, this.props.visStore.groupScale(targetPartition.patients.length),
                            this.props.visStore.bandRectHeight, rectColor, targetPartition.partition + "targetBand", 0.5));
                    }

                    let patientIntersection = sourcePartition.patients.filter(patient => targetPartition.patients.includes(patient));
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
                    targetPartitionPos += this.props.visStore.groupScale(targetPartition.patients.length) + 10;
                });
                sourcePartitionPos += this.props.visStore.groupScale(sourcePartition.patients.length) + 10;
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