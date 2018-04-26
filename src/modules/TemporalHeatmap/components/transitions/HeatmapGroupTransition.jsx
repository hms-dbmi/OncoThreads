import React from 'react';
import * as d3 from 'd3';
import {observer} from 'mobx-react';
import {isObservableArray} from 'mobx';

/*
Creates a HeatmapGroupTransition (between GroupTimepoint and HeatmapTimepoint
 */
/*
TODO: make prettier, maybe make to classes: HeatmapGroupTransition and GroupHeatmapTransition
 */
const HeatmapGroupTransition = observer(class HeatmapGroupTransition extends React.Component {
    /**
     * draws a single HeatmapGroupTransition
     * @param x0: start point on source partition
     * @param x1: start point on target partition
     * @param x2
     * @param y0
     * @param y1
     * @param key: unique transition key
     * @param strokeColor
     * @returns transition path
     */
    static drawTransition(x0, x1, x2, y0, y1, key,strokeColor) {
        const curvature = .5;
        const yi = d3.interpolateNumber(y0, y1),
            y2 = yi(curvature),
            y3 = yi(1 - curvature);

        let path = "M" + x0 + "," + y0
            + "C" + x0 + "," + y2
            + " " + x2 + "," + y3
            + " " + x2 + "," + y1
            + "C" + (x2) + "," + y3
            + " " + (x1) + "," + y2
            + " " + (x1) + "," + y0;

        return (<path key={key} d={path} stroke={strokeColor} fill={strokeColor} opacity={0.5}/>)
    }

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
    static drawHelperRect(x, y, width, height, color,key) {
        return (<rect key={key} x={x} y={y} width={width} height={height} fill={color}/>)
    }

    /**
     * draws all transitons between the partitions of the grouped timepoint and the patients of the heatmap timepoint
     * @returns {Array}
     */
    drawTransitions() {
        // reverse: the second timepoint is the grouped timepoint, the first timepoint is ungrouped
        let reverse = this.isReverse();
        const rectHeight = 5;
        let grouped, scale, y0, y1, primary, recty;
        if (reverse) {
            grouped = this.props.secondTimepoint;
            scale = this.props.firstHeatmapScale;
            y0 = this.props.height - rectHeight - 2 * this.props.gap;
            y1 = 0 - this.props.gap;
            recty = y0;
            primary = this.props.secondPrimary
        }
        else {
            grouped = this.props.firstTimepoint;
            scale = this.props.secondHeatmapScale;
            y0 = 0 + this.props.gap + rectHeight;
            y1 = this.props.height;
            recty = 0 + this.props.gap;
            primary = this.props.firstPrimary
        }
        let transitions = [];
        let rects = [];
        const _self = this;
        let sourcePartitionPos = 0;
        grouped.group.data.forEach(function (d) {
            let currXsource = sourcePartitionPos;
            const partitionLength = _self.getPartitionLength(d, primary.variable);
            rects.push(HeatmapGroupTransition.drawHelperRect(sourcePartitionPos, recty, _self.props.groupScale(partitionLength), rectHeight, _self.props.visMap.getColorScale(primary.variable,primary.type)(d.partition),d.partition));
            let transitionPatients = _self.getPartitionPatients(d.partition, reverse);
            if (transitionPatients.length !== 0) {
                const transitionWidth = _self.props.groupScale(partitionLength) / partitionLength;
                transitionPatients.forEach(function (f) {
                let strokeColor="lightgray";
                if(_self.props.selectedPatients.includes(f)){
                    strokeColor="#737373"
                }
                    transitions.push(HeatmapGroupTransition.drawTransition(currXsource, currXsource + transitionWidth, scale(f) + 0.5 * _self.props.rectWidth, y0, y1, f,strokeColor));
                    currXsource += transitionWidth;
                });
            }
            sourcePartitionPos += _self.props.groupScale(partitionLength) + 10;
        });
        return [transitions, rects];
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


    render() {
        return (
            this.drawTransitions()
        )
    }
});
export default HeatmapGroupTransition;