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

    static getBinnedColorScale(binNames, binValues, domain) {
        let colors = [];
        let continuousScale = ColorScales.getContinousColorScale(domain);
        for (let i = 0; i < binNames.length; i++) {
            colors.push(continuousScale((binValues[i + 1] + binValues[i]) / 2));
        }
        return d3.scaleOrdinal().range(colors).domain(binNames).unknown('white');
    }

    static getCategoricalScale() {
        return d3.scaleOrdinal().range(['#f7f7f7', '#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f']).domain([undefined]);
    }

    static getBinaryScale() {
        return d3.scaleOrdinal().range(['#f7f7f7', '#ffd92f', '#8da0cb']).domain([undefined, true, false]);
    }

}

export default ColorScales;