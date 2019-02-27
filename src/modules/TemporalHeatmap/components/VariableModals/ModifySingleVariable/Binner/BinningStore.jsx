import UtilityFunctions from "../../../../UtilityClasses/UtilityFunctions";
import * as d3 from 'd3';
import {action, extendObservable, reaction} from "mobx";


class BinningStore {
    constructor(bins, binNames, isBinary, xScale) {
        extendObservable(this, {
            x: bins.filter((d, i) => i !== 0 && i !== bins.length - 1).map(d => xScale(d)),
            textFieldTexts: bins.filter((d, i) => i !== 0 && i !== bins.length - 1).map(d => UtilityFunctions.getScientificNotation(d)),
            binNames: binNames,
            isBinary: isBinary,
            xScale: xScale,
            selectedIndex: -1,
            dragging: false,
            /**
             * set bin names
             */
            setBinNames: action((binNames) => {
                this.binNames = binNames
            }),
            /**
             * set if mouse is dragged at the moment
             */
            setDragging: action(boolean => {
                this.dragging = boolean
            }),
            /**
             * set the currently selected bin border
             */
            setSelectedIndex: action(index => {
                this.selectedIndex = index
            }),
            /**
             * set x and textFieldTexts based on input bins
             */
            setBins: action((bins, scale) => {
                this.xScale = scale;
                this.x.replace(bins.filter((d, i) => i !== 0 && i !== bins.length - 1).map(d => this.xScale(d)));
                this.textFieldTexts.replace(bins.filter((d, i) => i !== 0 && i !== bins.length - 1).map(d => UtilityFunctions.getScientificNotation(d)));
            }),
            /**
             * reset binNames to bin coordinates
             */
            resetBinNames: action(() => {
                this.binNames.clear();
                for (let i = 1; i < this.bins.length; i++) {
                    this.binNames.push({
                        name: UtilityFunctions.getScientificNotation(this.bins[i - 1]) + " to " + UtilityFunctions.getScientificNotation(this.bins[i]),
                        modified: false
                    });
                }
            }),
            /**
             * toggle is binary and adapt binNames
             */
            toggleIsBinary: action(() => {
                if (this.isBinary) {
                    for (let i = 1; i < this.bins.length; i++) {
                        this.binNames[i - 1].name = UtilityFunctions.getScientificNotation(this.bins[i - 1]) + " to " + UtilityFunctions.getScientificNotation(this.bins[i]);
                        this.binNames[i - 1].modified = false;
                    }
                }
                else {
                    this.binNames[0] = {name: true, modified: true};
                    this.binNames[1] = {name: false, modified: true};

                }
                this.isBinary = !this.isBinary;
            }),
            /**
             * removes a bin
             */
            handleBinRemoval: action(() => {
                this.x.pop();
                this.textFieldTexts.pop();
                //this.adaptBinNames();
            }),
            /**
             * handles changes in number of bins
             */
            handleNumberChange: action((number) => {
                if (number > this.x.length) {
                    this.handleBinAddition();
                }
                else {
                    this.handleBinRemoval();
                }
            }),
            /**
             * handles moving a bin
             */
            handleBinMove: action((xDiff) => {
                if (this.x[this.selectedIndex] - xDiff > 0 && this.x[this.selectedIndex] - xDiff < this.xScale.range()[1]) {
                    this.x[this.selectedIndex] = this.x[this.selectedIndex] - xDiff;
                    this.textFieldTexts[this.selectedIndex] = UtilityFunctions.getScientificNotation(this.inverseXScale(this.x[this.selectedIndex] - xDiff));
                    //this.adaptBinNames();
                }
            }),
            /**
             * handles the addition of a bin
             */
            handleBinAddition: action(() => {
                let xSorted = this.x.slice();
                xSorted = xSorted.sort((a, b) => a - b);
                let biggestGap = xSorted[0];
                let newPos = biggestGap / 2;
                if (xSorted.length === 1) {
                    if (biggestGap < this.xScale.range()[1] - xSorted[0]) {
                        biggestGap = this.xScale.range()[1] - xSorted[0];
                        newPos = (this.xScale.range()[1] + xSorted[0]) / 2;
                    }
                }
                for (let i = 1; i < xSorted.length; i++) {
                    if (i === xSorted.length - 1 && biggestGap < (this.xScale.range()[1] - xSorted[i])) {
                        biggestGap = this.xScale.range()[1] - xSorted[i];
                        newPos = (this.xScale.range()[1] + xSorted[i]) / 2;
                    }
                    if (xSorted[i] - xSorted[i - 1] > biggestGap) {
                        biggestGap = xSorted[i] - xSorted[i - 1];
                        newPos = (xSorted[i] + xSorted[i - 1]) / 2;
                    }
                }
                this.x.push(newPos);
                this.textFieldTexts.push(UtilityFunctions.getScientificNotation(this.inverseXScale(newPos)));
                //this.adaptBinNames();
            }),

            /**
             * handles changing the name of a bin
             */
            handleBinNameChange: action((e, index) => {
                if (!this.isBinary) {
                    this.binNames[index] = {name: e.target.value, modified: true};
                }
                else {
                    this.binNames.forEach((d, i) => {
                        if (i === index) {
                            d.name = e.target.value === "true";
                            d.modified = true;
                        }
                        else {
                            d.name = e.target.value !== "true";
                            d.modified = true;
                        }
                    })
                }
            }),
            /**
             * handles changing the content of the textfields at the bin borders
             */
            handlePositionTextFieldChange: action((value, index) => {
                if (UtilityFunctions.isValidValue(value)) {
                    this.textFieldTexts[index] = value;
                    if (!isNaN(value) && value > this.bins[0] && value < this.bins[this.bins.length - 1]) {
                        this.x[index] = this.xScale(value);
                        //this.adaptBinNames();
                    }
                }
            }),
            /**
             * returns current bins
             * @returns {Array}
             */
            get bins() {
                let bins = [];
                bins.push(this.xScale.domain()[0]);
                this.x.forEach(d => {
                    bins.push(this.inverseXScale(d));
                });
                bins.push(this.xScale.domain()[1]);
                bins.sort((a, b) => a - b);
                return bins
            },
            /**
             * inverses the scale
             * @returns {*}
             */
            get inverseXScale() {
                return d3.scaleLinear().domain(this.xScale.range()).range(this.xScale.domain());
            },

        });
        reaction(() => this.bins, bins => {
            if (bins.length !== 3) {
                this.isBinary = false;
            }
            if (!this.isBinary) {
                if (this.binNames.length === bins.length-1) {
                    for (let i = 1; i < bins.length; i++) {
                        if (!this.binNames[i - 1].modified) {
                            this.binNames[i - 1].name = UtilityFunctions.getScientificNotation(bins[i - 1]) + " to " + UtilityFunctions.getScientificNotation(bins[i]);
                        }
                    }
                }
                else {
                    this.binNames.clear();
                    for (let i = 1; i < bins.length; i++) {
                        this.binNames.push({
                            name: UtilityFunctions.getScientificNotation(bins[i - 1]) + " to " + UtilityFunctions.getScientificNotation(bins[i]),
                            modified: false
                        });
                    }
                }
            }
        });
    }
}

export default BinningStore;