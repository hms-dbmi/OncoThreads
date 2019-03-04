import axios from 'axios';


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
        callback(this.localFileLoader.rawEvents);
    }

    /**
     * get clinical patient data for each patient in a study
     * @param callback
     */
    getClinicalPatientData(callback) {
        callback(this.localFileLoader.rawClinicalPatientData);
    }

    /**
     * get all available molecular profiles for a study
     * @param callback
     */
    getAvailableMolecularProfiles(callback) {
        callback([]);
    }

    /**
     * get all available clinical sample data in a study
     * @param callback
     */
    getClinicalSampleData(callback) {
        callback(this.localFileLoader.rawClinicalSampleData);
    }

    /**
     * get all mutations in a study
     * @param molecularProfile
     * @param callback
     */
    getAllMutations(molecularProfile, callback) {
        callback([]);
    }

    /**
     * get mutation counts in a study
     * @param molecularProfile
     * @param callback
     */
    getMutationCounts(molecularProfile, callback) {
        callback([]);
    }


    getHugoSymbols(entrezIds, callback) {
        axios.post("https://genomenexus.org/ensembl/canonical-gene/entrez", entrezIds).then(function (response) {
            let mapper = {};
            response.data.forEach(d => {
                mapper[d.entrezGeneId] = d.hugoSymbol;
            });
            callback(mapper);
        }).catch(function (error) {
            if (FileAPI.verbose) {
                console.log(error);
            }
            else {
                alert("invalid symbol")
            }
        })
    }


    getMutations(entrezIDs, callback) {

    }

    /**
     * checks for each sample if entrezIDs have been profiled
     * @para* @param entrezIDs
     * @param callback
     */
    areProfiled(entrezIDs, callback) {

    }

    getMolecularValues(profileId, entrezIDs, callback) {

    }


}

FileAPI.verbose = true;

export default FileAPI;