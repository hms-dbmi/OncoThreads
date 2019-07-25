import { action, extendObservable } from 'mobx';
import ColorScales from '../UtilityClasses/ColorScales';

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
            this.initializeObservable(name, domain, range));
    }

    /**
     * initializes observable values
     * @param {string} name
     * @param {(number[]|string[]|boolean[])} domain
     * @param {string[]} range
     * @returns {Object} observable values
     */
    initializeObservable(name, domain, range) {
        const currDomain = this.createDomain(domain);
        const currRange = ColorScales.createRange(currDomain, range, this.datatype);
        return {
            domain: currDomain,
            range: currRange,
            name,
            changeRange: action((newRange) => {
                this.range = newRange;
            }),
            changeDomain: action((newDomain) => {
                this.domain = newDomain;
            }),
            changeName: action((newName) => {
                this.name = newName;
            }),
            get colorScale() {
                let scale;
                if (this.datatype === 'STRING' || this.datatype === 'BINARY') {
                    scale = ColorScales.getCategoricalScale(this.range, this.domain);
                } else if (this.datatype === 'ORDINAL') {
                    scale = ColorScales.getOrdinalScale(this.range, this.domain);
                } else if (this.datatype === 'NUMBER') {
                    scale = ColorScales.getContinousColorScale(this.range, this.domain);
                }
                return scale;
            },
        };
    }

    /**
     * creates domain (use provided domain if given, otherwise use default domain)
     * @param {(number[]|string[]|boolean[])} domain
     * @returns {(number[]|string[]|boolean[])} default domain or provided domain
     */
    createDomain(domain) {
        if (this.datatype === 'NUMBER' && domain.length < 2) {
            return [Math.min(...Object.values(this.mapper).filter(d => d !== undefined)),
                Math.max(...Object.values(this.mapper).filter(d => d !== undefined))];
        }
        if (this.datatype === 'BINARY' && domain.length === 0) {
            return [true, false];
        }
        if (this.datatype === 'STRING' || this.datatype === 'ORDINAL') {
            return [...new Set(domain.concat(...Object.values(this.mapper)))]
                .filter(d => d !== undefined).sort();
        }
        return domain;
    }
}


export default OriginalVariable;
