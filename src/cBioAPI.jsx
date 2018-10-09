import axios from 'axios';


class cBioAPI {
    constructor() {
        this.patients = [];
        this.samples = [];
        this.clinicalEvents = {};
        this.clinicalPatientData = [];
        this.clinicalSampleData = [];
        this.mutationCounts = [];
        this.selectedMutation = [];
    }

    initialize() {
        this.patients = [];
        this.samples = [];
        this.clinicalEvents = {};
        this.clinicalPatientData = [];
        this.clinicalSampleData = [];
        this.mutationCounts = [];
        this.selectedMutation = [];
    }


    getAllData(studyID, callback) {
        /**
         * get patient information first
         */
        this.patients = [];
        this.samples = [];
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
                                        let index = molecularProfiles.data.map(function (d, i) {
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
            })

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

    getMutation(studyId, HUGOsymbol, callback) {
        this.selectedMutation = [];
        const _self = this;
        cBioAPI.mapHUGOgeneSymbol(HUGOsymbol).then(function (res) {
            const entrezId = res.data.response.docs[0].entrez_id;
            axios.post("http://www.cbiohack.org/api/molecular-profiles/" + studyId + "_mutations/mutations/fetch?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC", {
                "entrezGeneIds": [
                    entrezId
                ],
                "sampleListId": studyId + "_all"
            }).then(function (response) {
                _self.selectedMutation = response.data;
                cBioAPI.getAllSamples(studyId).then(function (response2) {
                    _self.samples = response2.data;
                    callback();
                });
            }).catch(function (error) {
                console.log(error);
            });
        })
            .catch(function (error) {
                console.log(error)
            });

    }

    static getAllSamples(studyId) {
        return axios.get("http://www.cbiohack.org/api/sample-lists/" + studyId + "_all/sample-ids\n")
    }

    static mapHUGOgeneSymbol(symbol) {
        return axios.get("https://rest.genenames.org/fetch/symbol/" + symbol);
    }

    static uniprotMapping(hgncId) {
        return axios.post('https://www.uniprot.org/uploadlists',{
            'from': 'HGNC_ID',
            'to': 'P_ENTREZGENEID',
            'format': 'tab',
            'query': hgncId
        });
    }

    static getMolecularProfiles(studyID) {
        return axios.get("http://www.cbiohack.org/api/studies/" + studyID + "/molecular-profiles?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC")
    }

}

export default cBioAPI;