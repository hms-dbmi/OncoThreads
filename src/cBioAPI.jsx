import axios from 'axios';


class cBioAPI {
    constructor() {
        this.patients = [];
        this.clinicalEvents = {};
        this.allClinicalEvents=[];
        this.allClinicalPatientData=[];
        this.clinicalPatientData=[];
        this.clinicalSampleData=[];
        this.mutationCounts=[];
    }


    getAllData(studyID,callback) {
        /**
         * get patient information first
         */
        axios.get("http://www.cbioportal.org/api/studies/" + studyID + "/patients?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC")
            .then(response => {
                this.patients = response.data;
                let _self = this;
                let clinicalEventRequests = [];
                let patientDataRequests = [];


                /**
                 * get clinical events for all the patients
                 */
                this.patients.forEach(function (patient) {
                    clinicalEventRequests.push(axios.get("http://www.cbioportal.org/api/studies/" + studyID + "/patients/" + patient.patientId + "/clinical-events?projection=SUMMARY&pageSize=10000000&pageNumber=0&sortBy=startNumberOfDaysSinceDiagnosis&direction=ASC"));
                    patientDataRequests.push(axios.get("http://www.cbioportal.org/api/studies/" + studyID + "/patients/" + patient.patientId + "/clinical-data?projection=DETAILED&pageSize=10000000&pageNumber=0&direction=ASC"));
                });
                _self.allClinicalData = [];
                _self.allClinicalEvents = [];
                axios.all(clinicalEventRequests)
                    .then(function (eventResults) {
                        eventResults.forEach(function (response2, i) {
                            _self.clinicalEvents[_self.patients[i].patientId] = response2.data;
                            _self.allClinicalEvents=_self.allClinicalEvents.concat(response2.data);
                        });
                        axios.all(patientDataRequests)
                            .then(function (patientDataResults) {
                                patientDataResults.forEach(function (response3, i) {
                                    _self.clinicalPatientData.push(response3.data);
                                    _self.allClinicalPatientData=_self.allClinicalPatientData.concat(response3.data);
                                });

                                /**
                                 * get clinical data and mutation counts
                                 */
                                axios.all([cBioAPI.getClinicalData(studyID), cBioAPI.getMutationCounts(studyID)])
                                    .then(axios.spread(function (clinicalData, mutationCounts) {
                                        _self.clinicalSampleData=clinicalData.data;
                                        _self.mutationCounts=mutationCounts.data;
                                        callback();
                                    }));
                            })
                    })
            })

    }
    /**
     * Gets clinical data from the cBio Portal
     * @returns {AxiosPromise<any>}
     */
    static getClinicalData(studyID) {
        return axios.get("http://www.cbioportal.org/api/studies/" + studyID + "/clinical-data?clinicalDataType=SAMPLE&projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC");
    }

    /**
     * Gets mutation counts from the cBio Portal
     * @returns {AxiosPromise<any>}
     */
    static getMutationCounts(studyID) {
        return axios.get("http://www.cbioportal.org/api/molecular-profiles/" + studyID + "_mutations/mutation-counts?sampleListId=lgg_ucsf_2014_all");
    }

}

export default cBioAPI;