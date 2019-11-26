import axios from 'axios/index';
import { action, extendObservable } from 'mobx';
import CBioAPI from './CBioAPI';

/**
 * mini store for loading available studies
 */

class StudyAPI {
    constructor(uiStore) {
        this.uiStore = uiStore;
        this.source = axios.CancelToken.source();
        extendObservable(this, {
            allLinks: { hack: 'http://www.cbiohack.org', portal: 'https://www.cbioportal.org' },
            allStudies: { hack: [], portal: [], own: [] },
            connectionStatus: { hack: 'none', portal: 'none', own: 'none' },
            loadComplete: false,
            accessTokenFromUser: null,
            errorMsg: null,
            get studies() {
                return this.allStudies[this.uiStore.cBioInstance];
            },
            /**
             * gets available studies
             */

            
            loadStudies: action((link, callback, setStatus, setError) => {
                axios.get(`${link}/api/studies?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC`)
                    .then((response) => {
                        setStatus('success');
                        response.data.forEach((study) => {
                            this.includeStudy(link, study, callback);
                        });
                    }).catch((thrown) => {
                        setStatus('failed');
                        setError(thrown.message);
                        if (CBioAPI.verbose) {
                            console.log(thrown);
                        } else {
                            console.log('could not load studies');
                        }
                    });
            }),


             // return axios.get(URLConstants.USER_URL, { headers: { Authorization: `Bearer ${data.token}` } });

            loadStudiesToken: action((link, token, callback, setStatus, setError) => {
                axios.get(`${link}/api/studies?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC`
                        , { headers: { Authorization: `Bearer ${token}` } }
                    )
                    .then((response) => {
                        setStatus('success');
                        response.data.forEach((study) => {
                            this.includeStudy(link, study, callback);
                        });
                    }).catch((thrown) => {
                        setStatus('failed');
                        setError(thrown.message);
                        if (CBioAPI.verbose) {
                            console.log(thrown);
                        } else {
                            console.log('could not load studies');
                        }
                    });
            }),
            /**
             * adds a study to the corresponding array if it contains temporal data
             */
            includeStudy: action((link, study, callback) => {
                this.getEvents(study.studyId, link, (events) => {
                    const specimenEvents = events.filter((event) => event.eventType === 'SPECIMEN');
                    if (specimenEvents.length > 0 && specimenEvents.some((event) => event.attributes.map((d) => d.key).includes('SAMPLE_ID'))) {
                        callback(study);
                    }
                });
            }),
            /**
             * loads default studies from cbiohack and cbioportal
             */
            loadDefaultStudies: action(() => {
                this.loadStudies(this.allLinks.hack, (study) => this.allStudies.hack.push(study),
                    (status) => {
                        this.connectionStatus.hack = status;
                    });  
                // this.loadStudies(this.allLinks.portal, study => this.allStudies.portal.push(study));
            }),
            /**
             * loads studies from own instance
             */
            loadOwnInstanceStudies: action((link) => {
                this.allLinks.own = link;
                this.allStudies.own.clear();
                this.connectionStatus.own = 'none';
                this.source.cancel();
                this.source = axios.CancelToken.source();

                if(this.accessTokenFromUser==null){

                    console.log("access token null");
                    this.loadStudies(this.allLinks.own, 
                        (study) => this.allStudies.own.push(study),
                        (status) => {
                            this.connectionStatus.own = status;
                        },
                        (error) => {
                            this.errorMsg = error;
                        });
                }
                else{
                    this.loadStudiesToken(this.allLinks.own, 
                        this.accessTokenFromUser,
                        (study) => this.allStudies.own.push(study),
                        (status) => {
                            this.connectionStatus.own = status;
                        },
                        (error) => {
                            this.errorMsg = error;
                        });
                }
                
            }),
        });
    }


    /**
     * get all patients in a study
     * @param {string} studyId
     * @param {string} link
     * @param {returnDataCallback} callback
     */
    getPatients(studyId, link, callback) {
        axios.get(`${link}/api/studies/${studyId}/patients?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC`,
            {
                cancelToken: this.source.token,
            })
            .then((response) => {
                callback(response.data.map((patient) => patient.patientId));
            }).catch((error) => {
                if (axios.isCancel(error)) {
                    console.log('Request canceled');
                } else if (CBioAPI.verbose) {
                    console.log(error);
                } else {
                    console.log('Could not load patients');
                }
            });
    }


    /**
     * get all events for all patients in a study
     * @param {string} studyId
     * @param {string} link
     * @param {returnDataCallback} callback
     */
    getEvents(studyId, link, callback) {
        this.getPatients(studyId, link, (patients) => {
            axios.get(`${link}/api/studies/${studyId}/patients/${patients[0]}/clinical-events?projection=SUMMARY&pageSize=10000000&pageNumber=0&sortBy=startNumberOfDaysSinceDiagnosis&direction=ASC`,
                {
                    cancelToken: this.source.token,
                })
                .then((response) => {
                    callback(response.data);
                }).catch((error) => {
                    if (axios.isCancel(error)) {
                        console.log('Request canceled');
                    } else if (CBioAPI.verbose) {
                        console.log(error);
                    } else {
                        console.log('Could not load events');
                    }
                });
        });
    }
}


export default StudyAPI;
