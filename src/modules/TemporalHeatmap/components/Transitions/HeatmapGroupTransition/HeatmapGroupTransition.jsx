import React from 'react';
import {inject, observer} from 'mobx-react';
import TriangleCurve from './TriangleCurve'
import Proxies from "../Proxies";

/**
 * Component for creating transitions between heatmap and grouped timepoints
 */
const HeatmapGroupTransition = inject("dataStore", "visStore", "uiStore")(observer(class HeatmapGroupTransition extends React.Component {
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
        let sourcePartitionPos = 0;
        let proxyPositions = [];
        this.props.partitions.forEach((currentPartition, i) => {
            let currXsource = sourcePartitionPos;
            const transitionPatients = this.sortTransitionPatients(currentPartition.patients.filter(patient => this.props.nonGrouped.patients.includes(patient)), this.props.heatmapScale);
            if (transitionPatients.length > 0) {
                proxyPositions.push({
                    key: currentPartition.partition,
                    x0: sourcePartitionPos,
                    width: this.props.visStore.groupScale(currentPartition.patients.length),
                    sharedWidth: this.props.visStore.groupScale(transitionPatients.length),
                    selected: []
                });
                const transitionWidth = this.props.visStore.groupScale(currentPartition.patients.length) / currentPartition.patients.length;
                transitionPatients.forEach(f => {
                    transitions.push(<TriangleCurve key={f}
                                                    isSelected={this.props.dataStore.selectedPatients.includes(f)}
                                                    x0={currXsource}
                                                    x1={currXsource + transitionWidth}
                                                    x2={this.props.heatmapScale(f) + 0.5 * this.props.visStore.sampleRectWidth}
                                                    y0={y0}
                                                    y1={y1}/>);
                    if (this.props.dataStore.selectedPatients.includes(f)) {
                        proxyPositions[i].selected.push([currXsource, currXsource + this.props.visStore.groupScale(1)]);
                    }
                    currXsource += transitionWidth;
                });
            }
            sourcePartitionPos += this.props.visStore.groupScale(currentPartition.patients.length) + this.props.visStore.partitionGap;
        });
        return (
            [transitions, <Proxies key={"proxies"} proxyPositions={proxyPositions} bandRectY={bandRectY} colorRectY={colorRecty}
                                   colorScale={this.props.colorScale} inverse={this.props.inverse}/>]
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