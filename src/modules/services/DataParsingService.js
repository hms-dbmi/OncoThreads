import { isNumeric } from '../UtilityClasses';

/**
 * Service class with static methods for pure data parsing and transformation.
 * Extracted from RootStore to separate concerns: data transformation (here)
 * vs. MobX state management (RootStore).
 *
 * All methods are pure functions: they take explicit inputs and return results
 * without mutating external state.
 */
class DataParsingService {
	/**
	 * Builds timepoint structure, sample structure, and sample timeline map from events.
	 * @param {string[]} patients - patient IDs
	 * @param {Object} events - map of patient ID to event arrays
	 * @returns {{ timepointStructure: Object[][], sampleStructure: Object, sampleTimelineMap: Object, filteredPatients: string[] }}
	 */
	static buildTimelineStructure(patients, events) {
		const timepointStructure = [];
		const sampleStructure = {};
		const sampleTimelineMap = {};
		const toDelete = [];

		patients.forEach((patient, i) => {
			sampleStructure[patient] = [];
			let currTP = 0;
			const sampleEvents = events[patient].filter((event) => event.eventType === 'SPECIMEN');

			const chooseRandom = (samples) => {
				const chosenSample = samples[Math.floor(Math.random() * samples.length)];
				sampleStructure[patient].push(chosenSample);
				if (timepointStructure.length <= currTP) {
					timepointStructure.push([]);
				}
				timepointStructure[currTP].push({ patient, sample: chosenSample });
			};

			if (new Set(sampleEvents.map((d) => d.startNumberOfDaysSinceDiagnosis)).size > 0) {
				let currSamples = [];
				let previousDate = sampleEvents[0].startNumberOfDaysSinceDiagnosis;
				sampleEvents.forEach((e, j) => {
					const sampleId = e.attributes.filter((d) => d.key === 'SAMPLE_ID')[0].value;
					sampleTimelineMap[sampleId] = e.startNumberOfDaysSinceDiagnosis;
					if (e.startNumberOfDaysSinceDiagnosis !== previousDate) {
						chooseRandom(currSamples);
						currTP += 1;
						currSamples = [sampleId];
					} else {
						currSamples.push(sampleId);
					}
					if (j === sampleEvents.length - 1) {
						chooseRandom(currSamples);
						currSamples = [];
					}
					previousDate = e.startNumberOfDaysSinceDiagnosis;
				});
			} else {
				toDelete.push(i);
			}
		});

		// Filter out patients with no sample events
		const filteredPatients = patients.filter((_, i) => !toDelete.includes(i));

		return { timepointStructure, sampleStructure, sampleTimelineMap, filteredPatients };
	}

	/**
	 * Computes the event block structure from a timepoint structure.
	 * Equivalent to the `eventBlockStructure` computed property in RootStore.
	 * @param {Object[][]} timepointStructure
	 * @returns {Object[][]}
	 */
	static buildEventBlockStructure(timepointStructure) {
		if (!timepointStructure || timepointStructure.length === 0) {
			return [];
		}

		const eventBlockStructure = [];
		eventBlockStructure.push(timepointStructure[0].slice());
		for (let i = 1; i < timepointStructure.length; i += 1) {
			const newEntry = timepointStructure[i].slice();
			timepointStructure[i - 1].forEach((d) => {
				if (!timepointStructure[i].map((f) => f.patient).includes(d.patient)) {
					newEntry.push({ patient: d.patient, sample: `${d.sample}_post` });
				}
			});
			eventBlockStructure.push(newEntry);
		}
		eventBlockStructure.push(
			timepointStructure[timepointStructure.length - 1].map((d) => ({
				sample: `${d.sample}_post`,
				patient: d.patient,
			}))
		);
		return eventBlockStructure;
	}

	/**
	 * Creates event variables, timeline maps, and event mappers from raw events.
	 * @param {Object} events - map of patient ID to event arrays
	 * @param {Object[][]} eventBlockStructure
	 * @param {Object} sampleTimelineMap
	 * @returns {{ eventTimelineMap: Object, eventAttributes: Object, eventMappers: Object }}
	 */
	static createEventVariables(events, eventBlockStructure, sampleTimelineMap) {
		const eventTimelineMap = {};
		const eventAttributes = {};
		const eventMappers = {};

		Object.keys(events).forEach((patient) => {
			const samples = [];
			eventBlockStructure.forEach((g) => {
				g.forEach((l) => {
					if (l.patient === patient) {
						samples.push(l.sample);
					}
				});
			});

			events[patient].forEach((event) => {
				if (!(event.eventType in eventAttributes)) {
					eventAttributes[event.eventType] = {};
				}
				event.attributes.forEach((attribute) => {
					if (!(attribute.key in eventAttributes[event.eventType])) {
						eventAttributes[event.eventType][attribute.key] = [];
					}
					const valueId = `${event.eventType}_${attribute.key}_${attribute.value}`;
					if (!(valueId in eventMappers)) {
						eventTimelineMap[valueId] = [];
						eventAttributes[event.eventType][attribute.key].push({
							name: attribute.value,
							id: valueId,
						});
						eventMappers[valueId] = {};
						eventBlockStructure.forEach((g) => {
							g.forEach((l) => {
								eventMappers[valueId][l.sample] = false;
							});
						});
					}
					samples.forEach((sampleId, idx) => {
						let currentStart = Number.NEGATIVE_INFINITY;
						let currentEnd = Number.POSITIVE_INFINITY;
						if (idx > 0) {
							currentStart = sampleTimelineMap[samples[idx - 1]];
							if (idx < samples.length - 2) {
								currentEnd = sampleTimelineMap[sampleId];
							}
						} else {
							currentEnd = sampleTimelineMap[sampleId];
						}
						if (DataParsingService.isInCurrentRange(event, currentStart, currentEnd)) {
							eventMappers[valueId][sampleId] = true;
							const start = event.startNumberOfDaysSinceDiagnosis;
							let end = start;
							if ('endNumberOfDaysSinceDiagnosis' in event) {
								end = event.endNumberOfDaysSinceDiagnosis;
							}
							eventTimelineMap[valueId].push({
								time: idx,
								patientId: patient,
								sampleId,
								eventStartDate: start,
								eventEndDate: end,
							});
						}
					});
				});
			});
		});

		return { eventTimelineMap, eventAttributes, eventMappers };
	}

	/**
	 * Creates a time gap mapping between consecutive samples for each patient.
	 * @param {string[]} patients
	 * @param {Object} sampleStructure
	 * @param {Object} sampleTimelineMap
	 * @returns {Object} timeGapMapping - sampleId to time gap value
	 */
	static createTimeGapMapping(patients, sampleStructure, sampleTimelineMap) {
		const timeGapMapping = {};
		patients.forEach((d) => {
			const curr = sampleStructure[d];
			for (let i = 1; i < curr.length; i += 1) {
				if (i === 1) {
					timeGapMapping[curr[i - 1]] = undefined;
				}
				timeGapMapping[curr[i]] = sampleTimelineMap[curr[i]] - sampleTimelineMap[curr[i - 1]];
			}
			timeGapMapping[`${curr[curr.length - 1]}_post`] = undefined;
		});
		return timeGapMapping;
	}

	/**
	 * Creates clinical sample categories and sample mappers from raw clinical data.
	 * @param {Object[]} data - raw clinical sample data
	 * @param {string[]} patients
	 * @param {Object} sampleStructure
	 * @returns {{ clinicalSampleCategories: Object[], sampleMappers: Object }}
	 */
	static createClinicalSampleMapping(data, patients, sampleStructure) {
		const clinicalSampleCategories = [];
		const sampleMappers = {};

		data.forEach((d) => {
			if (patients.includes(d.patientId)) {
				if (!(d.clinicalAttributeId in sampleMappers)) {
					clinicalSampleCategories.push({
						id: d.clinicalAttributeId,
						variable: d.clinicalAttribute.displayName,
						datatype: d.clinicalAttribute.datatype,
						description: d.clinicalAttribute.description,
						source: 'clinSample',
					});
					sampleMappers[d.clinicalAttributeId] = {};
				}
			}
			if (sampleStructure[d.patientId] && sampleStructure[d.patientId].includes(d.sampleId)) {
				if (!isNumeric(d.clinicalAttribute.datatype)) {
					sampleMappers[d.clinicalAttributeId][d.sampleId] = d.value;
				} else {
					sampleMappers[d.clinicalAttributeId][d.sampleId] = parseFloat(d.value);
				}
			}
		});

		return { clinicalSampleCategories, sampleMappers };
	}

	/**
	 * Creates clinical patient categories, patient mappers, and sample mappers from raw clinical data.
	 * @param {Object[]} data - raw clinical patient data
	 * @param {string[]} patients
	 * @param {Object} sampleStructure
	 * @returns {{ clinicalPatientCategories: Object[], patientMappers: Object, sampleMappers: Object }}
	 */
	static createClinicalPatientMappers(data, patients, sampleStructure) {
		const clinicalPatientCategories = [];
		const sampleMappers = {};
		const patientMappers = {};

		data.forEach((d) => {
			if (patients.includes(d.patientId)) {
				if (!(d.clinicalAttributeId in sampleMappers)) {
					clinicalPatientCategories.push({
						id: d.clinicalAttributeId,
						variable: d.clinicalAttribute.displayName,
						datatype: d.clinicalAttribute.datatype,
						description: d.clinicalAttribute.description,
						source: 'clinPatient',
					});
					sampleMappers[d.clinicalAttributeId] = {};
				}

				if (patientMappers[d.clinicalAttributeId] === undefined) {
					patientMappers[d.clinicalAttributeId] = {};
				}
				patientMappers[d.clinicalAttributeId][d.patientId] = parseFloat(d.value) || d.value;
			}
			if (sampleStructure[d.patientId]) {
				sampleStructure[d.patientId].forEach((f) => {
					if (!isNumeric(d.clinicalAttribute.datatype)) {
						sampleMappers[d.clinicalAttributeId][f] = d.value;
					} else {
						sampleMappers[d.clinicalAttributeId][f] = parseFloat(d.value);
					}
				});
			}
		});

		return { clinicalPatientCategories, patientMappers, sampleMappers };
	}

	/**
	 * Computes survival events from clinical patient data.
	 * @param {Object[]} clinicalPatientCategories
	 * @param {Object} sampleStructure
	 * @param {Object} staticMappers
	 * @returns {Object[]}
	 */
	static computeSurvival(clinicalPatientCategories, sampleStructure, staticMappers) {
		const survivalMonths = 'OS_MONTHS';
		const survivalStatus = 'OS_STATUS';
		const survivalEvents = [];
		const hasStatus = clinicalPatientCategories.map((d) => d.id).includes(survivalStatus);
		if (clinicalPatientCategories.map((d) => d.id).includes(survivalMonths)) {
			Object.keys(sampleStructure).forEach((patient) => {
				let status;
				if (hasStatus) {
					status = staticMappers[survivalStatus][sampleStructure[patient][0]];
				}
				survivalEvents.push({
					patient,
					date: staticMappers[survivalMonths][sampleStructure[patient][0]] * 30,
					status,
				});
			});
		}
		return survivalEvents;
	}

	/**
	 * Checks if an event occurred within a specific time range.
	 * @param {Object} event
	 * @param {number} currMinDate
	 * @param {number} currMaxDate
	 * @returns {boolean}
	 */
	static isInCurrentRange(event, currMinDate, currMaxDate) {
		let isInRange = false;
		if ('endNumberOfDaysSinceDiagnosis' in event) {
			isInRange =
				(event.endNumberOfDaysSinceDiagnosis <= currMaxDate &&
					event.endNumberOfDaysSinceDiagnosis > currMinDate) ||
				(event.startNumberOfDaysSinceDiagnosis < currMaxDate &&
					event.startNumberOfDaysSinceDiagnosis >= currMinDate);
		} else {
			isInRange =
				event.startNumberOfDaysSinceDiagnosis < currMaxDate &&
				event.startNumberOfDaysSinceDiagnosis >= currMinDate;
		}
		return isInRange;
	}

	/**
	 * Adapts timepoint names after patients are moved up or down.
	 * @param {Object[][]} timepointStructure
	 * @param {boolean} up
	 * @param {string[]} oldNames
	 * @param {string[]} patients
	 * @returns {string[]}
	 */
	static createNameList(timepointStructure, up, oldNames, patients) {
		const newNames = oldNames;
		if (timepointStructure.length > oldNames.length) {
			if (up) {
				newNames.unshift('new');
			} else {
				newNames.push('new');
			}
		} else if (timepointStructure.length < oldNames.length) {
			if (up) {
				newNames.pop();
			} else {
				newNames.shift();
			}
		} else {
			const longestPatientTimeline = patients.every(
				(patient) =>
					timepointStructure.filter((row) => row.map((d) => d.patient).includes(patient)).length ===
					timepointStructure.length
			);
			if (longestPatientTimeline) {
				if (up) {
					newNames.unshift('new');
					newNames.pop();
				} else {
					newNames.push('new');
					newNames.shift();
				}
			}
		}
		return newNames;
	}
}

export default DataParsingService;
