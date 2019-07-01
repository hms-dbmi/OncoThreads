import ColorScales from '../UtilityClasses/ColorScales';
import { action, extendObservable } from "mobx";

/**
 * original variable that is based on the input data
 */
class OriginalVariable {
    /**
     *
     * @param {string} id
     * @param {string} name
     * @param {string} datatype
     * @param {string} description
     * @param {string[]} range - color range
     * @param {(string[]|boolean[]|number[])} domain
     * @param {Object} mapper - mapper mapping sampleIds to values
     * @param {string} profile - profile (group of variables) that this variable belongs to
     * @param {string} type - gene, clinical, computed, event
     */
    constructor(id, name, datatype, description, range, domain, mapper, profile, type) {
        this.id = id;
        this.originalIds = [id];
        this.datatype = datatype;
        this.description = description;
        this.range = range;
        this.mapper = mapper;
        this.profile = profile;
        this.type = type;
        this.referenced = 0;
        this.derived = false;
        extendObservable(this,
            this.initializeObservable(name, domain, range)
        );
    }

    /**
     * initializes observable values
     * @param {string} name
     * @param {(number[]|string[]|boolean[])} domain
     * @param {string[]} range
     * @returns {Object} observable values
     */
    initializeObservable(name, domain, range) {
        let currDomain = this.createDomain(domain);
        let currRange = ColorScales.createRange(currDomain, range, this.datatype);
        return {
            domain: currDomain,
            range: currRange,
            name: name,
            changeRange: action(range => {
                this.range = range
            }),
            changeDomain: action(domain => {
                this.range = domain
            }),
            changeName: action(name => {
                this.name = name;
            }),
            get colorScale() {
                let scale;
                if (this.datatype === "STRING" || this.datatype === "BINARY") {
                    scale = ColorScales.getCategoricalScale(this.range, this.domain);
                }
                else if (this.datatype === "ORDINAL") {
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
     * @param {(number[]|string[]|boolean[])} domain
     * @returns {(number[]|string[]|boolean[])} default domain or provided domain
     */
    createDomain(domain) {
        return domain.concat(...this.getDefaultDomain().filter(d => !domain.includes(d)));
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
            return [...new Set(Object.values(this.mapper))].filter(d => d !== undefined).sort();
        }
    }
}


export default OriginalVariable;