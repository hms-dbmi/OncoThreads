import axios from 'axios';
import { makeObservable, observable, action, computed } from 'mobx';
import CBioAPI from './CBioAPI';

/**
 * mini store for loading available studies
 */

class StudyAPI {
    allLinks = {hack: 'http://www.cbioportal.org', portal: 'https://www.cbioportal.org'};
    allStudies = {hack: [], portal: [], own: []};
    connectionStatus = {hack: 'none', portal: 'none', own: 'none'};
    loadComplete = false;
    accessTokenFromUser = null;
    errorMsg = null;
    studiesLoaded = {hack: false, portal: false, own: false};
    eventsCache = new Map(); // Cache for study event checks

    constructor(uiStore) {
        this.uiStore = uiStore;
        this.source = axios.CancelToken.source();
        
        makeObservable(this, {
            allLinks: observable,
            allStudies: observable,
            connectionStatus: observable,
            loadComplete: observable,
            accessTokenFromUser: observable,
            errorMsg: observable,
            studiesLoaded: observable,
            studies: computed,
            loadStudies: action,
            includeStudy: action,
            loadDefaultStudies: action,
            loadOwnInstanceStudies: action,
        });
    }

    get studies() {
        const instance = this.uiStore.cBioInstance;
        // Lazy load studies when first accessed
        if (!this.studiesLoaded[instance] && instance === 'hack') {
            this.loadDefaultStudies();
        }
        return this.allStudies[instance];
    }

    /**
     * gets available studies
     */
    loadStudies = (link, callback, setStatus, setError, token) => {
        StudyAPI.callGetAPI(`${link}/api/studies?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC`, token, {})
            .then((response) => {
                setStatus('success');
                response.data.forEach((study) => {
                    this.includeStudy(link, study, callback, token);
                });
            }).catch((thrown) => {
            setStatus('failed');
            // setError(thrown.message);
            if (CBioAPI.verbose) {
                console.log(thrown);
            } else {
                console.log('could not load studies');
            }
        });
    };


    /**
     * adds a study to the corresponding array if it contains temporal data
     */
    includeStudy = (link, study, callback, token) => {
        const cacheKey = `${link}|${study.studyId}`;
        
        // Check cache first
        if (this.eventsCache.has(cacheKey)) {
            const hasTemporal = this.eventsCache.get(cacheKey);
            if (hasTemporal) {
                callback(study);
            }
            return;
        }
        
        this.getEvents(study.studyId, link, (events) => {
            const specimenEvents = events.filter((event) => event.eventType === 'SPECIMEN');
            const hasTemporal = specimenEvents.length > 0 && specimenEvents.some((event) => event.attributes.map((d) => d.key).includes('SAMPLE_ID'));
            
            // Cache the result
            this.eventsCache.set(cacheKey, hasTemporal);
            
            if (hasTemporal) {
                callback(study);
            }
        }, token);
    };

    /**
     * loads default studies from cbioportal
     */
    loadDefaultStudies = () => {
        if (this.studiesLoaded.hack) return; // Prevent duplicate loading
        this.studiesLoaded.hack = true;
        this.loadStudies(this.allLinks.hack, (study) => this.allStudies.hack.push(study),
            (status) => {
                this.connectionStatus.hack = status;
            }, null);
    };

    /**
     * loads studies from own instance
     */
    loadOwnInstanceStudies = (link) => {
        this.allLinks.own = link;
        this.allStudies.own.clear();
        this.connectionStatus.own = 'none';
        this.studiesLoaded.own = false;
        this.source.cancel();
        this.source = axios.CancelToken.source();

        this.studiesLoaded.own = true;
        this.loadStudies(this.allLinks.own,
            (study) => this.allStudies.own.push(study),
            (status) => {
                this.connectionStatus.own = status;
            },
            (error) => {
                this.errorMsg = error;
            }, this.accessTokenFromUser);
    };


    /**
     * get all events for all patients in a study
     * @param {string} studyId
     * @param {string} link
     * @param {returnDataCallback} callback
     * @param {string} token
     */
    getEvents(studyId, link, callback, token) {
        StudyAPI.callGetAPI(`${link}/api/studies/${studyId}/clinical-events?projection=SUMMARY&pageSize=10000000&pageNumber=0&sortBy=startNumberOfDaysSinceDiagnosis&direction=ASC`, token,
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
    }

    static callGetAPI(link, token, parameters) {
        if (!token) {
            return axios.get(link, parameters);
        } else {
            return axios.get(`https://cors-anywhere.herokuapp.com/${link}`,
                Object.assign(parameters, {headers: {Authorization: `Bearer ${token}`}}));
        }
    }

    static callPostAPI(link, token, parameters, body) {
        if (!token) {
            return axios.post(link, body, parameters);
        } else {
            return axios.post(`https://cors-anywhere.herokuapp.com/${link}`, body,
                Object.assign(parameters, {headers: {Authorization: `Bearer ${token}`}}));
        }
    }
}


export default StudyAPI;
