import ColorScales from './ColorScales';
import {extendObservable} from "mobx";

class OriginalVariable {
    constructor(id, name, datatype, description, range, domain, mapper, profile, type) {
        this.id = id;
        this.originalIds = [id];
        this.name = name;
        this.datatype = datatype;
        this.description = description;
        this.range = range;
        this.mapper = mapper;
        this.profile = profile;
        this.type = type;
        this.referenced = 0;
        this.derived = false;
        extendObservable(this,
            this.initializeObservable(domain, range)
        );
    }

    /**
     * initializes observable values
     * @param domain
     * @param range
     * @returns {*}
     */
    initializeObservable(domain, range) {
        let currDomain = this.createDefaultDomain(domain);
        let currRange = this.createDefaultRange(currDomain, range);
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
                return scale;
            }
        };
    }

    /**
     * creates domain (use provided domain if given, otherwise use default domain)
     * @param domain
     * @returns {*}
     */
    createDefaultDomain(domain) {
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
            else if (this.datatype === "BINARY") {
                currDomain = [true, false];
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

    /**
     * creates range (use provided range if given, otherwise use default range)
     * @param domain
     * @param range
     * @returns {*}
     */
    createDefaultRange(domain, range) {
        let currRange = range;
        if (currRange.length === 0) {
            if (this.datatype === "ORDINAL") {
                currRange = ColorScales.getDefaultOrdinalRange(domain.length);
            }
            else if (this.datatype === "STRING") {
                currRange = ColorScales.defaultCategoricalRange;
            }
            else if (this.datatype === "BINARY") {
                currRange = ColorScales.defaultBinaryRange;
            }
            else if (this.datatype === "NUMBER") {
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
}


export default OriginalVariable;