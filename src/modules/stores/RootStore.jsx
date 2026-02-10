import { action, makeObservable, observable, computed, reaction, toJS } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import DataStore from './DataStore';

import VisStore from './VisStore';
import OriginalVariable from './OriginalVariable';
import MolProfileMapping from '../MolProfileMapping';
import SvgExport from '../SvgExport';
import CBioAPI from '../../API/CBioAPI';
import FileAPI from '../../API/FileAPI';
import LocalFileLoader from '../../LocalFileLoader';
import GeneNamesLocalAPI from '../../API/GeneNamesLocalAPI';
import ScoreStore from './ScoreStore';
import DataParsingService from '../services/DataParsingService';

/*
 Store containing all the other stores gets the data with either the CBioAPI
 or from local files, transforms it and gives it to the other stores
 */
class RootStore {
	// Observable properties as class fields
	isOwnData = false;
	timelineParsed = false;
	hasClinical = false;
	dataParsed = false;
	firstLoad = true;
	timeVar = 1;
	timeValue = 'days';
	clinicalSampleCategories = [];
	clinicalPatientCategories = [];
	availableProfiles = [];
	timepointStructure = [];

	constructor(uiStore, studyAPI) {
		this.study = null; // current study
		this.patients = []; // patients ids in the current study

		this.initialVariable = {}; // initial variable saved for reset

		this.timeDistanceId = uuidv4(); // random id for time distance variable

		this.mutationMappingTypes = ['Binary', 'Mutation type', 'Protein change', 'Variant allele frequency']; // possible variable types of mutation data
		this.eventAttributes = []; // available event attributes

		this.sampleTimelineMap = {}; // map of sample ids to dates of sample collection
		this.eventTimelineMap = {}; // map of sample ids to dates of events
		this.staticMappers = {}; // mappers of sample id to pre-loaded variables
		this.patientMappers = {}; // mappers of patient id to patient variables
		this.eventMappers = {}; // maps event ids to event dates

		this.sampleStructure = {}; // structure of samples per patient

		this.api = null; // current api in use: CBioAPI or FileAPI
		this.molProfileMapping = new MolProfileMapping(this); // store for loading data on demand
		this.dataStore = new DataStore(this); // substore containing the main data
		this.visStore = new VisStore(this); // substore for visual parameters of the visualization
		this.svgExport = new SvgExport(this); // substore for SVG export
		this.scoreStore = new ScoreStore(this); // substore for scores
		this.geneNamesAPI = new GeneNamesLocalAPI(); // substore for gene name API
		this.localFileLoader = new LocalFileLoader(); // substore for loading local files
		this.uiStore = uiStore;
		this.studyAPI = studyAPI;

		this.allEvents = null;

		makeObservable(this, {
			// Observable properties
			isOwnData: observable,
			timelineParsed: observable,
			hasClinical: observable,
			dataParsed: observable,
			firstLoad: observable,
			timeVar: observable,
			timeValue: observable,
			clinicalSampleCategories: observable,
			clinicalPatientCategories: observable,
			availableProfiles: observable,
			timepointStructure: observable,

			// Actions
			reset: action,
			setTimeData: action,
			setIsOwnData: action,
			resetTimepointStructure: action,
			parseTimeline: action,
			parseCBio: action,
			applyClinicalSampleData: action,
			applyClinicalPatientData: action,
			applyTimelineData: action,
			updateTimepointStructure: action,

			// Computed properties
			eventBlockStructure: computed,
			minMax: computed,
			maxTimeInDays: computed,
			mutationProfile: computed,
			hasProfileData: computed,
			cBioLink: computed,
		});

		// reset timelineParsed if data input is changed
		reaction(
			() => this.isOwnData,
			(isOwnData) => {
				if (isOwnData && !this.geneNamesAPI.geneListLoaded) {
					this.geneNamesAPI.getAllGeneSymbols();
				}
				this.timelineParsed = false;
			}
		);
		// reset timelineParsed if eventsParsed in localFileLoader is reset
		reaction(
			() => this.localFileLoader.eventsParsed,
			(parsed) => {
				if (!parsed) {
					this.timelineParsed = false;
				}
			}
		);
		// reacts to change in stacking mode
		reaction(
			() => this.uiStore.horizontalStacking,
			(horizontalStacking) => {
				if (horizontalStacking) {
					this.visStore.setBandRectHeight(0);
					this.visStore.setColorRectHeight(0);
				} else {
					this.visStore.setBandRectHeight(15);
					this.visStore.setColorRectHeight(2);
				}
			}
		);
		reaction(
			() => this.uiStore.cBioInstance,
			() => {
				this.timelineParsed = false;
			}
		);
	}

	/**
	 * resets everything
	 */
	reset = () => {
		this.dataParsed = false;
		this.dataStore.reset();
		this.resetTimepointStructure(false);
		if (this.hasClinical) {
			this.addInitialVariable();
		}
		this.dataParsed = true;
	};

	/**
	 * sets global timeline axis scale
	 * @param {number} id
	 * @param {string} value
	 */
	setTimeData = (id, value) => {
		this.timeValue = value;
		this.timeVar = id;
	};

	/**
	 * sets if own data or cBio data is displayed
	 * @param {boolean} isOwn
	 */
	setIsOwnData = (isOwn) => {
		this.isOwnData = isOwn;
	};

	/**
	 * resets the timepoint structure to the default alignment
	 * @param {boolean} update - keep variables (true) or completely reset view (false)
	 */
	resetTimepointStructure = (update) => {
		this.timepointStructure = [];
		Object.keys(this.sampleStructure).forEach((patient) => {
			this.sampleStructure[patient].forEach((d, i) => {
				if (this.timepointStructure.length === i) {
					this.timepointStructure.push([]);
				}
				this.timepointStructure[i].push({ patient, sample: d });
			});
		});
		if (update) {
			this.dataStore.update(this.patients);
		} else {
			this.dataStore.initialize();
		}
	};

	/**
	 * Clears study data when switching between studies
	 */
	clearStudyData = action(() => {
		this.timelineParsed = false;
		this.patients = [];
		this.sampleStructure = {};
		this.timepointStructure.clear();
		this.staticMappers = {};
		this.eventMappers = {};
		this.clinicalPatientCategories.clear();
		this.clinicalSampleCategories.clear();
	});

	/**
	 * Parses timeline data from events using DataParsingService.
	 * Applies parsed results to MobX observables.
	 * @param {Object} events - map of patient ID to event arrays
	 */
	applyTimelineData = (events) => {
		// Delegate pure parsing to service
		const { timepointStructure, sampleStructure, sampleTimelineMap, filteredPatients } =
			DataParsingService.buildTimelineStructure(this.patients, events);

		// Assign results to observables
		this.patients = filteredPatients;
		this.sampleStructure = sampleStructure;
		this.sampleTimelineMap = sampleTimelineMap;
		this.timepointStructure.replace(timepointStructure);

		// Build event block structure and create event variables
		const eventBlockStructure = DataParsingService.buildEventBlockStructure(timepointStructure);
		const { eventTimelineMap, eventAttributes, eventMappers } =
			DataParsingService.createEventVariables(events, eventBlockStructure, sampleTimelineMap);

		this.allEvents = events;
		this.eventTimelineMap = eventTimelineMap;
		this.eventAttributes = eventAttributes;
		this.eventMappers = eventMappers;

		// Create time gap mapping
		this.staticMappers[this.timeDistanceId] =
			DataParsingService.createTimeGapMapping(filteredPatients, sampleStructure, sampleTimelineMap);

		this.timelineParsed = true;
	};

	/**
	 * Parses timeline data
	 * @param {Object} study
	 * @param {loadFinishedCallback} callback
	 */
	parseTimeline = (study, callback) => {
		this.study = study;
		if (this.isOwnData) {
			this.api = new FileAPI(this.localFileLoader, this.geneNamesAPI);
		} else {
			this.api = new CBioAPI(this.study.studyId, this.cBioLink);
			this.geneNamesAPI.geneList = {};
		}
		this.staticMappers = {};
		this.eventMappers = {};

		this.clinicalPatientCategories.clear();
		this.clinicalSampleCategories.clear();
		this.hasClinical = false;
		this.dataParsed = false;
		this.timelineParsed = false;
		this.api.getPatients((patients) => {
			this.patients = patients;
			this.api.getEvents(
				patients,
				action((events) => {
					this.applyTimelineData(events);
					callback();
				}),
				this.studyAPI.accessTokenFromUser
			);
		}, this.studyAPI.accessTokenFromUser);
	};

	/**
	 * Applies parsed clinical sample data to MobX observables.
	 * @param {Object[]} data - raw clinical sample data
	 */
	applyClinicalSampleData = (data) => {
		const { clinicalSampleCategories, sampleMappers } =
			DataParsingService.createClinicalSampleMapping(data, this.patients, this.sampleStructure);

		clinicalSampleCategories.forEach((cat) => this.clinicalSampleCategories.push(cat));
		Object.assign(this.staticMappers, sampleMappers);

		this.scoreStore.calculateVScore();
		this.scoreStore.calculateVScoreWithinTimeLine();
	};

	/**
	 * Applies parsed clinical patient data to MobX observables.
	 * @param {Object[]} data - raw clinical patient data
	 */
	applyClinicalPatientData = (data) => {
		const { clinicalPatientCategories, patientMappers, sampleMappers } =
			DataParsingService.createClinicalPatientMappers(data, this.patients, this.sampleStructure);

		clinicalPatientCategories.forEach((cat) => this.clinicalPatientCategories.push(cat));
		Object.assign(this.staticMappers, sampleMappers);
		Object.assign(this.patientMappers, patientMappers);
	};

	/**
	 *  gets variable data and sets parameters
	 *  @param {loadFinishedCallback} callback
	 */
	parseCBio = (callback) => {
		this.api.getAvailableMolecularProfiles((profiles) => {
			this.availableProfiles = profiles;
			this.api.getClinicalSampleData((sampleData) => {
				this.applyClinicalSampleData(sampleData);
				if (sampleData.length !== 0) {
					this.initialVariable = this.clinicalSampleCategories[0];
					this.hasClinical = true;
				}
				this.api.getClinicalPatientData(
					action((patientData) => {
						this.applyClinicalPatientData(patientData);
						if (patientData.length !== 0) {
							if (!this.hasClinical) {
								this.initialVariable = this.clinicalPatientCategories[0];
								this.initialVariable.source = 'clinPatient';
							}
							this.hasClinical = true;
						}
						this.dataStore.initialize();
						this.firstLoad = false;
						this.dataParsed = true;
						this.visStore.fitToScreenHeight();
						this.visStore.fitToScreenWidth();
						if (this.hasClinical) {
							this.addInitialVariable();
						}
						callback();
					}),
					this.studyAPI.accessTokenFromUser
				);
			}, this.studyAPI.accessTokenFromUser);
		}, this.studyAPI.accessTokenFromUser);
	};

	/**
	 * updates the timepoint structure after patients are moved up or down
	 * @param {string[]} patients - patients to be moved
	 * @param {number} timepoint - index of timepoint that is moved
	 * @param {boolean} up - up movement (true) or down movement (false)
	 */
	updateTimepointStructure = (patients, timepoint, up) => {
		const oldSampleTimepointNames = this.dataStore.variableStores.sample.childStore.timepoints.map((d) => d.name);
		let timepointStructure = toJS(this.timepointStructure);
		if (!up) {
			// down movement
			timepointStructure = timepointStructure.reverse();
		}
		for (let i = 0; i < timepointStructure.length; i += 1) {
			patients.forEach((patient) => {
				const currIndex = timepointStructure[i].map((d) => d.patient).indexOf(patient);
				if (i !== 0) {
					if (currIndex !== -1) {
						const prevIndex = timepointStructure[i - 1].map((d) => d.patient).indexOf(patient);
						if (prevIndex === -1) {
							timepointStructure[i - 1].push(timepointStructure[i][currIndex]);
						} else {
							timepointStructure[i - 1][prevIndex] = timepointStructure[i][currIndex];
						}
						timepointStructure[i].splice(currIndex, 1);
					}
				} else if (currIndex !== -1) {
					timepointStructure.unshift([timepointStructure[i][currIndex]]);
				}
			});
		}
		if (timepointStructure[timepointStructure.length - 1].length === 0) {
			timepointStructure.splice(timepointStructure.length - 1, 1);
		}
		if (!timepointStructure.map((d) => d.length).includes(0)) {
			if (!up) {
				timepointStructure.reverse();
			}
			this.timepointStructure.replace(timepointStructure);
		}
		this.dataStore.update(this.dataStore.timepoints[timepoint].heatmapOrder.slice());
		this.dataStore.variableStores.sample.childStore.updateNames(
			DataParsingService.createNameList(this.timepointStructure, up, oldSampleTimepointNames, patients)
		);
		this.visStore.resetTransitionSpaces();
	};

	/**
	 * gets block structure for events (delegates to DataParsingService)
	 * @returns {Object[][]}
	 */
	get eventBlockStructure() {
		return DataParsingService.buildEventBlockStructure(this.timepointStructure);
	}

	/**
	 * get first and last date for every patient and the state of survival if available
	 * @return {object}
	 */
	get minMax() {
		const minMax = {};
		const survivalEvents = DataParsingService.computeSurvival(
			this.clinicalPatientCategories,
			this.sampleStructure,
			this.staticMappers
		);
		Object.keys(this.sampleStructure).forEach((patient) => {
			let status;
			let max = Math.max(...this.sampleStructure[patient].map((d) => this.sampleTimelineMap[d]));
			Object.values(this.eventTimelineMap).forEach((value) => {
				max = Math.max(
					max,
					Math.max(...value.filter((d) => d.patientId === patient).map((d) => d.eventEndDate))
				);
			});
			if (survivalEvents.map((d) => d.patient).includes(patient)) {
				const survivalEvent = survivalEvents.filter((d) => d.patient === patient)[0];
				if (survivalEvent.date > max) {
					max = survivalEvent.date;
					status = survivalEvent.status;
				}
			}
			minMax[patient] = { start: 0, end: max, status };
		});
		return minMax;
	}

	/**
	 * get maximum date of all patients
	 * @return {number}
	 */
	get maxTimeInDays() {
		let max = 0;
		Object.keys(this.minMax).forEach((patient) => {
			if (this.minMax[patient].end > max) {
				max = this.minMax[patient].end;
			}
		});
		return max;
	}

	/**
	 * returns the mutations profile of a study if available, returns null if there is none
	 * @return {object|null}
	 */
	get mutationProfile() {
		const filteredProfiles = this.availableProfiles.filter(
			(d) => d.molecularAlterationType === 'MUTATION_EXTENDED'
		);
		let muationProfile = null;
		if (filteredProfiles.length > 0) {
			muationProfile = filteredProfiles[0];
		}
		return muationProfile;
	}

	/**
	 * checks if a study includes profile data
	 * @return {boolean}
	 */
	get hasProfileData() {
		return this.availableProfiles.length > 0;
	}

	get cBioLink() {
		return this.studyAPI.allLinks[this.uiStore.cBioInstance];
	}

	/**
	 * adds variable in the beginning or after reset
	 * add all sample variable in the beginning
	 */
	addInitialVariable() {
		const sampleOptions = this.clinicalSampleCategories.filter(
			(category) =>
				!this.dataStore.variableStores.sample.fullCurrentVariables.map((d) => d.id).includes(category.id)
		);

		let eventOptions = [];
		Object.keys(this.eventAttributes)
			.filter((d) => d !== 'SPECIMEN')
			.forEach((cate) => {
				Object.keys(this.eventAttributes[cate]).forEach((key) => {
					const subOptions = this.eventAttributes[cate][key].map((d) => ({
						...d,
						category: cate,
						profile: `event`,
					}));

					eventOptions = eventOptions.concat(subOptions);
				});
			});

		// add all sample variable
		sampleOptions.forEach((d) => {
			this.dataStore.variableStores.sample.addVariableToBeDisplayed(
				new OriginalVariable(
					d.id,
					d.variable,
					d.datatype,
					d.description,
					[],
					[],
					this.staticMappers[d.id],
					d.source,
					'clinical'
				)
			);
		});

		this.dataStore.autoGroup();
		this.dataStore.applyCustomGroups();
	}

	setEvents(events) {
		this.allEvents = events;
	}
}

export default RootStore;
