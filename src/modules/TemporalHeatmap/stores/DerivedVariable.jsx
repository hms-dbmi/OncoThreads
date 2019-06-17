import ColorScales from "../UtilityClasses/ColorScales";
import {action, extendObservable} from "mobx";

/**
 * a derived variable is derived of one or multiple other variables
 */
class DerivedVariable {
    /**
     * constructs a derived variable
     * @param {string} id
     * @param {string} name
     * @param {string} datatype - ORDINAL, STRING, NUMBER, BINARY
     * @param {string} description
     * @param {string[]} originalIds - ids of variables that were used to derive the derived variable
     * @param {Object} modification - exact way of how variable has been modified
     * @param {string[]} range
     * @param {(number[]|string[]|boolean[])} domain
     * @param {Object} mapper - mapper mapping sampleIds to values
     * @param {string} profile - profile (group of variables) that this variable belongs to
     * @param {string} type  - gene, clinical, computed, event, derived
     */
    constructor(id, name, datatype, description, originalIds, modification, range, domain, mapper, profile, type) {
        this.id = id;
        this.name = name;
        this.datatype = datatype;
        this.derived = true;
        this.description = description;
        this.originalIds = originalIds;
        this.modification = modification;
        this.mapper = mapper;
        this.type = type;
        this.profile = profile;
        this.referenced = 0; // number of variables that reference this variable
        extendObservable(this,
            this.initializeObservable(domain, range))

    }

    /**
     * initializes observable values
     * @param {(number[]|string[]|boolean[])} domain
     * @param {string[]} range
     * @returns {Object}
     */
    initializeObservable(domain, range) {
        let currDomain = this.createDomain(domain);
        let currRange = ColorScales.createRange(currDomain, range, this.datatype);
        return {
            domain: currDomain,
            range: currRange,
            changeRange: action(range => {
                this.range = range
            }),
            get colorScale() {
                let scale;
                if (this.datatype === "STRING" || this.datatype === "BINARY") {
                    scale = ColorScales.getCategoricalScale(this.range, this.domain);
                }
                else if (this.datatype === "ORDINAL") {
                    if (this.modification.type === "continuousTransform") {
                        scale = ColorScales.getCategoricalScale(ColorScales.getBinnedRange(this.range, this.modification.binning.bins), this.domain)
                    }
                    else {
                        scale = ColorScales.getOrdinalScale(this.range, this.domain);
                    }
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
     * @param {(number[]|string[]|boolean[])} domain
     * @returns {(number[]|string[]|boolean[])} default domain or provided domain
     */
    createDomain(domain) {
        return domain.concat(...this.getDefaultDomain().filter(d=>!domain.includes(d)));
    }

    /**
     * gets default domain for a variable based on its datatype and its values
     * @return {(number[]|string[]|boolean[])} domain array
     */
    getDefaultDomain() {
        if (this.datatype === 'NUMBER') {
            return [Math.min(...Object.values(this.mapper).filter(d => d !== undefined)), Math.max(...Object.values(this.mapper).filter(d => d !== undefined))];
        }
        else if (this.datatype === "BINARY") {
            return [true, false];
        }
        else {
            return [...new Set(Object.values(this.mapper))].filter(d => d !== undefined);
        }
    }

}

export default DerivedVariable;