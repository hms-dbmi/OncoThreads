/**
 * class that gets data from LocalFileLoader. Imitates cBioAPI
 */
class FileAPI {
    constructor(localFileLoader) {
        this.localFileLoader = localFileLoader;
    }

    /**
     * get all patients in a study
     * @param {returnDataCallback} callback
     */
    getPatients(callback) {
        callback(this.localFileLoader.patients);
    }

    /**
     * get all events for all patients in a study
     * @param {string[]} patients
     * @param {returnDataCallback} callback
     */
    getEvents(patients, callback) {
        this.localFileLoader.loadEvents(callback);
    }

    /**
     * get clinical patient data for each patient in a study
     * @param {returnDataCallback} callback
     */
    getClinicalPatientData(callback) {
        this.localFileLoader.loadClinicalFile(false, callback);
    }

    /**
     * get all available molecular profiles for a study
     * @param {returnDataCallback} callback
     */
    getAvailableMolecularProfiles(callback) {
        callback(this.localFileLoader.molecularProfiles);
    }

    /**
     * get all available clinical sample data in a study
     * @param {returnDataCallback} callback
     */
    getClinicalSampleData(callback) {
        this.localFileLoader.loadClinicalFile(true,callback);
    }

    /**
     * get mutation counts in a study
     * @param {string} profileId
     * @param {returnDataCallback} callback
     */
    getMutationCounts(profileId, callback) {
        callback(this.localFileLoader.mutationCounts);
    }

    /**
     * Gets mutations for entrezIds
     * @param {Object[]} entrezIDs
     * @param {string} profileId
     * @param {returnDataCallback} callback
     */
    getMutations(entrezIDs, profileId, callback) {
        callback(this.localFileLoader.mutations.filter(d => entrezIDs.map(e => e.hgncSymbol).includes(d.gene.hugoGeneSymbol)));
    }

    /**
     * checks for each sample if entrezIDs have been profiled
     * @param {Object[]} entrezIDs
     * @param {string} profileId
     * @param {returnDataCallback} callback
     */
    areProfiled(entrezIDs, profileId, callback) {
        let profileDict = {};
        this.localFileLoader.samples.forEach(d => {
            profileDict[d] = entrezIDs
        });
        callback(profileDict);
    }

    /**
     * gets data for an array of entrezIds in a specified profile
     * @param {string} profileId
     * @param {Object[]} entrezIDs
     * @param {returnDataCallback} callback
     */
    getMolecularValues(profileId, entrezIDs, callback) {
        callback(entrezIDs.map(d => this.localFileLoader.profileData.get(profileId).get(d.entrezGeneId))[0])
    }
}

FileAPI.verbose = true;

export default FileAPI;