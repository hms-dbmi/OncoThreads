import * as d3 from 'd3';

/*
stores information about current visual parameters
 */
class ColorScales {
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
    static getBinnedRange(oldScale, binNames, binValues){
        let range=[];
         for (let i = 0; i < binNames.length; i++) {
            range.push(oldScale((binValues[i + 1] + binValues[i]) / 2));
        }
        return range;
    }


    static getOrdinalScale(range, domain) {
        return function (value) {
            const colorScale = d3.scaleOrdinal().range(range.slice()).domain(domain.slice());
            if (value === undefined) {
                return '#f7f7f7';
            }else if(value==="wild type"){
                return  'lightgray'
            }
            else return colorScale(value);
        };
    }




}
ColorScales.defaultBinaryRange=['#ffd92f', 'lightgray'];
ColorScales.defaultCategoricalRange=['#1f78b4', '#b2df8a', '#fb9a99', '#fdbf6f', '#cab2d6', '#ffff99', '#b15928', '#a6cee3', '#33a02c', '#e31a1c', '#ff7f00', '#6a3d9a'];

export default ColorScales;