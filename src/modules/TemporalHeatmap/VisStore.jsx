import {extendObservable, reaction} from "mobx";
import * as d3 from 'd3';

/*
stores information about current visual parameters
 */
class VisStore {
    constructor(rootStore) {
        //width of rects in sampleTimepoints
        this.rootStore = rootStore;
        this.sampleRectWidth = 10;
        //height of rects in a row which is primary
        this.primaryHeight = 30;
        this.secondaryHeight = 15;
        //gap between rows in heatmap
        this.gap = 1;
        //space for transitions
        //gap between partitions in grouped timepoints
        this.partitionGap = 10;
        this.svgWidth = 700;
        this.heatmapWidth=700;

        this.globalTimelineColors = d3.scaleOrdinal().range(['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#38aab0', '#f0027f', '#bf5b17', '#6a3d9a', '#ff7f00', '#e31a1c']);
        extendObservable(this, {
            transitionSpace: 100,
            timepointY: [],
            plotHeight: 700,
            transY: [],
            get svgHeight() {
                return (this.timepointPositions.connection[this.timepointPositions.connection.length - 1] + this.getTPHeight(this.rootStore.dataStore.timepoints[this.rootStore.dataStore.timepoints.length - 1]));
            },
            get timepointPositions() {
                let timepointPositions = {"timepoint": [], "connection": []};
                let prevY = 0;
                const _self = this;
                this.rootStore.dataStore.timepoints.forEach(function (d) {
                    let tpHeight = _self.getTPHeight(d);
                    timepointPositions.timepoint.push(prevY);
                    timepointPositions.connection.push(prevY + tpHeight);
                    prevY += _self.transitionSpace + tpHeight
                });
                return timepointPositions;
            }
        });
        reaction(
            () => this.plotHeight,
            length => this.fitToScreenHeight());
    }

    setPlotY(y) {
        this.plotHeight = (window.innerHeight
            || document.documentElement.clientHeight
            || document.body.clientHeight) - y;
    }

    fitToScreenHeight() {
        let heightWithoutSpace = 0;
        const _self = this;
        this.rootStore.dataStore.timepoints.forEach(function (d) {
            heightWithoutSpace += _self.getTPHeight(d);
        });
        let remainingHeight = this.plotHeight - heightWithoutSpace;
        let transitionSpace = remainingHeight / (this.rootStore.dataStore.timepoints.length - 1);
        if (transitionSpace > 30) {
            this.transitionSpace = transitionSpace
        }
        else this.transitionSpace = 30;
    }

    setTransitionSpace(transitionSpace) {
        this.transitionSpace = transitionSpace;
    }


    setVisParameters(plotWidth, zoom,maxPartitions) {
        this.sampleRectWidth = plotWidth / zoom - this.gap;
        this.heatmapWidth=this.rootStore.dataStore.numberOfPatients * (this.sampleRectWidth + this.gap) - this.gap;
        this.svgWidth = this.heatmapWidth > plotWidth ? this.heatmapWidth + maxPartitions * this.partitionGap + this.sampleRectWidth : plotWidth;
    }




    /**
     * computes the height of a timepoint
     * @param numVar
     * @returns {*}
     */
    getTimepointHeight(numVar) {
        if (numVar === 0) {
            return 0;
        }
        else {
            return (this.primaryHeight + this.gap + (numVar - 1) * (this.secondaryHeight + this.gap));
        }
    }

    getTPHeight(timepoint) {
        const _self = this;
        let height = 0;
        let varCount = 0;
        timepoint.heatmap.forEach(function (d, i) {
            if (!d.isUndef || _self.rootStore.dataStore.showUndefined || d.variable === timepoint.primaryVariableId) {
                varCount += 1;
                if (d.variable === timepoint.primaryVariableId) {
                    height += _self.primaryHeight;
                }
                else {
                    height += _self.secondaryHeight;
                }
            }
        });
        return height + (varCount - 1) * this.gap;
    }

    /**
     * computes the positions for sample and between timepoints
     * @returns {{sample: Array, between: Array}}
     */
    computeTimepointPositions() {
        let timepointPositions = {"timepoint": [], "connection": []};
        let prevY = 0;
        for (let i = 0; i < this.rootStore.dataStore.timepoints.length; i++) {
            let tpHeight;
            if (this.rootStore.dataStore.timepoints[i].type === "between") {
                tpHeight = this.betweenTPHeight;
            }
            else {
                tpHeight = this.sampleTPHeight;
            }
            timepointPositions.timepoint.push(prevY);
            timepointPositions.connection.push(prevY + tpHeight);
            prevY += this.transitionSpace + tpHeight;
        }
        return timepointPositions;
    }
}

export default VisStore;