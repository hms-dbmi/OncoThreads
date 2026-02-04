import * as d3 from 'd3';
import { action, makeObservable, observable, computed, reaction } from 'mobx';
import {getScientificNotation, isValidValue} from 'modules/UtilityClasses/UtilityFunctions';


class BinningStore {
    x;
    textFieldTexts;
    binNames;
    isBinary;
    xScale;
    selectedIndex = -1;
    dragging = false;

    constructor(bins, binNames, isBinary, xScale) {
        this.x = bins.filter((d, i) => i !== 0 && i !== bins.length - 1).map(d => xScale(d));
        this.textFieldTexts = bins.filter((d, i) => i !== 0 && i !== bins.length - 1)
            .map(d => getScientificNotation(d));
        this.binNames = binNames;
        this.isBinary = isBinary;
        this.xScale = xScale;

        makeObservable(this, {
            x: observable,
            textFieldTexts: observable,
            binNames: observable,
            isBinary: observable,
            xScale: observable,
            selectedIndex: observable,
            dragging: observable,
            setBinNames: action,
            setDragging: action,
            setSelectedIndex: action,
            setBins: action,
            resetBinNames: action,
            toggleIsBinary: action,
            handleBinRemoval: action,
            handleNumberChange: action,
            handleBinMove: action,
            handleBinAddition: action,
            handleBinNameChange: action,
            handlePositionTextFieldChange: action,
            bins: computed,
            inverseXScale: computed,
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

    /**
     * set bin names
     * @param: {Object[]} newBinNames
     */
    setBinNames = (newBinNames) => {
        this.binNames = newBinNames;
    };

    /**
     * set if mouse is dragged at the moment
     * @param {boolean} isDragging
     */
    setDragging = (isDragging) => {
        this.dragging = isDragging;
    };

    /**
     * set the currently selected bin border
     * @param {number} index - currently selected bin border (slider)
     */
    setSelectedIndex = (index) => {
        this.selectedIndex = index;
    };

    /**
     * set x and textFieldTexts based on input bins
     * @param {number[]} bins
     * @param {d3.scaleLinear} scale
     */
    setBins = (newBins, scale) => {
        this.xScale = scale;
        this.x.replace(newBins.filter((d, i) => i !== 0 && i !== newBins.length - 1)
            .map(d => this.xScale(d)));
        this.textFieldTexts.replace(newBins
            .filter((d, i) => i !== 0 && i !== newBins.length - 1)
            .map(d => getScientificNotation(d)));
    };

    /**
     * reset binNames to bin coordinates
     */
    resetBinNames = () => {
        this.binNames.clear();
        for (let i = 1; i < this.bins.length; i += 1) {
            this.binNames.push({
                name: `${getScientificNotation(this.bins[i - 1])} to ${getScientificNotation(this.bins[i])}`,
                modified: false,
            });
        }
    };

    /**
     * toggle is binary and adapt binNames
     */
    toggleIsBinary = () => {
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
    };

    /**
     * removes a bin
     */
    handleBinRemoval = () => {
        this.x.pop();
        this.textFieldTexts.pop();
    };

    /**
     * handles changes in number of bins
     * @param {number} number - new number of bins
     */
    handleNumberChange = (number) => {
        if (number > this.x.length) {
            this.handleBinAddition();
        } else {
            this.handleBinRemoval();
        }
    };

    /**
     * handles moving a bin border
     * @param {number} xDiff - distance to new position
     */
    handleBinMove = (xDiff) => {
        if (this.x[this.selectedIndex] - xDiff > 0 && this.x[this.selectedIndex]
            - xDiff < this.xScale.range()[1]) {
            this.x[this.selectedIndex] = this.x[this.selectedIndex] - xDiff;
            this.textFieldTexts[this.selectedIndex] = getScientificNotation(this.inverseXScale(this.x[this.selectedIndex]
                    - xDiff));
        }
    };

    /**
     * handles the addition of a bin
     */
    handleBinAddition = () => {
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
    };

    /**
     * handles changing the name of a bin
     * @param {event} e
     * @param {number} index
     */
    handleBinNameChange = (e, index) => {
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
    };

    /**
     * handles changing the content of the textfields at the bin borders
     * @param {string} value - entered in textfield
     * @param {number} index - index of bin border
     */
    handlePositionTextFieldChange = (value, index) => {
        if (isValidValue(value)) {
            this.textFieldTexts[index] = value;
            if (!Number.isNaN(value) && value > this.bins[0]
                && value < this.bins[this.bins.length - 1]) {
                this.x[index] = this.xScale(value);
            }
        }
    };

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
    }

    /**
     * inverses the scale
     * @returns {d3.scaleLinear}
     */
    get inverseXScale() {
        return d3.scaleLinear().domain(this.xScale.range()).range(this.xScale.domain());
    }
}

export default BinningStore;
