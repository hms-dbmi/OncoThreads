import {action, extendObservable, reaction} from "mobx";
import * as d3 from 'd3';

/*
stores information about current visual parameters
 */
class VisStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        //height of rects in a row which is primary
        this.primaryHeight = 30;
        this.secondaryHeight = 15;
        this.horizontalGap=1;
        //gap between rows in heatmap
        //space for transitions
        //gap between partitions in grouped timepoints
        this.colorRectHeight = 2;
        this.bandRectHeight = 15;
        this.partitionGap = 10;
        this.svgWidth = 700;
        this.globalTimelineColors = d3.scaleOrdinal().range(['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#38aab0', '#f0027f', '#bf5b17', '#6a3d9a', '#ff7f00', '#e31a1c']);
        extendObservable(this, {
            gap:1,
            transitionSpace: 100,
            timepointY: [],
            plotHeight: 700,
            plotWidth: 700,
            horizontalZoom: 0,
            transY: [],
            /**
             * set plot height to current height
             */
            setPlotHeight: action(height => {
                this.plotHeight = height;
            }),
            /**
             * sets plot width to current width
             */
            setPlotWidth: action(width => {
                this.plotWidth = width;
            }),
            /**
             * fits content to current height
             */
            fitToScreenHeight: action(() => {
                let heightWithoutSpace = 0;
                const _self = this;
                this.rootStore.dataStore.timepoints.forEach(d => {
                    heightWithoutSpace += _self.getTPHeight(d);
                });
                let remainingHeight = this.plotHeight - heightWithoutSpace;
                let transitionSpace = remainingHeight / (this.rootStore.dataStore.timepoints.length - 1);
                if (transitionSpace > 70) {
                    this.transitionSpace = transitionSpace
                }
            }),
            /**
             * fits content to current width
             */
            fitToScreenWidth: action(() => {
                this.horizontalZoom = 300 - (this.rootStore.dataStore.numberOfPatients < 300 ? this.rootStore.dataStore.numberOfPatients : 300);
            }),
            /**
             * sets horizontal zoom level
             */
            setHorizontalZoom: action(zoomLevel => {
                this.horizontalZoom = zoomLevel;

            }),
            /**
             * sets vertical zoom level (i.e. transitionSpace)
             */
            setTransitionSpace: action(transitionSpace => {
                this.transitionSpace = transitionSpace;
            }),
            setGap: action(gapHeight => {
                this.gap = gapHeight;
            }),
            /**
             * height of svg based on zoom level
             * @returns {*}
             */
            get svgHeight() {
                return this.timepointPositions.connection[this.timepointPositions.connection.length - 1] + this.getTPHeight(this.rootStore.dataStore.timepoints[this.rootStore.dataStore.timepoints.length - 1]);
            },
            /**
             * width of rects based on plot width and zoom level
             * @returns {number}
             */
            get sampleRectWidth() {
                return this.plotWidth / (300 - this.horizontalZoom) - this.gap
            },
            /**
             * size of timeline rects based on rect width
             * @returns {number}
             */
            get timelineRectSize() {
                return this.sampleRectWidth * (2 / 3)
            },
            /**
             * width of heatmap
             * @returns {number}
             */
            get heatmapWidth() {
                return this.rootStore.dataStore.numberOfPatients * (this.sampleRectWidth + this.gap) - this.gap;
            },
            /**
             * width of svg based on content
             * @returns {number}
             */
            get svgWidth() {
                return this.heatmapWidth > this.plotWidth ? this.heatmapWidth + this.rootStore.dataStore.maxPartitions * this.partitionGap + this.sampleRectWidth : this.plotWidth;
            },
            /**
             * positions of timepoints based on current transition space
             * @returns {{timepoint: Array, connection: Array}}
             */
            get timepointPositions() {
                let timepointPositions = {"timepoint": [], "connection": []};
                let prevY = 0;
                const _self = this;
                this.rootStore.dataStore.timepoints.forEach(timepoint => {
                    let tpHeight = _self.getTPHeight(timepoint);
                    timepointPositions.timepoint.push(prevY);
                    timepointPositions.connection.push(prevY + tpHeight);
                    prevY += _self.transitionSpace + tpHeight
                });
                return timepointPositions;
            },
            /**
             * gets scales for placement of heatmap rectangles
             * @return {d3.scalePoint[]}
             */
            get heatmapScales() {
                return this.rootStore.dataStore.timepoints.map(d => {
                    return d3.scalePoint()
                        .domain(d.heatmapOrder)
                        .range([0, this.heatmapWidth - this.sampleRectWidth]);
                });
            },
            /**
             * gets scale for partition widths in grouped timepoints
             * @return {d3.scaleLinear}
             */
            get groupScale() {
                return d3.scaleLinear().domain([0, this.rootStore.dataStore.numberOfPatients]).range([0, this.rootStore.visStore.plotWidth - this.rootStore.visStore.partitionGap * (this.rootStore.dataStore.maxPartitions - 1)]);
            },
            /**
             * gets scale for placement of events and samples on time axis in global timeline
             * @return {d3.scaleLinear}
             */
            get timeScale() {
                return d3.scaleLinear().domain([0, this.rootStore.maxTimeInDays]).rangeRound([0, this.svgHeight - this.primaryHeight * 2]);
            }
        });
        this.fitToScreenWidth = this.fitToScreenWidth.bind(this);
        this.fitToScreenHeight = this.fitToScreenHeight.bind(this);
        reaction(() => this.plotHeight,
            () => this.fitToScreenHeight());
    }

    /**
     * gets height of a timepoint
     * @param timepoint
     * @returns {number}
     */
    getTPHeight(timepoint) {
        const _self = this;
        let height = 0;
        let varCount = 0;
        this.rootStore.dataStore.variableStores[timepoint.type].currentVariables.forEach((variableId, i) => {
            if (!timepoint.heatmap[i].isUndef || _self.rootStore.uiStore.showUndefined || variableId === timepoint.primaryVariableId) {
                varCount += 1;
                if (variableId === timepoint.primaryVariableId) {
                    height += _self.primaryHeight;
                }
                else {
                    height += _self.secondaryHeight;
                }
            }
        });
        return height + (varCount - 1) * this.gap;
    }
}

export default VisStore;