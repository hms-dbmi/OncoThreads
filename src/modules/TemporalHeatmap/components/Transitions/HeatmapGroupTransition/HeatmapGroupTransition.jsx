import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import TriangleCurve from './TriangleCurve';
import Proxies from '../Proxies';
import SingleTimepoint from '../../../stores/SingleTimepoint';

/**
 * Component for creating transitions between heatmap and grouped timepoints
 */
const HeatmapGroupTransition = inject('dataStore', 'visStore', 'uiStore')(observer(class HeatmapGroupTransition extends React.Component {
    /**
     * Sort patients in the transition by the heatmapscale
     * of the heatmap timepoint to reduce overlapping transitions
     * @param {string[]} transitionPatients - patients in the transition
     * @param {function} heatmapScale
     * @return {string[]}
     */
    static sortTransitionPatients(transitionPatients, heatmapScale) {
        return transitionPatients.sort((a, b) => {
            if (heatmapScale(a) < heatmapScale(b)) {
                return -1;
            }
            if (heatmapScale(a) > heatmapScale(b)) {
                return 1;
            }
            return 0;
        });
    }

    /**
     * get the offset corresponding to the current UI block align setting
     * @param {number} offsetPatients
     * @return {number}
     */
    getOffset(offsetPatients) {
        switch (this.props.uiStore.blockAlignment) {
        case 'left':
            return 0;
        case 'middle':
            return this.props.visStore
                .groupScale(offsetPatients) / 2;
        default:
            return this.props.visStore
                .groupScale(offsetPatients);
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
        const transitions = [];
        let sourcePartitionPos = this.props.visStore.getTpXTransform(this.props.index);

        // proxy positions for grouped timepoint
        const proxyPositions = [];
        let proxies = null;
        this.props.partitions.forEach((currentPartition) => {
            const transitionPatients = HeatmapGroupTransition.sortTransitionPatients(
                currentPartition.patients.filter(patient => this.props.nonGrouped.patients
                    .includes(patient)), this.props.heatmapScale,
            );
            let currXsource = sourcePartitionPos;
            const offset = this.getOffset(currentPartition.patients.length
                - transitionPatients.length);
            if (transitionPatients.length > 0) {
                const transitionWidth = this.props.visStore
                    .groupScale(currentPartition.patients.length)
                    / currentPartition.patients.length;
                const selectedSegments = [];
                transitionPatients.forEach((f) => {
                    transitions.push(<TriangleCurve
                        key={f}
                        patient={f}
                        x0={currXsource + offset}
                        x1={currXsource + offset + transitionWidth}
                        x2={this.props.heatmapScale(f) + 0.5 * this.props.visStore.sampleRectWidth}
                        y0={y0}
                        y1={y1}
                    />);
                    if (this.props.dataStore.selectedPatients.includes(f)) {
                        selectedSegments.push([currXsource + offset, currXsource + offset
                        + this.props.visStore.groupScale(1)]);
                    }
                    currXsource += transitionWidth;
                });
                proxyPositions.push({
                    key: currentPartition.partition,
                    x0: sourcePartitionPos,
                    offset,
                    width: this.props.visStore.groupScale(currentPartition.patients.length),
                    sharedWidth: this.props.visStore.groupScale(transitionPatients.length),
                    selected: selectedSegments,
                });
            }
            sourcePartitionPos += this.props.visStore.groupScale(currentPartition.patients.length)
                + this.props.visStore.partitionGap;
        });
        // only create proxies for vertical stacking
        if (!this.props.uiStore.horizontalStacking) {
            proxies = (
                <Proxies
                    key="proxies"
                    proxyPositions={proxyPositions}
                    bandRectY={bandRectY}
                    colorRectY={colorRecty}
                    colorScale={this.props.colorScale}
                    inverse={this.props.inverse}
                />
            );
        }
        return (
            [transitions, proxies]
        );
    }

    render() {
        let y0;
        let y1;
        let recty;
        let bandRectY;
        if (this.props.inverse) {
            y0 = this.props.visStore.transitionSpace - this.props.visStore.colorRectHeight
                - this.props.uiStore.horizontalGap - this.props.visStore.bandRectHeight;
            y1 = this.props.uiStore.horizontalGap;
            recty = this.props.visStore.transitionSpace - this.props.visStore.colorRectHeight
                - this.props.uiStore.horizontalGap;
            bandRectY = y0;
        } else {
            recty = this.props.uiStore.horizontalGap;
            bandRectY = recty + this.props.visStore.colorRectHeight;
            y0 = bandRectY + this.props.visStore.bandRectHeight;
            y1 = this.props.visStore.transitionSpace;
        }
        return (this.getTransitions(recty, bandRectY, y0, y1));
    }
}));
HeatmapGroupTransition.propTypes = {
    partitions: PropTypes.arrayOf(PropTypes.object).isRequired,
    nonGrouped: PropTypes.instanceOf(SingleTimepoint).isRequired,
    heatmapScale: PropTypes.func.isRequired,
    colorScale: PropTypes.func.isRequired,
    inverse: PropTypes.bool.isRequired,
};
export default HeatmapGroupTransition;
