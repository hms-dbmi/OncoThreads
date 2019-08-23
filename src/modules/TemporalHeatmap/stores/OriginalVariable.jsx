import Variable from './Variable';

/**
 * original variable that is based on the input data
 */
class OriginalVariable extends Variable {
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
        super(id, name, datatype, description, [id], range, domain, mapper, profile, type);
        this.derived = false;
    }
}


export default OriginalVariable;
