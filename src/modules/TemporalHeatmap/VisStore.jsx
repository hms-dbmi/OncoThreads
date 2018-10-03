import {extendObservable} from "mobx";
import * as d3 from 'd3';

/*
stores information about current visual parameters
 */
class VisStore {
    constructor(rootStore) {
        //width of rects in sampleTimepoints
        this.rootStore = rootStore;
        this.sampleRectWidth = 0;
        //height of rects in a row which is primary
        this.primaryHeight = 30;
        this.secondaryHeight = 15;
        //gap between rows in heatmap
        this.gap = 1;
        //space for transitions
        //gap between partitions in grouped timepoints
        this.partitionGap = 10;
        this.globalTimelineColors = d3.scaleOrdinal().range(['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#38aab0', '#f0027f', '#bf5b17', '#6a3d9a', '#ff7f00', '#e31a1c']);
        extendObservable(this, {
            transitionSpace: 100,
            timepointY: [],
            transY: [],
            svgWidth: 0,
            get betweenTPHeight() {
                return this.getTimepointHeight(this.rootStore.timepointStore.currentVariables.between.length);
            },
            get sampleTPHeight() {
                return this.getTimepointHeight(this.rootStore.timepointStore.currentVariables.sample.length);
            },
            get timepointPositions() {
                let timepointPositions = {"timepoint": [], "connection": []};
                let prevY = 0;
                for (let i = 0; i < this.rootStore.timepointStore.timepoints.length; i++) {
                    let tpHeight;
                    if (this.rootStore.timepointStore.timepoints[i].type === "between") {
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
            },
            get svgHeight() {
                if (this.betweenTPHeight !== 0) {
                    return this.timepointPositions.connection[this.timepointPositions.connection.length - 1] + this.betweenTPHeight;
                }
                else {
                    return this.timepointPositions.connection[this.timepointPositions.connection.length - 1] + this.sampleTPHeight;

                }
            }
        })
    }

    setTransitionSpace(transitionSpace) {
        this.transitionSpace = transitionSpace;
    }

    setSampleRectWidth(width) {
        this.sampleRectWidth = width;
    }

    modifyTransitionSpace(number, index) {
        if (index !== this.transitionSpaces.length - 2) {
            console.log(index, this.rootStore.timepointStore.isAligned(index, index + 1), this.rootStore.timepointStore.isAligned(index + 1, index + 2));
            if (this.rootStore.timepointStore.isAligned(index, index + 1)
                && this.rootStore.timepointStore.isAligned(index + 1, index + 2)
                && !this.rootStore.timepointStore.timepoints[index].isGrouped
                && !this.rootStore.timepointStore.timepoints[index + 1].isGrouped
                && !this.rootStore.timepointStore.timepoints[index + 2].isGrouped) {
                this.transitionSpaces[index] = this.transitionSpace;
                this.transitionSpaces[index + 1] = this.transitionSpace;
            }
            else {
                this.transitionSpaces[index] = number;
                this.transitionSpaces[index + 1] = number;
            }
        }
        else {
            if (this.rootStore.timepointStore.isAligned(index, index + 1)) {
                this.transitionSpaces[index] = this.transitionSpace;
            }
            else {
                this.transitionSpaces[index] = number;
            }
        }
    }

    resetTransitionSpace() {
        this.transitionSpaces = [];
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

    /**
     * computes the positions for sample and between timepoints
     * @returns {{sample: Array, between: Array}}
     */
    computeTimepointPositions() {
        let timepointPositions = {"timepoint": [], "connection": []};
        let prevY = 0;
        for (let i = 0; i < this.rootStore.timepointStore.timepoints.length; i++) {
            let tpHeight;
            if (this.rootStore.timepointStore.timepoints[i].type === "between") {
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