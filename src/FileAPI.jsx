/**
 * class that gets data from LocalFileLoader. Imitates CBioAPI
 */
class FileAPI {
    constructor(localFileLoader, geneNamesAPI) {
        this.localFileLoader = localFileLoader;
        this.geneNamesAPI = geneNamesAPI;
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
        this.localFileLoader.loadClinicalFile(true, clinicalData=>{
            callback(clinicalData.concat(this.localFileLoader.mutationCounts))
        });
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
     * @param {Object[]} genes
     * @param {string} profileId
     * @param {returnDataCallback} callback
     */
    areProfiled(genes, profileId, callback) {
        let profiledDict = {};
        let profile = this.localFileLoader.molecularProfiles.filter(profile => profile.molecularProfileId === profileId)[0];
        let key = "";
        if (this.localFileLoader.panelMatrixParsed === "finished" && this.localFileLoader.genePanelsParsed === "finished"
            && (profile.molecularAlterationType === "MUTATION_EXTENDED" || profile.molecularAlterationType === "COPY_NUMBER_ALTERATION")) {
            if (profile.molecularAlterationType === "MUTATION_EXTENDED") {
                key = "mutations"
            }
            else {
                key = "cna"
            }
            this.localFileLoader.samples.forEach(d => {
                profiledDict[d] = [];
                let panel = this.localFileLoader.panelMatrix[d][key];
                if(panel!=="NA") {
                    let panelGenes = this.localFileLoader.genePanels.get(panel);
                    genes.forEach(gene => {
                        if (panelGenes.includes(gene.hgncSymbol)) {
                            profiledDict[d].push(gene.entrezGeneId);
                        }
                    })
                }
            })
        }
        else {
            this.localFileLoader.samples.forEach(d => {
                profiledDict[d] = genes.map(d => d.entrezGeneId);
            })
        }
        callback(profiledDict);
    }

    /**
     * gets data for an array of entrezIds in a specified profile
     * @param {string} profileId
     * @param {Object[]} entrezIDs
     * @param {returnDataCallback} callback
     */
    getMolecularValues(profileId, entrezIDs, callback) {
        let returnArr = [];
        entrezIDs.forEach(d => returnArr = returnArr.concat(this.localFileLoader.profileData.get(profileId).get(d.entrezGeneId)));
        callback(returnArr);
    }

    /**
     * gets gene IDs with geneNamesAPI
     * @param {String[]} hgncSymbols
     * @param {returnDataCallback} callback
     */
    getGeneIDs(hgncSymbols, callback) {
        if (this.geneNamesAPI.geneListLoaded) {
            this.geneNamesAPI.getGeneIDs(hgncSymbols, callback)
        }
        else {
            alert("Could not (yet) load gene list");
        }
    }
}

FileAPI.verbose = true;
export default FileAPI;