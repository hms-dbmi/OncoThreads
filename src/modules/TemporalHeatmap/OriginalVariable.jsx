import ColorScales from './ColorScales';
import {extendObservable} from "mobx";
import * as d3ScaleChromatic from "d3-scale-chromatic";

class OriginalVariable {
    constructor(id, name, datatype, description, range, domain, mapper, profile) {
        this.id = id;
        this.originalIds = [id];
        this.name = name;
        this.profile = profile;
        this.type = "original";
        this.datatype = datatype;
        this.derived = false;
        this.mapper = mapper;
        this.description = description;
        this.range = range;
        this.referenced = 0;
        extendObservable(this,
            this.initializeObservable(domain, range)
        );
    }

    initializeObservable(domain, range) {
        let currDomain = this.getDefaultDomain(domain);
        let currRange = this.getDefaultRange(currDomain, range);
        return {
            domain: currDomain,
            range: currRange,
            get colorScale() {
                let scale;
                if (this.datatype === "ORDINAL" || this.datatype === "STRING" || this.datatype === "BINARY") {
                    scale = ColorScales.getOrdinalScale(this.range, this.domain);
                }
                else if (this.datatype === "NUMBER") {
                    scale = ColorScales.getContinousColorScale(this.range, this.domain);
                }
                else if (this.datatype === "BINNED") {
                    scale = ColorScales.getBinnedColorScale(this.range, this.domain, this.modification.binning.bins);
                }
                return scale;
            }
        };
    }

    getDefaultDomain(domain) {
        let currDomain = domain;
        if (domain.length === 0) {
            if (this.datatype === 'NUMBER') {
                let max = Number.NEGATIVE_INFINITY;
                let min = Number.POSITIVE_INFINITY;
                for (let sample in this.mapper) {
                    if (this.mapper[sample] > max) {
                        max = this.mapper[sample];
                    }
                    if (this.mapper[sample] < min) {
                        min = this.mapper[sample];
                    }
                }
                currDomain = [min, max];
            }
            else {
                currDomain = [];
                for (let sample in this.mapper) {
                    if (!(currDomain.includes(this.mapper[sample]))) {
                        currDomain.push(this.mapper[sample]);
                    }
                }
            }
        }
        return currDomain;
    }

      getDefaultRange(domain, range) {
        let currRange=range;
        if (currRange.length === 0) {
            if (this.datatype === "ORDINAL") {
                let step = 1 / domain.length;
                currRange= domain.map((d, i) => d3ScaleChromatic.interpolateGreys(i * step));
            }
            else if (this.datatype === "STRING") {
                currRange= ['#1f78b4', '#b2df8a', '#fb9a99', '#fdbf6f', '#cab2d6', '#ffff99', '#b15928', '#a6cee3', '#33a02c', '#e31a1c', '#ff7f00', '#6a3d9a']
            }
            else if (this.datatype === "BINARY") {
                currRange= ['#ffd92f', 'lightgray']
            }
            else if (this.datatype === "NUMBER") {
                let min = Math.min(...domain);
                if (min < 0) {
                    currRange= ['#0571b0', '#f7f7f7', '#ca0020'];
                }
                else {
                    currRange= ['#e6e6e6', '#000000'];
                }
            }
        }
        return currRange;
    }
}


export default OriginalVariable;