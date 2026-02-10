import axios from 'axios';
import { makeObservable, observable, action, computed } from 'mobx';
import CBioAPI from './CBioAPI';
import ErrorHandler from '../modules/services/ErrorHandler';

/**
 * mini store for loading available studies
 */

class StudyAPI {
	allLinks = { hack: 'http://www.cbioportal.org', portal: 'https://www.cbioportal.org' };
	allStudies = { hack: [], portal: [], own: [] };
	connectionStatus = { hack: 'none', portal: 'none', own: 'none' };
	loadComplete = false;
	accessTokenFromUser = null;
	errorMsg = null;
	studiesLoaded = { hack: false, portal: false, own: false };
	eventsCache = new Map(); // Cache for study event checks
	eventsPending = new Map(); // Track in-flight requests to prevent duplicates

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
		StudyAPI.callGetAPI(
			`${link}/api/studies?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC`,
			token,
			{}
		)
			.then((response) => {
				setStatus('success');

				// Just add all studies without checking for events
				// Events will be checked when user selects a study
				response.data.forEach((study) => {
					callback(study);
				});
			})
			.catch((thrown) => {
				setStatus('failed');
				this.errorMsg = ErrorHandler.handleAPIError(thrown, 'Failed to load studies');

				if (setError) {
					setError(this.errorMsg);
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
			// For batching: resolve immediately since we have the answer
			return Promise.resolve();
		}

		// Check if request is already pending
		if (this.eventsPending.has(cacheKey)) {
			// Add callback to pending list and return the promise
			return new Promise((resolve) => {
				this.eventsPending.get(cacheKey).push({ callback, resolve });
			});
		}

		// Mark as pending and store callback with resolver
		return new Promise((resolve) => {
			this.eventsPending.set(cacheKey, [{ callback, resolve }]);

			this.getEvents(
				study.studyId,
				link,
				(events) => {
					const specimenEvents = events.filter((event) => event.eventType === 'SPECIMEN');
					const hasTemporal =
						specimenEvents.length > 0 &&
						specimenEvents.some((event) => event.attributes.map((d) => d.key).includes('SAMPLE_ID'));

					// Cache the result
					this.eventsCache.set(cacheKey, hasTemporal);

					// Call all pending callbacks and resolve their promises
					const pending = this.eventsPending.get(cacheKey) || [];
					this.eventsPending.delete(cacheKey);

					pending.forEach(({ callback: cb, resolve: res }) => {
						if (hasTemporal) {
							cb(study);
						}
						res();
					});
				},
				token
			);
		});
	};

	/**
	 * checks if a study has temporal data (clinical events with specimen timeline)
	 * This method should be called when a user selects a study
	 * @param {string} link - The cBioPortal instance URL
	 * @param {Object} study - The study object
	 * @param {string} token - Authentication token
	 * @returns {Promise<boolean>} - Resolves to true if study has temporal data
	 */
	checkStudyHasTemporalData = (link, study, token) => {
		const cacheKey = `${link}|${study.studyId}`;

		// Check cache first
		if (this.eventsCache.has(cacheKey)) {
			return Promise.resolve(this.eventsCache.get(cacheKey));
		}

		// Check if request is already pending
		if (this.eventsPending.has(cacheKey)) {
			return new Promise((resolve) => {
				this.eventsPending.get(cacheKey).push({
					callback: () => {},
					resolve: () => resolve(this.eventsCache.get(cacheKey)),
				});
			});
		}

		// Make the request
		return new Promise((resolve) => {
			this.eventsPending.set(cacheKey, [{ callback: () => {}, resolve: () => resolve(true) }]);

			this.getEvents(
				study.studyId,
				link,
				(events) => {
					// Check if events array has any SPECIMEN events with SAMPLE_ID
					const specimenEvents = events.filter((event) => event.eventType === 'SPECIMEN');
					const hasTemporal =
						specimenEvents.length > 0 &&
						specimenEvents.some(
							(event) => event.attributes && event.attributes.some((attr) => attr.key === 'SAMPLE_ID')
						);

					if (!hasTemporal && events.length > 0) {
						const eventTypes = [...new Set(events.map((e) => e.eventType))];
						console.log(
							`Study ${study.studyId} has temporal data but no SPECIMEN events. Event types:`,
							eventTypes
						);
					}

					// Cache the result
					this.eventsCache.set(cacheKey, hasTemporal);

					// Resolve all pending promises
					const pending = this.eventsPending.get(cacheKey) || [];
					this.eventsPending.delete(cacheKey);

					pending.forEach(({ resolve: res }) => {
						res();
					});

					resolve(hasTemporal);
				},
				token,
				(error) => {
					// Error callback for getEvents
					const errorMsg = error?.message || 'Unknown error';
					console.error(`Failed to check temporal data for study ${study.studyId}:`, errorMsg);

					// Cache as false on error to prevent retry loops
					this.eventsCache.set(cacheKey, false);

					// Resolve pending promises
					const pending = this.eventsPending.get(cacheKey) || [];
					this.eventsPending.delete(cacheKey);
					pending.forEach(({ resolve: res }) => res());

					resolve(false);
				}
			);
		});
	};

	/**
	 * loads default studies from cbioportal
	 */
	loadDefaultStudies = () => {
		if (this.studiesLoaded.hack) return; // Prevent duplicate loading
		this.studiesLoaded.hack = true;
		this.loadStudies(
			this.allLinks.hack,
			action((study) => this.allStudies.hack.push(study)),
			action((status) => {
				this.connectionStatus.hack = status;
			}),
			null
		);
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
		this.loadStudies(
			this.allLinks.own,
			action((study) => this.allStudies.own.push(study)),
			action((status) => {
				this.connectionStatus.own = status;
			}),
			action((error) => {
				this.errorMsg = error;
			}),
			this.accessTokenFromUser
		);
	};

	/**
	 * get all events for all patients in a study
	 * @param {string} studyId
	 * @param {string} link
	 * @param {Function} callback - Success callback
	 * @param {string} token
	 * @param {Function} errorCallback - Optional error callback
	 */
	getEvents(studyId, link, callback, token, errorCallback = null) {
		StudyAPI.callGetAPI(
			`${link}/api/studies/${studyId}/clinical-events?projection=SUMMARY&pageSize=10000000&pageNumber=0&sortBy=startNumberOfDaysSinceDiagnosis&direction=ASC`,
			token,
			{
				cancelToken: this.source.token,
			}
		)
			.then((response) => {
				callback(response.data);
			})
			.catch((error) => {
				if (axios.isCancel(error)) {
					console.log('Request canceled');
				} else {
					if (errorCallback) {
						errorCallback(error);
					} else if (!error.message?.includes('404') && error.response?.status !== 404) {
						// Only show message for non-404 errors (404 means no temporal data)
						ErrorHandler.handleAPIError(error, `Could not load clinical events for study ${studyId}`);
					} else {
						// Log 404s without showing user notification (expected for studies without temporal data)
						console.log(`Study ${studyId} has no clinical events (404)`);
					}
				}
			});
	}

	static callGetAPI(link, token, parameters) {
		if (!token) {
			return axios.get(link, parameters);
		} else {
			return axios.get(
				`https://cors-anywhere.herokuapp.com/${link}`,
				Object.assign(parameters, { headers: { Authorization: `Bearer ${token}` } })
			);
		}
	}

	static callPostAPI(link, token, parameters, body) {
		if (!token) {
			return axios.post(link, body, parameters);
		} else {
			return axios.post(
				`https://cors-anywhere.herokuapp.com/${link}`,
				body,
				Object.assign(parameters, { headers: { Authorization: `Bearer ${token}` } })
			);
		}
	}
}

export default StudyAPI;
