import axios from 'axios';


class cBioAPI {
    /**
     * get all patients in a study
     * @param studyID
     * @param callback
     */
    getPatients(studyID, callback) {
        axios.get("http://cbiohack.org/api/studies/" + studyID + "/patients?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC")
            .then(response => {
                callback(response.data.map(patient => patient.patientId));
            }).catch((error) => {
            if (cBioAPI.verbose) {
                console.log(error);
            }
            else {
                console.log("Could not load patients");
            }
        });
    }

    /**
     * get all events for all patients in a study
     * @param studyID
     * @param patients
     * @param callback
     */
    getEvents(studyID, patients, callback) {
        let clinicalEventRequests = patients.map(patient => axios.get("http://cbiohack.org/api/studies/" + studyID + "/patients/" + patient + "/clinical-events?projection=SUMMARY&pageSize=10000000&pageNumber=0&sortBy=startNumberOfDaysSinceDiagnosis&direction=ASC"));
        axios.all(clinicalEventRequests)
            .then(eventResults => {
                let events = {};
                eventResults.forEach((response, i) => {
                    events[patients[i]] = response.data;
                });
                callback(events);
            }).catch((error) => {
            if (cBioAPI.verbose) {
                console.log(error);
            }
            else {
                console.log("Could not load events")
            }
        });
    }

    /**
     * get clinical patient data for each patient in a study
     * @param studyID
     * @param patients
     * @param callback
     */
    getClinialPatientData(studyID, patients, callback) {
        let patientDataRequests = patients.map(patient => axios.get("http://cbiohack.org/api/studies/" + studyID + "/patients/" + patient + "/clinical-data?projection=DETAILED&pageSize=10000000&pageNumber=0&direction=ASC"));
        axios.all(patientDataRequests)
            .then(patientDataResults => {
                let patientData = [];
                patientDataResults.forEach(function (response) {
                    patientData.push(response.data);
                });
                callback(patientData);
            }).catch((error) => {
            if (cBioAPI.verbose) {
                console.log(error);
            }
            else {
                console.log("Could not load patient data")
            }
        });
    }

    /**
     * get all available molecular profiles for a study
     * @param studyID
     * @param callback
     */
    getAvailableMolecularProfiles(studyID, callback) {
        axios.get("http://www.cbiohack.org/api/studies/" + studyID + "/molecular-profiles?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC")
            .then(response => {
                callback(response.data);
            }).catch((error) => {
            if (cBioAPI.verbose) {
                console.log(error);
            }
            else {
                console.log("Could not available molecular profiles")

            }
        });
    }

    /**
     * get all available clinical sample data in a study
     * @param studyID
     * @param callback
     */
    getClinicalSampleData(studyID, callback) {
        axios.get("http://cbiohack.org/api/studies/" + studyID + "/clinical-data?clinicalDataType=SAMPLE&projection=DETAILED&pageSize=10000000&pageNumber=0&direction=ASC")
            .then(response => {
                callback(response.data);
            }).catch((error) => {
            if (cBioAPI.verbose) {
                console.log(error);
            }
            else {
                console.log("Could not load sample data")
            }
        });
    }

    /**
     * get all mutations in a study
     * @param studyID
     * @param molecularProfile
     * @param callback
     */
    getAllMutations(studyID, molecularProfile, callback) {
        axios.get("http://www.cbiohack.org/api/molecular-profiles/" + molecularProfile + "/mutations?sampleListId=" + studyID + "_all&projection=DETAILED&pageSize=10000000&pageNumber=0&direction=ASC")
            .then(response => {
                callback(response.data);
            }).catch((error) => {
            if (cBioAPI.verbose) {
                console.log(error);
            }
            else {
                console.log("Could not load mutations")
            }
        });
    }

    /**
     * get mutation counts in a study
     * @param studyID
     * @param molecularProfile
     * @param callback
     */
    getMutationCounts(studyID, molecularProfile, callback) {
        axios.get("http://cbiohack.org/api/molecular-profiles/" + molecularProfile + "/mutation-counts?sampleListId=" + studyID + "_all")
            .then(response => {
                callback(response.data);
            }).catch((error) => {
            if (cBioAPI.verbose) {
                console.log(error);
            }
            else {
                console.log("Could not load mutation counts")
            }
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
    static getMutationCounts(studyID, molecularProfile) {
        return axios.get("http://cbiohack.org/api/molecular-profiles/" + molecularProfile + "/mutation-counts?sampleListId=" + studyID + "_all");
    }

    static getMutations(studyID, molecularProfile) {
        return axios.get("http://www.cbiohack.org/api/molecular-profiles/" + molecularProfile + "/mutations?sampleListId=" + studyID + "_all&projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC");
    }


    /**
     * maps a HUGO Symbol to a entrez gene id
     * @param hgncSymbols
     * @returns {AxiosPromise<any>}
     */
    static genomNexusMappingMultipleSymbols(hgncSymbols) {
        return axios.post("https://genomenexus.org/ensembl/canonical-gene/hgnc", hgncSymbols);
    }

    getHugoSymbols(entrezIds, callback) {
        axios.post("https://genomenexus.org/ensembl/canonical-gene/entrez", entrezIds).then(function (response) {
            let mapper = {};
            response.data.forEach(d => {
                mapper[d.entrezGeneId] = d.hugoSymbol;
            });
            callback(mapper);
        }).catch(function (error) {
            if (cBioAPI.verbose) {
                console.log(error);
            }
            else {
                alert("invalid symbol")
            }
        })
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
            if (cBioAPI.verbose) {
                console.log(error);
            }
            else {
                alert("invalid symbol")
            }
        })
    }

    getMutations(studyId, entrezIDs, callback) {
        axios.post("http://www.cbiohack.org/api/molecular-profiles/" + studyId + "_mutations/mutations/fetch?projection=DETAILED&pageSize=10000000&pageNumber=0&direction=ASC", {
            "entrezGeneIds":
                entrezIDs.map(d => d.entrezGeneId)
            ,
            "sampleListId": studyId + "_all"
        }).then(function (response) {
            callback(response.data)
        }).catch(function (error) {
            if (cBioAPI.verbose) {
                console.log(error);
            }
            else {
                console.log("Can't get mutations")
            }
        });
    }

    /**
     * checks for each sample if entrezIDs have been profiled
     * @param studyId
     * @param entrezIDs
     * @param callback
     */
    areProfiled(studyId, entrezIDs, callback) {
        let profiledDict = {};
        axios.post("http://www.cbiohack.org/api/molecular-profiles/" + studyId + "_mutations/gene-panel-data/fetch",
            {
                "sampleListId": studyId + "_all"
            }
        ).then(samplePanels => {
            let differentPanels = samplePanels.data.map(d => d.genePanelId).filter(function (item, i, ar) {
                return ar.indexOf(item) === i;
            }).filter(d => d !== undefined);
            if (differentPanels.length > 0) {
                axios.all(differentPanels.map(d => axios.get("http://www.cbiohack.org/api/gene-panels/" + d))).then(panelList => {
                    samplePanels.data.forEach(samplePanel => {
                        profiledDict[samplePanel.sampleId] = [];
                        entrezIDs.forEach(entrezId => {
                            if (samplePanel.genePanelId !== undefined) {
                                if (panelList.data[panelList.data.map(panel => panel.genePanelId).indexOf(samplePanel.genePanelId)].genes.map(gene => gene.entrezGeneId).includes(entrezId)) {
                                    profiledDict[samplePanel.sampleId].push(entrezId);
                                }
                            }
                            else {
                                profiledDict[samplePanel.sampleId] = entrezId;
                            }

                        });
                    });
                    callback(profiledDict);
                }).catch(function (error) {
                    if (cBioAPI.verbose) {
                        console.log(error);
                    }
                });
            }
            else {
                samplePanels.data.forEach(samplePanel =>
                    profiledDict[samplePanel.sampleId] = entrezIDs
                );
                callback(profiledDict);
            }
        }).catch(function (error) {
            if (cBioAPI.verbose) {
                console.log(error);
            }
        });
    }

    getMolecularValues(studyId, profileId, entrezIDs, callback) {
        axios.post("http://www.cbiohack.org/api/molecular-profiles/" + profileId + "/molecular-data/fetch?projection=SUMMARY", {
            "entrezGeneIds":
                entrezIDs.map(d => d.entrezGeneId)
            ,
            "sampleListId": studyId + "_all"
        }).then(function (response) {
            callback(response.data)
        }).catch(function (error) {
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
cBioAPI.verbose = false;

export default cBioAPI;