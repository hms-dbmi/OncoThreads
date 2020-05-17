import * as d3 from 'd3';
import { action, extendObservable, reaction } from 'mobx';
import {getScientificNotation, isValidValue} from 'modules/TemporalHeatmap/UtilityClasses/UtilityFunctions';


class BinningStore {
    constructor(bins, binNames, isBinary, xScale) {
        extendObservable(this, {
            x: bins.filter((d, i) => i !== 0 && i !== bins.length - 1).map(d => xScale(d)),
            textFieldTexts: bins.filter((d, i) => i !== 0 && i !== bins.length - 1)
                .map(d => getScientificNotation(d)),
            binNames,
            isBinary,
            xScale,
            selectedIndex: -1,
            dragging: false,
            /**
             * set bin names
             * @param: {Object[]} newBinNames
             */
            setBinNames: action((newBinNames) => {
                this.binNames = newBinNames;
            }),
            /**
             * set if mouse is dragged at the moment
             * @param {boolean} isDragging
             */
            setDragging: action((isDragging) => {
                this.dragging = isDragging;
            }),
            /**
             * set the currently selected bin border
             * @param {number} index - currently selected bin border (slider)
             */
            setSelectedIndex: action((index) => {
                this.selectedIndex = index;
            }),
            /**
             * set x and textFieldTexts based on input bins
             * @param {number[]} bins
             * @param {d3.scaleLinear} scale
             */
            setBins: action((newBins, scale) => {
                this.xScale = scale;
                this.x.replace(newBins.filter((d, i) => i !== 0 && i !== newBins.length - 1)
                    .map(d => this.xScale(d)));
                this.textFieldTexts.replace(newBins
                    .filter((d, i) => i !== 0 && i !== newBins.length - 1)
                    .map(d => getScientificNotation(d)));
            }),
            /**
             * reset binNames to bin coordinates
             */
            resetBinNames: action(() => {
                this.binNames.clear();
                for (let i = 1; i < this.bins.length; i += 1) {
                    this.binNames.push({
                        name: `${getScientificNotation(this.bins[i - 1])} to ${getScientificNotation(this.bins[i])}`,
                        modified: false,
                    });
                }
            }),
            /**
             * toggle is binary and adapt binNames
             */
            toggleIsBinary: action(() => {
                if (this.isBinary) {
                    for (let i = 1; i < this.bins.length; i += 1) {
                        this.binNames[i - 1].name = `${getScientificNotation(this.bins[i - 1])} to ${getScientificNotation(this.bins[i])}`;
                        this.binNames[i - 1].modified = false;
                    }
                } else {
                    this.binNames[0] = { name: true, modified: true };
                    this.binNames[1] = { name: false, modified: true };
                }
                this.isBinary = !this.isBinary;
            }),
            /**
             * removes a bin
             */
            handleBinRemoval: action(() => {
                this.x.pop();
                this.textFieldTexts.pop();
                // this.adaptBinNames();
            }),
            /**
             * handles changes in number of bins
             * @param {number} number - new number of bins
             */
            handleNumberChange: action((number) => {
                if (number > this.x.length) {
                    this.handleBinAddition();
                } else {
                    this.handleBinRemoval();
                }
            }),
            /**
             * handles moving a bin border
             * @param {number} xDiff - distance to new position
             */
            handleBinMove: action((xDiff) => {
                if (this.x[this.selectedIndex] - xDiff > 0 && this.x[this.selectedIndex]
                    - xDiff < this.xScale.range()[1]) {
                    this.x[this.selectedIndex] = this.x[this.selectedIndex] - xDiff;
                    this.textFieldTexts[this.selectedIndex] = getScientificNotation(this.inverseXScale(this.x[this.selectedIndex]
                            - xDiff));
                    // this.adaptBinNames();
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
                for (let i = 1; i < xSorted.length; i += 1) {
                    if (i === xSorted.length - 1 && biggestGap
                        < (this.xScale.range()[1] - xSorted[i])) {
                        biggestGap = this.xScale.range()[1] - xSorted[i];
                        newPos = (this.xScale.range()[1] + xSorted[i]) / 2;
                    }
                    if (xSorted[i] - xSorted[i - 1] > biggestGap) {
                        biggestGap = xSorted[i] - xSorted[i - 1];
                        newPos = (xSorted[i] + xSorted[i - 1]) / 2;
                    }
                }
                this.x.push(newPos);
                this.textFieldTexts.push(getScientificNotation(this.inverseXScale(newPos)));
            }),

            /**
             * handles changing the name of a bin
             * @param {event} e
             * @param {number} index
             */
            handleBinNameChange: action((e, index) => {
                if (!this.isBinary) {
                    this.binNames[index] = { name: e.target.value, modified: true };
                } else {
                    this.binNames.replace(this.binNames.map((d, i) => {
                        const copy = d;
                        if (i === index) {
                            copy.name = e.target.value === 'true';
                            copy.modified = true;
                        } else {
                            copy.name = e.target.value !== 'true';
                            copy.modified = true;
                        }
                        return copy;
                    }));
                }
            }),
            /**
             * handles changing the content of the textfields at the bin borders
             * @param {string} value - entered in textfield
             * @param {number} index - index of bin border
             */
            handlePositionTextFieldChange: action((value, index) => {
                if (isValidValue(value)) {
                    this.textFieldTexts[index] = value;
                    if (!Number.isNaN(value) && value > this.bins[0]
                        && value < this.bins[this.bins.length - 1]) {
                        this.x[index] = this.xScale(value);
                    }
                }
            }),
            /**
             * returns current bins by translating pixels into actual values
             * and adding minimum and maximum value at front and end of the array
             * @returns {number[]}
             */
            get bins() {
                const newBins = [];
                newBins.push(this.xScale.domain()[0]);
                this.x.forEach((d) => {
                    newBins.push(this.inverseXScale(d));
                });
                newBins.push(this.xScale.domain()[1]);
                newBins.sort((a, b) => a - b);
                return newBins;
            },
            /**
             * inverses the scale
             * @returns {d3.scaleLinear}
             */
            get inverseXScale() {
                return d3.scaleLinear().domain(this.xScale.range()).range(this.xScale.domain());
            },

        });
        // reaction to change in bins
        reaction(() => this.bins, (newBins) => {
            // if there are not exactly three bin borders
            // the variable cannot be converted into binary
            if (newBins.length !== 3) {
                this.isBinary = false;
            }
            // adapt bin names if number of bins changes
            if (!this.isBinary) {
                if (this.binNames.length === newBins.length - 1) {
                    for (let i = 1; i < newBins.length; i += 1) {
                        if (!this.binNames[i - 1].modified) {
                            this.binNames[i - 1].name = `${getScientificNotation(newBins[i - 1])} to ${getScientificNotation(newBins[i])}`;
                        }
                    }
                } else {
                    this.binNames.clear();
                    for (let i = 1; i < newBins.length; i += 1) {
                        this.binNames.push({
                            name: `${getScientificNotation(newBins[i - 1])} to ${getScientificNotation(newBins[i])}`,
                            modified: false,
                        });
                    }
                }
            }
        });
    }
}

export default BinningStore;
