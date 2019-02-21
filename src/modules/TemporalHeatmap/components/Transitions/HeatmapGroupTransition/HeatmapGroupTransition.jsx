import React from 'react';
import {observer} from 'mobx-react';
import TriangleCurve from './TriangleCurve'

/*
Creates a HeatmapGroupTransition (between GroupTimepoint and HeatmapTimepoint)
 */
const HeatmapGroupTransition = observer(class HeatmapGroupTransition extends React.Component {
    /**
     * draws a small rectangle to repeat the color of a partition with the primary Variable
     * @param x position
     * @param y position
     * @param width of rect
     * @param height of rect
     * @param color color of rect
     * @param key (unique)
     * @returns rectangle
     */
    static drawHelperRect(x, y, width, height, color, key) {
        return (<rect key={key} x={x} y={y} width={width} height={height} fill={color}/>)
    }


    /**
     * gets all the transitions between a grouped and an ungrouped timepoint
     * @param recty: y position of the helper rectangle
     * @param rectHeight: height of the helper rectangle
     * @param y0: y position of grouped timepoint
     * @param y1: y position of ungrouped timepoint
     * @returns {*[]}
     */
    getTransitions(recty, rectHeight, y0, y1) {
        let transitions = [];
        let rects = [];
        let sourcePartitionPos = 0;
        this.props.partitions.forEach((currentPartition)=> {
            let currXsource = sourcePartitionPos;
            rects.push(HeatmapGroupTransition.drawHelperRect(sourcePartitionPos, recty, this.props.groupScale(currentPartition.patients.length), rectHeight, this.props.colorScale(currentPartition.partition), currentPartition.partition));
            const sharedPatients=currentPartition.patients.filter(patient => this.props.nonGrouped.patients.includes(patient));
            let transitionPatients = this.sortTransitionPatients(sharedPatients, this.props.heatmapScale);
            if (transitionPatients.length !== 0) {
                const transitionWidth = this.props.groupScale(currentPartition.patients.length) / currentPartition.patients.length;
                transitionPatients.forEach(f=> {
                    transitions.push(<TriangleCurve key={f} selectedPatients={this.props.store.selectedPatients}
                                                    x0={currXsource} x1={currXsource + transitionWidth}
                                                    x2={this.props.heatmapScale(f) + 0.5 * this.props.visMap.sampleRectWidth} y0={y0}
                                                    y1={y1} patient={f}/>);
                    currXsource += transitionWidth;
                });
            }
            sourcePartitionPos += this.props.groupScale(currentPartition.patients.length) + this.props.visMap.partitionGap;
        });
        return (
            [transitions, rects]
        )
    }

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
        const rectHeight = 2;
        let y0, y1, recty;
        if (this.props.inverse) {
            y0 = this.props.visMap.transitionSpace - rectHeight - 2 * this.props.visMap.gap;
            y1 = 0 - this.props.visMap.gap;
            recty = y0;
        }
        else {
            y0 = 0 + this.props.visMap.gap + rectHeight;
            y1 = this.props.visMap.transitionSpace;
            recty = 0 + this.props.visMap.gap;
        }
        return (this.getTransitions(recty, rectHeight, y0, y1))
    }
});
export default HeatmapGroupTransition;