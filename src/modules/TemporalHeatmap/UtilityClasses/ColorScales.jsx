import * as d3 from 'd3';
import * as d3ScaleChromatic from "d3-scale-chromatic";

/**
 * class for retrieving and storing color scales
 */
class ColorScales {
    /**
     * creates range (use provided range if given, otherwise use default range)
     * @param {(number[]|string[]|boolean[])} domain
     * @param {string[]} range
     * @param {string} datatype
     * @returns {string[]}
     */
    static createRange(domain, range, datatype) {
        let currRange = range;
        if (currRange.length === 0) {
            if (datatype === "ORDINAL") {
                currRange = ColorScales.getDefaultOrdinalRange(domain.length);
            }
            else if (datatype === "STRING") {
                currRange = ColorScales.defaultCategoricalRange;
            }
            else if (datatype === "BINARY") {
                currRange = ColorScales.defaultBinaryRange
            }
            else if (datatype === "NUMBER") {
                let min = Math.min(...domain);
                if (min < 0) {
                    currRange = ColorScales.defaultContinuousThreeColors;
                }
                else {
                    currRange = ColorScales.defaultContinuousTwoColors;
                }
            }
        }
        return currRange;
    }

    /**
     * creates a continuous color scale based on a range and domain
     * @param {string[]} range
     * @param {number[]} domain
     * @returns {d3.scaleLinear}
     */
    static getContinousColorScale(range, domain) {
        let min = Math.min(...domain);
        let max = Math.max(...domain);
        if (min < 0) {
            let lowerLimit, upperLimit;
            if (-min > max) {
                lowerLimit = min;
                upperLimit = -min;
            }
            else {
                lowerLimit = -max;
                upperLimit = max;
            }
            return d3.scaleLinear().range(range).domain([lowerLimit, 0, upperLimit]);
        }
        else {
            return d3.scaleLinear().range(range).domain([min, max])
        }
    }

    /**
     * gets a color scale for binning using the old scale as a basis. Each bin receives the average color of its minimum and maximum value
     * @param {function} oldScale
     * @param {number[]} binValues
     * @return {string[]}
     */
    static getBinnedRange(oldScale, binValues) {
        let range = [];
        for (let i = 0; i < binValues.length - 1; i++) {
            range.push(oldScale((binValues[i + 1] + binValues[i]) / 2));
        }
        return range;
    }

    /**
     * creates an isOrdinal color scale based on a range and domain
     * @param {string[]} range
     * @param {(string[]|boolean[])} domain
     * @returns {function}
     */
    static getOrdinalScale(range, domain) {
        return function (value) {
            const colorScale = d3.scaleOrdinal().range(range.slice()).domain(domain.slice());
            if (value === undefined) {
                return '#f7f7f7';
            } else if (value === "wild type") {
                return 'lightgray'
            }
            else return colorScale(value);
        };
    }

    /**
     * gets default range for isOrdinal variable
     * @param {number} domainLength
     * @returns {string[]}
     */
    static getDefaultOrdinalRange(domainLength) {
        let step = 1 / domainLength;
        let range = [];
        for (let i = 0; i < domainLength; i++) {
            range.push(d3ScaleChromatic.interpolateGreys(i * step));
        }
        return range
    }
}

// default color ranges
ColorScales.defaultBinaryRange = ['#ffd92f', 'lightgray'];
ColorScales.defaultCategoricalRange = ['#1f78b4', '#b2df8a', '#fb9a99', '#fdbf6f', '#cab2d6', '#ffff99', '#b15928', '#a6cee3', '#33a02c', '#e31a1c', '#ff7f00', '#6a3d9a'];
ColorScales.defaultContinuousTwoColors = ['#e6e6e6', '#000000'];
ColorScales.defaultContinuousThreeColors = ['#0571b0', '#f7f7f7', '#ca0020'];

// other color ranges that can be chosen
ColorScales.continuousThreeColorRanges = [
    ['#0571b0', '#f7f7f7', '#ca0020'],
    ['#08ff00', '#000000', '#ff0000']
];
ColorScales.continuousTwoColorRanges = [
    ['rgb(214, 230, 244)', 'rgb(8, 48, 107)'],
    ['rgb(218, 241, 213)', 'rgb(0, 68, 27)'],
    ['rgb(232, 232, 232)', 'rgb(0, 0, 0)'],
    ['rgb(254, 222, 191)', 'rgb(127, 39, 4)'],
    ['rgb(232, 230, 242)', 'rgb(63, 0, 125)'],
    ['rgb(253, 211, 193)', 'rgb(103, 0, 13)'],
];

export default ColorScales;