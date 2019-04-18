import {action, extendObservable, reaction} from "mobx";
import * as d3 from 'd3';


/**
 * store for editing categories of a categorical/ordinal variable
 */
class CategoryStore {
    constructor(currentCategories, isOrdinal, allValues, colorRange) {
        this.allValues = allValues; // all possible values
        this.domain = Array.from(new Set(Object.values(this.allValues))).filter(d => d !== undefined).sort(); // domain of variable
        extendObservable(this, {
            currentCategories: currentCategories.map((d, i) => { // current categories of variable
                d.percentOccurence = this.getPercentOccurence(d.categories);
                if (isOrdinal) {
                    d.color = d3.interpolateLab(...colorRange)(i / (currentCategories.length - 1));
                }
                else {
                    d.color = colorRange[i % colorRange.length]
                }
                return d
            }),
            isOrdinal: isOrdinal, // is variable ordinal
            colorScale: isOrdinal ? d3.scaleLinear().range(colorRange).domain([0, 1]) : d3.scaleOrdinal().range(colorRange), // color scale of variable
            restrictCategories: false, // restrict variable categories to a certain number
            numberOfCategories: currentCategories.length, // number of categories for restricting categories
            /**
             * toggles restricting categories
             */
            toggleRestrictCategories: action(() => {
                this.restrictCategories = !this.restrictCategories
            }),
            /**
             * sets the number of restricted categories
             * @param {number} numCat
             */
            setNumberOfCategories: action((numCat) => {
                this.numberOfCategories = numCat;
            }),
            /**
             * changes if the variable is ordinal or not
             * @param {boolean} isOrdinal
             */
            setIsOrdinal: action(isOrdinal => {
                this.isOrdinal = isOrdinal;
            }),
            /**
             * handles renaming a category
             * @param {number} index
             * @param {Object} e
             */
            renameCategory: action((index, name) => {
                this.currentCategories[index].name = name;
            }),
            /**
             * toggles selecting a category
             * @param {number} index
             */
            toggleSelect: action((index) => {
                this.currentCategories[index].selected = !this.currentCategories[index].selected;
            }),
            /**
             * changes the color of a category
             * @param {number} index
             * @param {string} color
             */
            changeColor: action((index, color) => {
                this.currentCategories[index].color = color;
            }),
            /**
             * changes the color scale
             * @param {string} colorRange
             */
            changeColorScale: action(colorRange => {
                if (this.isOrdinal) {
                    this.colorScale = d3.scaleLinear().domain([0, 1]).range(colorRange);
                }
                else {
                    this.colorScale = d3.scaleOrdinal().range(colorRange);
                }
            }),
            /**
             * moves a category up or down
             * @param {number} index
             * @param {boolean} moveUp
             */
            move: action((index, moveUp) => {
                let currentEntry = this.currentCategories[index];
                if (moveUp && index > 0) {
                    this.currentCategories[index] = this.currentCategories[index - 1];
                    this.currentCategories[index - 1] = currentEntry;
                }
                else if (!moveUp && index < this.currentCategories.length - 1) {
                    this.currentCategories[index] = this.currentCategories[index + 1];
                    this.currentCategories[index + 1] = currentEntry;
                }
                if (this.isOrdinal) {
                    this.currentCategories.forEach((d, i) => {
                        d.color = this.colorScale[i];
                    });
                }
            }),

            /**
             * merges the selected categories
             */
            merge: action(() => {
                let mergedEntry = {selected: false, name: '', categories: [], color: ''};
                let indicesToDelete = [];
                this.currentCategories.forEach((d, i) => {
                    if (d.selected) {
                        indicesToDelete.push(i);
                        if (mergedEntry.name !== '') {
                            mergedEntry.name += ('/' + d.name)
                        }
                        else {
                            mergedEntry.color = d.color;
                            mergedEntry.name = d.name;
                        }
                        mergedEntry.categories = mergedEntry.categories.concat(...d.categories);
                    }
                });
                mergedEntry.percentOccurence = this.getPercentOccurence(mergedEntry.categories);
                for (let i = indicesToDelete.length - 1; i >= 0; i--) {
                    if (i === 0) {
                        this.currentCategories[indicesToDelete[i]] = mergedEntry;
                    }
                    else {
                        this.currentCategories.splice(indicesToDelete[i], 1);
                    }
                }
            }),

            /**
             * unmerges all the currently selected merged categories
             */
            unMerge: action((all) => {
                let unmergedEntries = [];
                let mergedIndeces = [];
                this.currentCategories.forEach((d, i) => {
                    if ((d.selected || all) && d.categories.length > 1) {
                        let currentEntries = d.categories.map((d) => {
                            return ({
                                selected: false,
                                name: d,
                                categories: [d],
                                color: this.colorScale(d),
                                percentOccurence: this.getPercentOccurence([d])
                            })
                        });
                        mergedIndeces.push(i);
                        unmergedEntries.push(currentEntries);
                    }
                });
                for (let i = mergedIndeces.length - 1; i >= 0; i--) {
                    this.currentCategories.splice(mergedIndeces[i], 1);
                    unmergedEntries[i].forEach((d, j) => this.currentCategories.splice(mergedIndeces[i] + j, 0, d));
                }
                this.currentCategories.forEach((d, i) => {
                    let value = d.name;
                    if (this.isOrdinal) {
                        value = (i * 2 + 1) / (this.currentCategories.length * 2 + 1);
                    }
                    d.color = this.colorScale(value);
                });
            }),
            /**
             * checks if current categories are unique (no names double)
             * @return {boolean}
             */
            get uniqueCategories() {
                return new Set(this.currentCategories.map(d => d.name)).size === this.currentCategories.length
            },
            /**
             * gets a mapping of original categories to new categories
             */
            get categoryMapping() {
                let categoryMapping = {};
                this.domain.forEach(d => {
                    this.currentCategories.forEach(f => {
                        if (f.categories.includes(d.toString())) {
                            categoryMapping[d] = f.name;
                        }
                    });
                });
                return categoryMapping;
            }

        });
        // reaction to restricting categories
        // unmerge all categories and merge categories with small percentages
        reaction(() => this.restrictCategories, restrict => {
            if (restrict && this.numberOfCategories !== this.currentCategories.length) {
                this.unMerge(true);
                let sorted = this.currentCategories.sort((a, b) => b.percentOccurence - a.percentOccurence);
                sorted.slice(this.numberOfCategories - 1, this.currentCategories.length).map(d => d.name).forEach(category => {
                    this.currentCategories.filter(d => d.name === category)[0].selected = true;
                });
                this.merge();

            }
        });
        // reaction to restricting categoires
        // unmerge all categories and merge categories with small percentages
        reaction(() => this.numberOfCategories, numCat => {
            if (this.restrictCategories && numCat !== this.currentCategories.length) {
                this.unMerge(true);
                let sorted = this.currentCategories.sort((a, b) => b.percentOccurence - a.percentOccurence);
                sorted.slice(numCat - 1, this.currentCategories.length).map(d => d.name).forEach(category => {
                    this.currentCategories.filter(d => d.name === category)[0].selected = true;
                });
                this.merge();
            }
        });
        // reaction to changing color scale
        reaction(() => this.colorScale, scale => {
            this.currentCategories.forEach((d, i) => {
                d.color = scale((i * 2 + 1) / (this.currentCategories.length * 2 + 1));
            });
        });

    }

    /**
     * gets percent occurences for each category
     * @param {String[]} categories
     * @returns {number}
     */
    getPercentOccurence(categories) {
        let numOccurences = 0;
        categories.forEach(d => {
            numOccurences += this.allValues.filter(f => d === f).length;
        });
        return numOccurences / this.allValues.length * 100
    }
}

export default CategoryStore;