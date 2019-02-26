import UtilityFunctions from "../../../../UtilityClasses/UtilityFunctions";
import {action, extendObservable} from "mobx";


class BinningStore {
    constructor(bins, binNames, isBinary) {
        extendObservable(this, {
            bins: bins,
            binNames: binNames,
            isBinary: isBinary,
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

            handleBinChange: action((bins) => {
                if (bins.length !== 3) {
                    this.isBinary = false;
                }
                if (!this.isBinary) {
                    if (bins.length === this.bins.length) {
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
                this.bins.replace(bins);
            }),

            handleBinNameChange(e, index) {
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
            }
        });
    }
}

export default BinningStore;