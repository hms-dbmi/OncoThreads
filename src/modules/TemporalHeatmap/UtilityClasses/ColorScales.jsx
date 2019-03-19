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
        if (min < 0 && max > 0) {
            if (-min > max) {
                max = -min;
            }
            else {
                min = -max;
            }
            return d3.scaleLinear().range(range).domain([min, 0, max]);
        }
        else {
            return d3.scaleLinear().range(range).domain([min, max])
        }
    }

    /**
     * gets a color scale for binning using the old scale as a basis. Each bin receives the average color of its minimum and maximum value
     * @param {string[]} range
     * @param {number[]} domain
     * @param {boolean} isLog
     * @param {number[]} binValues
     * @return {string[]}
     */
    static getBinnedRange(range, domain, isLog, binValues) {
        let oldDomain = domain;
        if (isLog) {
            oldDomain = domain.map(d => Math.log10(d));
        }
        let oldScale = ColorScales.getContinousColorScale(range, oldDomain);
        let binnedRange = [];
        for (let i = 0; i < binValues.length - 1; i++) {
            binnedRange.push(oldScale((binValues[i + 1] + binValues[i]) / 2));
        }
        return binnedRange;
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
ColorScales.categoricalColors = [
    ['#1f78b4', '#b2df8a', '#fb9a99', '#fdbf6f', '#cab2d6', '#ffff99', '#b15928', '#a6cee3', '#33a02c', '#e31a1c', '#ff7f00', '#6a3d9a'],
    ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
    ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec'],
    ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666']
];
ColorScales.ordinalScales = [d3ScaleChromatic.interpolateBlues,
    d3ScaleChromatic.interpolateGreens,
    d3ScaleChromatic.interpolateGreys,
    d3ScaleChromatic.interpolateOranges,
    d3ScaleChromatic.interpolatePurples,
    d3ScaleChromatic.interpolateReds];

export default ColorScales;