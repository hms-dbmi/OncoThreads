import { action, extendObservable, reaction } from 'mobx';
import * as d3 from 'd3';


/**
 * store for editing categories of a categorical/ordinal variable
 */
class CategoryStore {
    constructor(currentCategories, isOrdinal, allValues, colorRange) {
        this.allValues = allValues; // all possible values
        this.domain = Array.from(new Set(Object.values(this.allValues)))
            .filter(d => d !== undefined).sort(); // domain of variable
        extendObservable(this, {
            currentCategories: currentCategories.map((d, i) => { // current categories of variable
                const copy = d;
                copy.percentOccurence = this.getPercentOccurence(d.categories);
                if (isOrdinal) {
                    copy.color = d3.interpolateLab(...colorRange)(i
                        / (currentCategories.length - 1));
                } else {
                    copy.color = colorRange[i % colorRange.length];
                }
                return copy;
            }),
            isOrdinal, // is variable ordinal
            colorScale: isOrdinal ? d3.scaleLinear().range(colorRange).domain([0, 1])
                : d3.scaleOrdinal().range(colorRange), // color scale of variable

            /**
             * changes if the variable is ordinal or not
             * @param {boolean} newIsOrdinal
             */
            setIsOrdinal: action((newIsOrdinal) => {
                this.isOrdinal = newIsOrdinal;
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
             * @param {string} newColorRange
             */
            changeColorScale: action((newColorRange) => {
                if (this.isOrdinal) {
                    this.colorScale = d3.scaleLinear().domain([0, 1]).range(newColorRange);
                } else {
                    this.colorScale = d3.scaleOrdinal().range(newColorRange)
                        .domain(this.currentCategories.map(d => d.name));
                }
            }),
            /**
             * moves a category up or down
             * @param {number} index
             * @param {boolean} moveUp
             */
            move: action((index, moveUp) => {
                const currentEntry = this.currentCategories[index];
                if (moveUp && index > 0) {
                    this.currentCategories[index] = this.currentCategories[index - 1];
                    this.currentCategories[index - 1] = currentEntry;
                } else if (!moveUp && index < this.currentCategories.length - 1) {
                    this.currentCategories[index] = this.currentCategories[index + 1];
                    this.currentCategories[index + 1] = currentEntry;
                }
            }),

            /**
             * merges the selected categories
             */
            merge: action(() => {
                const mergedEntry = {
                    selected: false, name: '', categories: [], color: '',
                };
                const indicesToDelete = [];
                this.currentCategories.forEach((d, i) => {
                    if (d.selected) {
                        indicesToDelete.push(i);
                        if (mergedEntry.name !== '') {
                            mergedEntry.name += (`/${d.name}`);
                        } else {
                            mergedEntry.color = d.color;
                            mergedEntry.name = d.name;
                        }
                        mergedEntry.categories = mergedEntry.categories.concat(...d.categories);
                    }
                });
                mergedEntry.percentOccurence = this.getPercentOccurence(mergedEntry.categories);
                for (let i = indicesToDelete.length - 1; i >= 0; i -= 1) {
                    if (i === 0) {
                        this.currentCategories[indicesToDelete[i]] = mergedEntry;
                    } else {
                        this.currentCategories.splice(indicesToDelete[i], 1);
                    }
                }
            }),
            /**
             * unmerges at an index
             */
            unMergeIndex: action((index) => {
                const categories = this.currentCategories[index].categories.slice();
                this.currentCategories.splice(index, 1);
                categories.forEach((d, j) => this.currentCategories.splice(index + j, 0, {
                    selected: false,
                    name: d,
                    categories: [d],
                    color: this.colorScale(d),
                    percentOccurence: this.getPercentOccurence([d]),
                }));
            }),
            /**
             * sorts categories by name
             * @param {boolean} asc - sort ascending/descending
             */
            sortByName: action((asc) => {
                let factor = 1;
                if (asc) {
                    factor = -1;
                }
                this.currentCategories.replace(this.currentCategories.sort((a, b) => {
                    if (a.name < b.name) {
                        return -factor;
                    }
                    if (a.name > b.name) {
                        return factor;
                    }
                    return 0;
                }));
            }),
            /**
             * sorts categories by their percent occurence
             * @param {boolean} asc - sort ascending/descending
             */
            sortByPercentage: action((asc) => {
                let factor = 1;
                if (asc) {
                    factor = -1;
                }
                this.currentCategories.replace(this.currentCategories.slice().sort((a, b) => {
                    if (a.percentOccurence < b.percentOccurence) {
                        return -factor;
                    }
                    if (a.percentOccurence > b.percentOccurence) {
                        return factor;
                    }
                    return 0;
                }));
            }),
            /**
             * checks if current categories are unique (no names double)
             * @return {boolean}
             */
            get uniqueCategories() {
                return new Set(this.currentCategories
                    .map(d => d.name)).size === this.currentCategories.length;
            },
            /**
             * gets a mapping of original categories to new categories
             */
            get categoryMapping() {
                const categoryMapping = {};
                this.domain.forEach((d) => {
                    this.currentCategories.forEach((f) => {
                        if (f.categories.includes(d.toString())) {
                            categoryMapping[d] = f.name;
                        }
                    });
                });
                return categoryMapping;
            },
            get range() {
                if (this.isOrdinal) {
                    return this.colorScale.range();
                }

                return this.currentCategories.map(d => d.color);
            },

        });
        // reaction to changing color scale
        reaction(() => this.colorScale, (scale) => {
            this.currentCategories.forEach((d, i) => {
                let value = d.name;
                if (this.isOrdinal) {
                    value = (i * 2 + 1) / (this.currentCategories.length * 2 + 1);
                }
                this.currentCategories[i].color = scale(value);
            });
        });
        reaction(() => this.currentCategories.map(d => d.name), (categories) => {
            if (this.isOrdinal) {
                categories.forEach((d, i) => {
                    let value = d;
                    if (this.isOrdinal) {
                        value = (i * 2 + 1) / (categories.length * 2 + 1);
                    }
                    this.currentCategories[i].color = this.colorScale(value);
                });
            }
        });
    }

    /**
     * gets percent occurences for each category
     * @param {String[]} categories
     * @returns {number}
     */
    getPercentOccurence(categories) {
        let numOccurences = 0;
        categories.forEach((d) => {
            numOccurences += this.allValues.filter(f => d === f).length;
        });
        return numOccurences / this.allValues.length * 100;
    }
}

export default CategoryStore;
