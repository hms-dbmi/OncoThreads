import axios from 'axios/index';
import { action, extendObservable } from 'mobx';
import CBioAPI from './CBioAPI';

/**
 * mini store for loading available studies
 */

class StudyAPI {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.hackLink = 'http://www.cbiohack.org';
        this.portalLink = 'https://www.cbioportal.org';
        extendObservable(this, {
            allLinks: { hack: this.hackLink, portal: this.portalLink },
            allStudies: { hack: [], portal: [], own: [] },
            get studies() {
                return this.allStudies[this.rootStore.uiStore.cBioInstance];
            },
            /**
             * gets available studies
             */
            getStudies: action(() => {
                Object.keys(this.allLinks).forEach((key) => {
                    if (this.allStudies[key].length === 0) {
                        axios.get(`${this.allLinks[key]}/api/studies?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC`)
                            .then((response) => {
                                response.data.forEach(study => this.includeStudy(key, study));
                            }).catch((thrown) => {
                                if (CBioAPI.verbose) {
                                    console.log(thrown);
                                } else {
                                    console.log('could not load studies');
                                }
                            });
                    }
                });
            }),
            /**
             * adds a study to the corresponding array if it contains temporal data
             */
            includeStudy: action((key, study) => {
                StudyAPI.getEvents(study.studyId, this.allLinks[key], (events) => {
                    const specimenEvents = events.filter(event => event.eventType === 'SPECIMEN');
                    if (specimenEvents.length > 0 && specimenEvents.some(event => event.attributes.map(d => d.key).includes('SAMPLE_ID'))) {
                        this.allStudies[key].push(study);
                        this.allStudies[key] = this.allStudies[key].sort((a, b) => {
                            if (a.name < b.name) {
                                return -1;
                            }
                            if (a.name > b.name) {
                                return 1;
                            }
                            return 0;
                        });
                    }
                });
            }),
        });
        this.getStudies();
    }


    /**
     * get all patients in a study
     * @param {string} studyId
     * @param {string} link
     * @param {returnDataCallback} callback
     */
    static getPatients(studyId, link, callback) {
        axios.get(`${link}/api/studies/${studyId}/patients?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC`)
            .then((response) => {
                callback(response.data.map(patient => patient.patientId));
            }).catch((error) => {
                if (CBioAPI.verbose) {
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
    static getEvents(studyId, link, callback) {
        StudyAPI.getPatients(studyId, link, (patients) => {
            axios.get(`${link}/api/studies/${studyId}/patients/${patients[0]}/clinical-events?projection=SUMMARY&pageSize=10000000&pageNumber=0&sortBy=startNumberOfDaysSinceDiagnosis&direction=ASC`)
                .then((response) => {
                    callback(response.data);
                }).catch((error) => {
                    if (CBioAPI.verbose) {
                        console.log(error);
                    } else {
                        console.log('Could not load events');
                    }
                });
        });
    }
}

export default StudyAPI;
