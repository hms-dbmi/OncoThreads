class FileAPI {
    constructor(localFileLoader) {
        this.localFileLoader = localFileLoader;
    }

    /**
     * get all patients in a study
     * @param callback
     */
    getPatients(callback) {
        callback(this.localFileLoader.patients);
    }

    /**
     * get all events for all patients in a study
     *  @param patients
     * @param callback
     */
    getEvents(patients, callback) {
        this.localFileLoader.loadEvents((rawEvents) => {
            callback(rawEvents);
        });
    }

    /**
     * get clinical patient data for each patient in a study
     * @param callback
     */
    getClinicalPatientData(callback) {
        this.localFileLoader.loadClinicalFile(false, data => {
            callback(data)
        });
    }

    /**
     * get all available molecular profiles for a study
     * @param callback
     */
    getAvailableMolecularProfiles(callback) {
        callback(this.localFileLoader.molecularProfiles);
    }

    /**
     * get all available clinical sample data in a study
     * @param callback
     */
    getClinicalSampleData(callback) {
        this.localFileLoader.loadClinicalFile(true, data => {
            callback(data)
        });
    }

    /**
     * get mutation counts in a study
     * @param profileId
     * @param callback
     */
    getMutationCounts(profileId, callback) {
        callback(this.localFileLoader.mutationCounts);
    }


    getMutations(entrezIDs, profileId, callback) {
        callback(this.localFileLoader.mutations.filter(d => entrezIDs.map(d => d.hgncSymbol).includes(d.gene.hugoGeneSymbol)));
    }

    /**
     * checks for each sample if entrezIDs have been profiled
     * @param entrezIDs
     * @param callback
     */
    areProfiled(entrezIDs, profileId, callback) {
        let profileDict = {};
        this.localFileLoader.samples.forEach(d => {
            profileDict[d] = entrezIDs
        });
        callback(profileDict);
    }

    getMolecularValues(profileId, entrezIDs, callback) {

    }


}

FileAPI.verbose = true;

export default FileAPI;