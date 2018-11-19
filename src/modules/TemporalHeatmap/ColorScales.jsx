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
        return d3.scaleOrdinal().range(['#f7f7f7'].concat(range.slice())).domain([undefined].concat(domain.slice()));
    }




}

export default ColorScales;