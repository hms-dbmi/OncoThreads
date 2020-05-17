import * as d3 from 'd3';
import * as d3ScaleChromatic from 'd3-scale-chromatic';

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
        if (range.length < domain.length) {
            if (range.length === 0) {
                if (datatype === 'ORDINAL') {
                    currRange = ColorScales.defaultContinuousTwoColors;
                } else if (datatype === 'BINARY') {
                    currRange = ColorScales.defaultBinaryRange;
                } else if (datatype === 'NUMBER') {
                    const min = Math.min(...domain);
                    if (min < 0) {
                        currRange = ColorScales.defaultContinuousThreeColors;
                    } else {
                        currRange = ColorScales.defaultContinuousTwoColors;
                    }
                }
            }
            if (datatype === 'STRING') {
                currRange = range.concat(...ColorScales.defaultCategoricalRange
                    .filter(d => !range.includes(d)));
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
            } else {
                min = -max;
            }
            return d3.scaleLinear().range(range).domain([min, 0, max]);
        }

        return d3.scaleLinear().range(range).domain([min, max]);
    }

    /**
     * gets a color scale for binning using the old scale as a basis.
     * Each bin receives the average color of its minimum and maximum value
     * @param {string[]} range
     * @param {number[]} binValues
     * @return {string[]}
     */
    static getBinnedRange(range, binValues) {
        const oldScale = ColorScales.getContinousColorScale(range,
            [binValues[0], binValues[binValues.length - 1]]);
        const binnedRange = [];
        for (let i = 0; i < binValues.length - 1; i += 1) {
            binnedRange.push(oldScale((binValues[i + 1] + binValues[i]) / 2));
        }
        return binnedRange;
    }

    /**
     * creates a categorical color scale based on a range and domain
     * @param {string[]} range
     * @param {(string[]|boolean[])} domain
     * @returns {function}
     */
    static getCategoricalScale(range, domain) {
        return (value) => {
            const colorScale = d3.scaleOrdinal().range(range.slice()).domain(domain.slice());
            if (value === undefined) {
                return '#f7f7f7';
            }
            return colorScale(value);
        };
    }

    /**
     * creates a color scale for an ordinal variable
     * @param range
     * @param domain
     * @return {Function}
     */
    static getOrdinalScale(range, domain) {
        return (value) => {
            const helper = d3.scaleLinear().range(range.slice())
                .domain(range.map((d, i) => i / (range.length - 1)));
            const interpolatedRange = domain.map((d, i) => helper(i / (domain.length - 1)));
            const colorScale = d3.scaleOrdinal().range(interpolatedRange).domain(domain.slice());
            if (value === undefined) {
                return '#f7f7f7';
            }
            return colorScale(value);
        };
    }

    /**
     * gets the ideal color of the text depending on the background color
     * @param {string} rgbString
     * @returns {string}
     */
    static getHighContrastColor(rgbString) {
        const rgb = rgbString.replace(/[^\d,]/g, '').split(',');
        const brightness = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
        if (brightness < 255 / 2) {
            return 'white';
        }

        return 'black';
    }
}

// band color
ColorScales.bandColor = '#e5e5e5';
ColorScales.bandOutline = '#b4b4b4';

// default color ranges
ColorScales.defaultBinaryRange = ['#ffd92f', '#bbbbbb'];
ColorScales.defaultCategoricalRange = ['#1f78b4', '#b2df8a', '#fb9a99', '#fdbf6f', '#cab2d6', '#ffff99', '#b15928', '#a6cee3', '#33a02c', '#e31a1c', '#ff7f00', '#6a3d9a'];
ColorScales.defaultContinuousTwoColors = ['#e6e6e6', '#000000'];
ColorScales.defaultContinuousThreeColors = ['#0571b0', '#f7f7f7', '#ca0020'];

// other color ranges that can be chosen
ColorScales.continuousThreeColorRanges = [
    ['#0571b0', '#f7f7f7', '#ca0020'],
    ['#08ff00', '#000000', '#ff0000'],
];
ColorScales.continuousTwoColorRanges = [
    ['rgb(232, 232, 232)', 'rgb(0, 0, 0)'],
    ['rgb(218, 241, 213)', 'rgb(0, 68, 27)'],
    ['rgb(254, 222, 191)', 'rgb(127, 39, 4)'],
    ['rgb(232, 230, 242)', 'rgb(63, 0, 125)'],
    ['rgb(253, 211, 193)', 'rgb(103, 0, 13)'],
    [d3ScaleChromatic.interpolateBlues(0.1), d3ScaleChromatic.interpolateBlues(1)],

];
ColorScales.categoricalColors = [
    ['#1f78b4', '#b2df8a', '#fb9a99', '#fdbf6f', '#cab2d6', '#ffff99', '#b15928', '#a6cee3', '#33a02c', '#e31a1c', '#ff7f00', '#6a3d9a'],
    ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
    ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec'],
    ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'],
];

export default ColorScales;


let colorDict = {}
export const getColorByName = (name)=>{
    if (name in colorDict){
        return colorDict[name]
    }else{
        let colors =  ['#b15928', '#999', '#1f78b4', '#b2df8a', '#fb9a99',  '#cab2d6', '#33a02c','#fdbf6f',  '#e31a1c', '#ff7f00', '#6a3d9a']
        let color = colors[Object.keys(colorDict).length % colors.length]
        colorDict[name]=color
        return color
    }
}
