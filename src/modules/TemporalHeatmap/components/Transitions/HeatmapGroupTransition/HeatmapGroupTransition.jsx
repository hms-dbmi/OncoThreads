import React from 'react';
import {observer} from 'mobx-react';
import {isObservableArray} from 'mobx';
import TriangleCurve from './TriangleCurve'

/*
Creates a HeatmapGroupTransition (between GroupTimepoint and TimelineTimepoint)
 */
/*
TODO: make prettier, maybe make to classes: HeatmapGroupTransition and GroupHeatmapTransition
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
     * checks if the transition is going from an ungrouped timepoint to a grouped timepoint
     * @returns boolean
     */
    isReverse() {
        return (isObservableArray(this.props.transition.data[0].from))
    }

    /**
     * gets the length of a partition
     * @param partition
     * @param primaryVariable
     */
    getPartitionLength(partition, primaryVariable) {
        return partition.rows.filter(function (e) {
            return e.variable === primaryVariable;
        })[0].counts[0].value;
    }

    /**
     * gets the patients in a partition
     * @param partition: current partition
     * @param reverse: boolean indicating if the first or the second timepoint is grouped
     */
    getPartitionPatients(partition, reverse) {
        if (!reverse)
            return this.props.transition.data.filter(function (d, i) {
                return d.from === partition
            })[0].to;
        else return this.props.transition.data.filter(function (d, i) {
            return d.to === partition
        })[0].from;
    }

    /**
     * gets all the transitions between a grouped and an ungrouped timepoint
     * @param grouped: grouped timepoint
     * @param scale: scale for the width of the transitions
     * @param recty: y position of the helper rectangle
     * @param rectHeight: height of the helper rectangle
     * @param primary: primary variable
     * @param reverse: boolean (transition from heatmap to group or from group to heatmap)
     * @param y0: y position of grouped timepoint
     * @param y1: y position of ungrouped timepoint
     * @returns {*[]}
     */
    getTransitions(grouped, scale, recty, rectHeight, primary, reverse, y0, y1) {
        let transitions = [];
        let rects = [];
        const _self = this;
        let sourcePartitionPos = 0;
        grouped.grouped.forEach(function (d) {
            let currXsource = sourcePartitionPos;
            const partitionLength = _self.getPartitionLength(d, primary.id);
            rects.push(HeatmapGroupTransition.drawHelperRect(sourcePartitionPos, recty, _self.props.groupScale(partitionLength), rectHeight, primary.colorScale(d.partition), d.partition));
            let transitionPatients = _self.getPartitionPatients(d.partition, reverse);
            if (transitionPatients.length !== 0) {
                const transitionWidth = _self.props.groupScale(partitionLength) / partitionLength;
                transitionPatients.forEach(function (f) {
                    transitions.push(<TriangleCurve key={f} selectedPatients={_self.props.selectedPatients} x0={currXsource} x1={currXsource + transitionWidth}
                                                    x2={scale(f) + 0.5 * _self.props.visMap.sampleRectWidth} y0={y0}
                                                    y1={y1} patient={f}/>);
                    currXsource += transitionWidth;
                });
            }
            sourcePartitionPos += _self.props.groupScale(partitionLength) + 10;
        });
        return (
            [transitions, rects]
        )
    }

    render() {
        // reverse: the second timepoint is the grouped timepoint, the first timepoint is ungrouped
        let reverse = this.isReverse();
        const rectHeight = 2;
        let grouped, scale, y0, y1, primary, recty;
        if (reverse) {
            grouped = this.props.secondTimepoint;
            scale = this.props.firstHeatmapScale;
            y0 = this.props.visMap.transitionSpace - rectHeight - 2 * this.props.visMap.gap;
            y1 = 0 - this.props.visMap.gap;
            recty = y0;
            primary = this.props.secondPrimary
        }
        else {
            grouped = this.props.firstTimepoint;
            scale = this.props.secondHeatmapScale;
            y0 = 0 + this.props.visMap.gap + rectHeight;
            y1 = this.props.visMap.transitionSpace;
            recty = 0 + this.props.visMap.gap;
            primary = this.props.firstPrimary
        }
        return (this.getTransitions(grouped, scale, recty, rectHeight, primary, reverse, y0, y1))
    }
});
export default HeatmapGroupTransition;