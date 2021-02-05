import Variable from './Variable';

/**
 * a derived variable is derived of one or multiple other variables
 */
class DerivedVariable extends Variable {
    /**
     * constructs a derived variable
     * @param {string} id
     * @param {string} name
     * @param {string} datatype - ORDINAL, STRING, NUMBER, BINARY
     * @param {string} description
     * @param {string[]} originalIds - ids of variables that were used to derive the variable
     * @param {Object} modification - exact way of how variable has been modified
     * @param {string[]} range
     * @param {(number[]|string[]|boolean[])} domain
     * @param {Object} mapper - mapper mapping sampleIds to values
     * @param {string} profile - profile (group of variables) that this variable belongs to
     * @param {string} type  - gene, clinical, computed, event, derived
     */
    constructor(id, name, datatype, description, originalIds,
        modification, range, domain, mapper, profile, type) {
        super(id, name, datatype, description, originalIds, range, domain, mapper, profile, type);
        this.modification = modification;
        this.derived = true;
    }
}

export default DerivedVariable;
