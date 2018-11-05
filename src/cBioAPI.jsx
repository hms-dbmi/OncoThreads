import axios from 'axios';

class cBioAPI {
    constructor() {
        this.patients = [];
        this.clinicalEvents = {};
        this.clinicalPatientData = [];
        this.clinicalSampleData = [];
        this.molecularProfiles = [];
        this.mutationCounts = [];
    }

    initialize() {
        this.patients = [];
        this.clinicalEvents = {};
        this.clinicalPatientData = [];
        this.clinicalSampleData = [];
        this.molecularProfiles = [];
        this.mutationCounts = [];
    }


    getAllData(studyID, callback) {
        /**
         * get patient information first
         */
        this.patients = [];
        this.clinicalEvents = {};
        this.clinicalPatientData = [];
        this.clinicalSampleData = [];
        this.mutationCounts = [];
        axios.get("http://cbiohack.org/api/studies/" + studyID + "/patients?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC")
            .then(response => {
                this.patients = response.data;
                let _self = this;
                let clinicalEventRequests = [];
                let patientDataRequests = [];
                /**
                 * get clinical events for all the patients
                 */
                this.patients.forEach(function (patient) {
                    clinicalEventRequests.push(axios.get("http://cbiohack.org/api/studies/" + studyID + "/patients/" + patient.patientId + "/clinical-events?projection=SUMMARY&pageSize=10000000&pageNumber=0&sortBy=startNumberOfDaysSinceDiagnosis&direction=ASC"));
                    patientDataRequests.push(axios.get("http://cbiohack.org/api/studies/" + studyID + "/patients/" + patient.patientId + "/clinical-data?projection=DETAILED&pageSize=10000000&pageNumber=0&direction=ASC"));
                });
                axios.all(clinicalEventRequests)
                    .then(function (eventResults) {
                        eventResults.forEach(function (response2, i) {
                            _self.clinicalEvents[_self.patients[i].patientId] = response2.data;
                        });
                        axios.all(patientDataRequests)
                            .then(function (patientDataResults) {
                                patientDataResults.forEach(function (response3, i) {
                                    _self.clinicalPatientData.push(response3.data);
                                });
                                /**
                                 * get clinical data and mutation counts
                                 */
                                axios.all([cBioAPI.getClinicalData(studyID), cBioAPI.getMolecularProfiles(studyID)])
                                    .then(axios.spread(function (clinicalData, molecularProfiles) {
                                        _self.clinicalSampleData = clinicalData.data;
                                        _self.molecularProfiles = molecularProfiles.data;
                                        let index = _self.molecularProfiles.map(d => {
                                            return d.molecularAlterationType;
                                        }).indexOf("MUTATION_EXTENDED");
                                        if (index !== -1) {
                                            axios.get("http://cbiohack.org/api/molecular-profiles/" + molecularProfiles.data[index].molecularProfileId + "/mutation-counts?sampleListId=" + studyID + "_all")
                                                .then(response => {
                                                    _self.mutationCounts = response.data;
                                                    callback();
                                                })
                                        }
                                        else {
                                            callback();
                                        }
                                    })).catch(function (error) {
                                    console.log(error);
                                });
                            })
                    })
            });

    }

    /**
     * Gets clinical data from the cBio Portal
     * @returns {AxiosPromise<any>}
     */
    static getClinicalData(studyID) {
        return axios.get("http://cbiohack.org/api/studies/" + studyID + "/clinical-data?clinicalDataType=SAMPLE&projection=DETAILED&pageSize=10000000&pageNumber=0&direction=ASC");
    }

    /**
     * Gets mutation counts from the cBio Portal
     * @returns {AxiosPromise<any>}
     */
    static getMutationCounts(studyID) {
        return axios.get("http://cbiohack.org/api/molecular-profiles/" + studyID + "_mutations/mutation-counts?sampleListId=" + studyID + "_all");
    }


    /**
     * maps a HUGO Symbol to a entrez gene id
     * @param hgncSymbols
     * @returns {AxiosPromise<any>}
     */
    static genomNexusMappingMultipleSymbols(hgncSymbols) {
        return axios.post("https://genomenexus.org/ensembl/canonical-gene/hgnc", hgncSymbols);
    }

    getGeneIDs(hgncSymbols, callback) {
        cBioAPI.genomNexusMappingMultipleSymbols(hgncSymbols).then(function (response) {
            if (response.data.length === 0) {
                alert("No valid symbols found")
            }
            else {
                let invalidSymbols = [];
                hgncSymbols.forEach(function (d, i) {
                    if (!(response.data.map(entry => entry.hugoSymbol).includes(d))) {
                        invalidSymbols.push(d);
                    }
                });
                if (invalidSymbols.length !== 0) {
                    alert('WARNING the following symbols are not valid: ' + invalidSymbols);
                }
            }
            callback(response.data.map(d => ({hgncSymbol: d.hugoSymbol, entrezGeneId: parseInt(d.entrezGeneId, 10)})));
        }).catch(function (error) {
            alert("invalid symbol")
        })
    }

    getAllMutations(studyId, entrezIDs, callback) {
        axios.post("http://www.cbiohack.org/api/molecular-profiles/" + studyId + "_mutations/mutations/fetch?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC", {
            "entrezGeneIds":
                entrezIDs.map(d => d.entrezGeneId)
            ,
            "sampleListId": studyId + "_all"
        }).then(function (response) {
            callback(response.data)
        })
            .catch(function (error) {
                console.log(error)
            });
    }

    getAllMolecularValues(studyId, profileId, entrezIDs, callback) {
        axios.post("http://www.cbiohack.org/api/molecular-profiles/" + profileId + "/molecular-data/fetch?projection=SUMMARY", {
            "entrezGeneIds":
                entrezIDs.map(d => d.entrezGeneId)
            ,
            "sampleListId": studyId + "_all"
        }).then(function (response) {
            callback(response.data)
        })
            .catch(function (error) {
                console.log(error)
            });
    }

    /**
     * gets all the molecular profiles of a study
     * @param studyID
     * @returns {AxiosPromise<any>}
     */
    static getMolecularProfiles(studyID) {
        return axios.get("http://www.cbiohack.org/api/studies/" + studyID + "/molecular-profiles?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC")
    }

}

export default cBioAPI;