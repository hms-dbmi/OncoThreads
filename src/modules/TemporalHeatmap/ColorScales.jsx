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

    static getCategoricalScale() {
        return d3.scaleOrdinal().range(['#f7f7f7', 'lightgray', '#1f78b4', '#b2df8a', '#fb9a99', '#fdbf6f', '#cab2d6', '#ffff99', '#b15928', '#a6cee3', '#33a02c', '#e31a1c', '#ff7f00', '#6a3d9a']).domain([undefined, 'wild type']);
    }

    static getBinaryScale() {
        return d3.scaleOrdinal().range(['#f7f7f7', '#ffd92f', 'lightgray']).domain([undefined, true, false]);
    }

}

export default ColorScales;