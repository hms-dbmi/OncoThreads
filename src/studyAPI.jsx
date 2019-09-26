import axios from 'axios/index';
import { action, extendObservable } from 'mobx';
import CBioAPI from './CBioAPI';

/**
 * mini store for loading available studies
 */

class StudyAPI {
    constructor(uiStore) {
        this.uiStore = uiStore;
        extendObservable(this, {
            allLinks: { hack: 'http://www.cbiohack.org', portal: 'https://www.cbioportal.org' },
            allStudies: { hack: [], portal: [], own: [] },
            loadComplete: false,
            get studies() {
                return this.allStudies[this.uiStore.cBioInstance];
            },
            /**
             * gets available studies
             */
            loadStudies: action((link, callback) => {
                axios.get(`${link}/api/studies?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC`)
                    .then((response) => {
                        response.data.forEach((study) => {
                            this.includeStudy(link, study, callback);
                        });
                    }).catch((thrown) => {
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
                StudyAPI.getEvents(study.studyId, link, (events) => {
                    const specimenEvents = events.filter(event => event.eventType === 'SPECIMEN');
                    if (specimenEvents.length > 0 && specimenEvents.some(event => event.attributes.map(d => d.key).includes('SAMPLE_ID'))) {
                        callback(study);
                    }
                });
            }),
            /**
             * loads default studies from cbiohack and cbioportal
             */
            loadDefaultStudies: action(() => {
                this.loadStudies(this.allLinks.hack, study => this.allStudies.hack.push(study));
                //this.loadStudies(this.allLinks.portal, study => this.allStudies.portal.push(study));
            }),
        });
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
