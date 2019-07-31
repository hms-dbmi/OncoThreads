import axios from 'axios/index';
import { action, extendObservable } from 'mobx';
import cBioAPI from './cBioAPI';

/**
 * mini store for loading available studies
 */
class StudyAPI {
    constructor(rootStore) {
        this.rootStore = rootStore;
        extendObservable(this, {
            studies: [], // all available studies
            /**
             * gets available studies
             */
            getStudies: action(() => {
                this.studies = [];
                axios.get(`${this.rootStore.cBioLink}/api/studies?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC`)
                    .then((response) => {
                        response.data.forEach(study => this.includeStudy(study));
                    });
            }),
            includeStudy: action((study) => {
                this.getPatients(study.studyId, (patients) => {
                    this.getEvents(study.studyId, patients[0], (events) => {
                        if (events.map(d => d.eventType).includes('SPECIMEN')) {
                            this.studies.push(study);
                        }
                    });
                });
            }),
        });
    }


    /**
     * get all patients in a study
     * @param studyId
     * @param {returnDataCallback} callback
     */
    getPatients(studyId, callback) {
        axios.get(`${this.rootStore.cBioLink}/api/studies/${studyId}/patients?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC`)
            .then((response) => {
                callback(response.data.map(patient => patient.patientId));
            }).catch((error) => {
                if (cBioAPI.verbose) {
                    console.log(error);
                } else {
                    console.log('Could not load patients');
                }
            });
    }


    /**
     * get all events for all patients in a study
     * @param studyId
     * @param {string} patient
     * @param {returnDataCallback} callback
     */
    getEvents(studyId, patient, callback) {
        axios.get(`${this.rootStore.cBioLink}/api/studies/${studyId}/patients/${patient}/clinical-events?projection=SUMMARY&pageSize=10000000&pageNumber=0&sortBy=startNumberOfDaysSinceDiagnosis&direction=ASC`)
            .then((response) => {
                callback(response.data);
            }).catch((error) => {
                if (cBioAPI.verbose) {
                    console.log(error);
                } else {
                    console.log('Could not load events');
                }
            });
    }
}

export default StudyAPI;
