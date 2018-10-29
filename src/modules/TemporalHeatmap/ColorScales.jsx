import * as d3 from 'd3';

/*
stores information about current visual parameters
 */
class ColorScales {
    static getContinousColorScale(domain) {
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
            return d3.scaleLinear().range(['#0571b0', '#f7f7f7', '#ca0020']).domain([lowerLimit, 0, upperLimit]);
        }
        else {
            return d3.scaleLinear().range(['#e6e6e6', '#000000']).domain([min, max])
        }
    }

    static getBinnedColorScale(binNames, binValues) {
        let colors = [];
        let continuousScale = ColorScales.getContinousColorScale([binValues[0], binValues[binValues.length - 1]]);
        for (let i = 0; i < binNames.length; i++) {
            colors.push(continuousScale((binValues[i + 1] + binValues[i]) / 2));
        }
        return d3.scaleOrdinal().range(colors).domain(binNames).unknown('#f7f7f7');
    }

    static getCategoricalScale(range, domain) {
        console.log(range,domain);
        if (range.length === 0) {
            range = ['#1f78b4', '#b2df8a', '#fb9a99', '#fdbf6f', '#cab2d6', '#ffff99', '#b15928', '#a6cee3', '#33a02c', '#e31a1c', '#ff7f00', '#6a3d9a'];
        }
        return d3.scaleOrdinal().range(['#f7f7f7'].concat(range)).domain([undefined].concat(domain));
    }

    static getBinaryScale(range) {
        if (range.length === 0) {
            range = ['#ffd92f', 'lightgray'];
        }
        return d3.scaleOrdinal().range(['#f7f7f7'].concat(range)).domain([undefined, true, false]);
    }

    static getGlobalTimelineColors() {
        return d3.scaleOrdinal().range(['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#38aab0', '#f0027f', '#bf5b17', '#6a3d9a', '#ff7f00', '#e31a1c']);

    }


}

export default ColorScales;