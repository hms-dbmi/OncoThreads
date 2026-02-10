/* eslint-disable no-console */
import axios, { AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';
import { makeObservable, observable, action, computed, IObservableArray } from 'mobx';
import ErrorHandler from '../modules/services/ErrorHandler';
import type { Study, ClinicalEvent, ReturnDataCallback } from './types';

type ConnectionStatus = 'none' | 'success' | 'failed';
type InstanceKey = 'hack' | 'portal' | 'own';

interface PendingEntry {
	callback: (study: Study) => void;
	resolve: () => void;
}

/** Minimal interface for UIStore properties used by StudyAPI */
interface IUIStore {
	cBioInstance: InstanceKey;
}

/**
 * mini store for loading available studies
 */
class StudyAPI {
	allLinks: Record<InstanceKey, string> = {
		hack: 'http://www.cbioportal.org',
		portal: 'https://www.cbioportal.org',
		own: '',
	};
	allStudies: Record<InstanceKey, IObservableArray<Study>> = {
		hack: [] as unknown as IObservableArray<Study>,
		portal: [] as unknown as IObservableArray<Study>,
		own: [] as unknown as IObservableArray<Study>,
	};
	connectionStatus: Record<InstanceKey, ConnectionStatus> = { hack: 'none', portal: 'none', own: 'none' };
	loadComplete = false;
	accessTokenFromUser: string | null = null;
	errorMsg: string | null = null;
	studiesLoaded: Record<InstanceKey, boolean> = { hack: false, portal: false, own: false };
	eventsCache: Map<string, boolean> = new Map();
	eventsPending: Map<string, PendingEntry[]> = new Map();

	private uiStore: IUIStore;
	private source: CancelTokenSource;

	constructor(uiStore: IUIStore) {
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

	get studies(): Study[] {
		const instance = this.uiStore.cBioInstance;
		// Lazy load studies when first accessed
		if (!this.studiesLoaded[instance] && instance === 'hack') {
			this.loadDefaultStudies();
		}
		return this.allStudies[instance];
	}

	loadStudies = (
		link: string,
		callback: (study: Study) => void,
		setStatus: (status: ConnectionStatus) => void,
		setError: ((error: string) => void) | null,
		token?: string | null
	): void => {
		StudyAPI.callGetAPI(
			`${link}/api/studies?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC`,
			token ?? undefined,
			{}
		)
			.then((response: AxiosResponse<Study[]>) => {
				setStatus('success');
				response.data.forEach((study) => {
					callback(study);
				});
			})
			.catch((thrown: unknown) => {
				setStatus('failed');
				this.errorMsg = ErrorHandler.handleAPIError(thrown, 'Failed to load studies');

				if (setError) {
					setError(this.errorMsg);
				}
			});
	};

	includeStudy = (link: string, study: Study, callback: (study: Study) => void, token?: string): Promise<void> => {
		const cacheKey = `${link}|${study.studyId}`;

		// Check cache first
		if (this.eventsCache.has(cacheKey)) {
			const hasTemporal = this.eventsCache.get(cacheKey);
			if (hasTemporal) {
				callback(study);
			}
			return Promise.resolve();
		}

		// Check if request is already pending
		if (this.eventsPending.has(cacheKey)) {
			return new Promise<void>((resolve) => {
				this.eventsPending.get(cacheKey)!.push({ callback, resolve });
			});
		}

		// Mark as pending and store callback with resolver
		return new Promise<void>((resolve) => {
			this.eventsPending.set(cacheKey, [{ callback, resolve }]);

			this.getEvents(
				study.studyId,
				link,
				(events: ClinicalEvent[]) => {
					const specimenEvents = events.filter((event) => event.eventType === 'SPECIMEN');
					const hasTemporal =
						specimenEvents.length > 0 &&
						specimenEvents.some((event) => event.attributes.map((d) => d.key).includes('SAMPLE_ID'));

					this.eventsCache.set(cacheKey, hasTemporal);

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

	checkStudyHasTemporalData = (link: string, study: Study, token?: string): Promise<boolean> => {
		const cacheKey = `${link}|${study.studyId}`;

		// Check cache first
		if (this.eventsCache.has(cacheKey)) {
			return Promise.resolve(this.eventsCache.get(cacheKey)!);
		}

		// Check if request is already pending
		if (this.eventsPending.has(cacheKey)) {
			return new Promise<boolean>((resolve) => {
				this.eventsPending.get(cacheKey)!.push({
					callback: () => {},
					resolve: () => resolve(this.eventsCache.get(cacheKey) ?? false),
				});
			});
		}

		// Make the request
		return new Promise<boolean>((resolve) => {
			this.eventsPending.set(cacheKey, [{ callback: () => {}, resolve: () => resolve(true) }]);

			this.getEvents(
				study.studyId,
				link,
				(events: ClinicalEvent[]) => {
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

					this.eventsCache.set(cacheKey, hasTemporal);

					const pending = this.eventsPending.get(cacheKey) || [];
					this.eventsPending.delete(cacheKey);

					pending.forEach(({ resolve: res }) => {
						res();
					});

					resolve(hasTemporal);
				},
				token,
				(error: { message?: string }) => {
					const errorMsg = error?.message || 'Unknown error';
					console.error(`Failed to check temporal data for study ${study.studyId}:`, errorMsg);

					this.eventsCache.set(cacheKey, false);

					const pending = this.eventsPending.get(cacheKey) || [];
					this.eventsPending.delete(cacheKey);
					pending.forEach(({ resolve: res }) => res());

					resolve(false);
				}
			);
		});
	};

	loadDefaultStudies = (): void => {
		if (this.studiesLoaded.hack) return;
		this.studiesLoaded.hack = true;
		this.loadStudies(
			this.allLinks.hack,
			action((study: Study) => this.allStudies.hack.push(study)),
			action((status: ConnectionStatus) => {
				this.connectionStatus.hack = status;
			}),
			null
		);
	};

	loadOwnInstanceStudies = (link: string): void => {
		this.allLinks.own = link;
		this.allStudies.own.clear();
		this.connectionStatus.own = 'none';
		this.studiesLoaded.own = false;
		this.source.cancel();
		this.source = axios.CancelToken.source();

		this.studiesLoaded.own = true;
		this.loadStudies(
			this.allLinks.own,
			action((study: Study) => this.allStudies.own.push(study)),
			action((status: ConnectionStatus) => {
				this.connectionStatus.own = status;
			}),
			action((error: string) => {
				this.errorMsg = error;
			}),
			this.accessTokenFromUser
		);
	};

	getEvents(
		studyId: string,
		link: string,
		callback: ReturnDataCallback<ClinicalEvent[]>,
		token?: string,
		errorCallback: ((error: { message?: string }) => void) | null = null
	): void {
		StudyAPI.callGetAPI(`${link}/api/studies/${studyId}/clinical-events?projection=SUMMARY&pageSize=10000000&pageNumber=0&sortBy=startNumberOfDaysSinceDiagnosis&direction=ASC`, token, {
			cancelToken: this.source.token,
		})
			.then((response: AxiosResponse<ClinicalEvent[]>) => {
				callback(response.data);
			})
			.catch((error: { message?: string; response?: { status?: number } }) => {
				if (axios.isCancel(error)) {
					console.log('Request canceled');
				} else {
					if (errorCallback) {
						errorCallback(error);
					} else if (!error.message?.includes('404') && error.response?.status !== 404) {
						ErrorHandler.handleAPIError(error, `Could not load clinical events for study ${studyId}`);
					} else {
						console.log(`Study ${studyId} has no clinical events (404)`);
					}
				}
			});
	}

	static callGetAPI<T = unknown>(link: string, token?: string, parameters: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
		if (!token) {
			return axios.get<T>(link, parameters);
		} else {
			return axios.get<T>(
				`https://cors-anywhere.herokuapp.com/${link}`,
				Object.assign(parameters, { headers: { Authorization: `Bearer ${token}` } })
			);
		}
	}

	static callPostAPI<T = unknown>(
		link: string,
		token?: string,
		parameters: AxiosRequestConfig = {},
		body?: unknown
	): Promise<AxiosResponse<T>> {
		if (!token) {
			return axios.post<T>(link, body, parameters);
		} else {
			return axios.post<T>(
				`https://cors-anywhere.herokuapp.com/${link}`,
				body,
				Object.assign(parameters, { headers: { Authorization: `Bearer ${token}` } })
			);
		}
	}
}

export default StudyAPI;
