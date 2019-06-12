import React from 'react';
import {observer,inject} from 'mobx-react';
import TriangleCurve from './TriangleCurve'

/**
 * Component for creating transitions between heatmap and grouped timepoints
 */
const HeatmapGroupTransition = inject("dataStore","visStore","uiStore")(observer(class HeatmapGroupTransition extends React.Component {
    /**
     * draws a small rectangle to repeat the color of a partition with the primary Variable
     * @param {number} x - position
     * @param {number} y - position
     * @param {number} width - width of rect
     * @param {number} height - height of rect
     * @param {string} color - color of rect
     * @param {string} key - (unique)
     * @returns {rect}
     */
    static drawHelperRect(x, y, width, height, color, key) {
        return (<rect key={key} x={x} y={y} width={width} height={height} fill={color}/>)
    }

    /**
     * gets all the transitions between a grouped and an ungrouped timepoint
     * @param {number} recty - y position of the helper rectangle
     * @param {number} y0 - y position of grouped timepoint
     * @param {number} y1 - y position of ungrouped timepoint
     * @returns {(rect|TriangleCurve)[]}
     */
    getTransitions(recty, y0, y1) {
        let transitions = [];
        let rects = [];
        let sourcePartitionPos = 0;
        this.props.partitions.forEach((currentPartition)=> {
            let currXsource = sourcePartitionPos;
            if(!this.props.uiStore.horizontalStacking) {
                rects.push(HeatmapGroupTransition.drawHelperRect(sourcePartitionPos, recty, this.props.visStore.groupScale(currentPartition.patients.length), this.props.visStore.helperRectHeight, this.props.colorScale(currentPartition.partition), currentPartition.partition));
            }
            const sharedPatients=currentPartition.patients.filter(patient => this.props.nonGrouped.patients.includes(patient));
            let transitionPatients = this.sortTransitionPatients(sharedPatients, this.props.heatmapScale);
            if (transitionPatients.length !== 0) {
                const transitionWidth = this.props.visStore.groupScale(currentPartition.patients.length) / currentPartition.patients.length;
                transitionPatients.forEach(f=> {
                    transitions.push(<TriangleCurve key={f} selectedPatients={this.props.dataStore.selectedPatients}
                                                    x0={currXsource} x1={currXsource + transitionWidth}
                                                    x2={this.props.heatmapScale(f) + 0.5 * this.props.visStore.sampleRectWidth} y0={y0}
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
     * @param {d3.scaleLinear} heatmapScale
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
        let y0, y1, recty;
        if (this.props.inverse) {
            y0 = this.props.visStore.transitionSpace - this.props.visStore.helperRectHeight - this.props.visStore.gap;
            y1 = this.props.visStore.gap;
            recty = y0;
        }
        else {
            y0 = this.props.visStore.gap + this.props.visStore.helperRectHeight;
            y1 = this.props.visStore.transitionSpace;
            recty = this.props.visStore.gap;
        }
        return (this.getTransitions(recty, y0, y1))
    }
}));
export default HeatmapGroupTransition;