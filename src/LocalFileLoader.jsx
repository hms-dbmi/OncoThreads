import * as Papa from 'papaparse';
import { action, makeObservable, observable, computed, reaction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import { message } from 'antd';
import { isNumeric } from 'modules/UtilityClasses';

/**
 * Signals that a file has finished loading
 *
 * @callback loadFinishedCallback
 */

/**
 * Returns data when file is loaded
 * @param {*} data
 * @callback returnDataCallback
 */

/**
 * Returns a new file based on the old file
 * @param {File} new file
 * @callback replacedFileCallback
 */

/**
 * Loads local files provided by the user
 */
class LocalFileLoader {
	patients = []; // all patients contained in the timeline SPECIMEN file
	samples = []; // all samples contained in the timeline SPECIMEN file
	samplePatientMap = {};
	mutations = []; // array of mutation objects
	mutationCounts = []; // array of mutation counts
	eventFiles = new Map(); // map of event files
	profileData = new Map(); // map of molecular data
	clinicalSampleFile = null; // file containing clinical sample data
	clinicalPatientFile = null; // file containing clinical patient data
	molecularProfiles = []; // all available molecular profiles
	panelMatrix = {};
	genePanels = new Map();

	// states reflecting the load status of the different types of files:
	// empty, loading, finished, or error
	parsingStatus = {
		events: 'empty',
		mutations: 'empty',
		molecular: 'empty',
		clinicalPatient: 'empty',
		clinicalSample: 'empty',
		panelMatrix: 'empty',
		genePanels: 'empty',
	};

	// Progress tracking (0-100) for each file type
	parseProgress = {
		events: 0,
		mutations: 0,
		molecular: 0,
		clinicalPatient: 0,
		clinicalSample: 0,
		panelMatrix: 0,
		genePanels: 0,
	};

	// Error messages for each file type
	parseErrors = {
		events: null,
		mutations: null,
		molecular: null,
		clinicalPatient: null,
		clinicalSample: null,
		panelMatrix: null,
		genePanels: null,
	};

	constructor() {
		makeObservable(this, {
			parsingStatus: observable,
			parseProgress: observable,
			parseErrors: observable,
			dataLoading: computed,
			dataHasErrors: computed,
			dataReady: computed,
			setEventsParsed: action,
			setMutationsParsed: action,
			setMolecularParsed: action,
			setClinicalPatientParsed: action,
			setClinicalSampleParsed: action,
			setPanelMatrixParsed: action,
			setGenePanelsParsed: action,
			setEventFiles: action,
			setPatientsAndSamples: action,
			setMutations: action,
			loadEventFile: action,
			loadEvents: action,
			setClinicalFile: action,
			loadClinicalFile: action,
			loadClinicalBody: action,
			setMolecularFiles: action,
			setMolecular: action,
			setGenePanelMatrix: action,
			setGenePanels: action,
			setProgress: action,
			setError: action,
		});

		// reactions to errors or removal of files:
		// clears data fields if there is an error or the file is removed
		reaction(
			() => this.parsingStatus.events,
			(parsed) => {
				if (parsed === 'error' || parsed === 'empty') {
					this.eventFiles.clear();
				}
			}
		);
		reaction(
			() => this.parsingStatus.mutations,
			(parsed) => {
				if (parsed === 'error' || parsed === 'empty') {
					this.mutations = [];
				}
			}
		);
		reaction(
			() => this.parsingStatus.molecular,
			(parsed) => {
				if (parsed === 'error' || parsed === 'empty') {
					const spliceIndices = [];
					this.molecularProfiles.forEach((profile, i) => {
						if (profile.molecularAlterationType === 'COPY_NUMBER_ALTERATION') {
							spliceIndices.push(i);
							this.profileData.delete(profile.molecularProfileId);
						}
					});
					for (let i = spliceIndices.length - 1; i >= 0; i -= 1) {
						this.molecularProfiles.splice(spliceIndices[i], 1);
					}
				}
			}
		);
		reaction(
			() => this.parsingStatus.clinicalSample,
			(parsed) => {
				if (parsed === 'error' || parsed === 'empty') {
					this.clinicalSampleFile = null;
				}
			}
		);
		reaction(
			() => this.parsingStatus.clinicalPatient,
			(parsed) => {
				if (parsed === 'error' || parsed === 'empty') {
					this.clinicalPatientFile = null;
				}
			}
		);
		reaction(
			() => this.parsingStatus.panelMatrix,
			(parsed) => {
				if (parsed === 'empty') {
					this.panelMatrix = {};
				} else if (
					parsed === 'finished' &&
					(this.parsingStatus.genePanels === 'finished' ||
						(this.parsingStatus.genePanels === 'error' && this.genePanels.size > 0))
				) {
					let broke = false;
					Object.keys(this.panelMatrix).every((sample) => {
						Object.keys(this.panelMatrix[sample]).every((key) => {
							if (
								!this.genePanels.has(this.panelMatrix[sample][key]) &&
								this.panelMatrix[sample][key] !== 'NA'
							) {
								action(() => {
									this.parsingStatus.genePanels = 'error';
									this.parsingStatus.panelMatrix = 'error';
								})();
								message.error({
									content: "Gene panel IDs don't match panel matrix. Please check your data files.",
									duration: 8,
								});
								broke = true;
								return false;
							}
							return true;
						});
						return !broke;
					});
					if (!broke) {
						action(() => {
							this.parsingStatus.genePanels = 'finished';
						})();
					}
				}
			}
		);
		reaction(
			() => this.parsingStatus.genePanels,
			(parsed) => {
				if (parsed === 'empty') {
					this.genePanels.clear();
				} else if (
					parsed === 'finished' &&
					(this.parsingStatus.panelMatrix === 'finished' ||
						(this.parsingStatus.panelMatrix === 'error' &&
							Object.keys(this.parsingStatus.panelMatrix).length > 0))
				) {
					let broke = false;
					Object.keys(this.panelMatrix).every((sample) => {
						Object.keys(this.panelMatrix[sample]).every((key) => {
							if (
								!this.genePanels.has(this.panelMatrix[sample][key]) &&
								this.panelMatrix[sample][key] !== 'NA'
							) {
								action(() => {
									this.parsingStatus.genePanels = 'error';
									this.parsingStatus.panelMatrix = 'error';
								})();
								message.error({
									content: "Gene panel IDs don't match panel matrix. Please check your data files.",
									duration: 8,
								});
								broke = true;
								return false;
							}
							return true;
						});
						return !broke;
					});
					if (!broke) {
						action(() => {
							this.parsingStatus.panelMatrix = 'finished';
						})();
					}
				}
			}
		);
	}

	/**
	 * is any of the files currently loading
	 * @returns {boolean}
	 */
	get dataLoading() {
		return Object.values(this.parsingStatus).some((value) => value === 'loading');
	}

	/**
	 * were there errors during the file parsing
	 * @returns {boolean}
	 */
	get dataHasErrors() {
		return Object.values(this.parsingStatus).some((value) => value === 'error');
	}

	/**
	 * is data ready to be displayed
	 * @returns {boolean}
	 */
	get dataReady() {
		return (
			!this.dataLoading &&
			!this.dataHasErrors &&
			this.parsingStatus.events === 'finished' &&
			(this.parsingStatus.mutations === 'finished' ||
				this.parsingStatus.clinicalSample === 'finished' ||
				this.parsingStatus.clinicalPatient === 'finished' ||
				this.parsingStatus.molecular === 'finished') &&
			this.parsingStatus.genePanels === this.parsingStatus.panelMatrix
		);
	}

	setEventsParsed = (loadingState) => {
		this.parsingStatus.events = loadingState;
	};

	setMutationsParsed = (loadingState) => {
		this.parsingStatus.mutations = loadingState;
	};

	setMolecularParsed = (loadingState) => {
		this.parsingStatus.molecular = loadingState;
	};

	setClinicalPatientParsed = (loadingState) => {
		this.parsingStatus.clinicalPatient = loadingState;
	};

	setClinicalSampleParsed = (loadingState) => {
		this.parsingStatus.clinicalSample = loadingState;
	};

	setPanelMatrixParsed = (loadingState) => {
		this.parsingStatus.panelMatrix = loadingState;
	};

	setGenePanelsParsed = (loadingState) => {
		this.parsingStatus.genePanels = loadingState;
	};

	/**
	 * sets current event files if headers are correct
	 * and file of type SPECIMEN is contained
	 * @param {FileList} files: all event files
	 * @param {loadFinishedCallback} callback
	 */
	setEventFiles = (files, callback) => {
		const eventFiles = new Map();
		this.parsingStatus.events = 'loading';
		Array.from(files).forEach((d) => {
			Papa.parse(d, {
				delimiter: '\t',
				header: true,
				worker: true,
				skipEmptyLines: true,
				step: (row, parser) => {
					// check header
					if (LocalFileLoader.checkTimelineFileHeader(row.data.EVENT_TYPE, row.meta.fields, d.name)) {
						eventFiles.set(row.data.EVENT_TYPE, d);
					} else {
						action(() => {
							this.parsingStatus.events = 'error';
						})();
						parser.abort();
					}
				},
				complete: () => {
					// all file headers have been checked and are valid
					if (eventFiles.size === files.length) {
						// one of the files has to be of eventType SPECIMEN
						if (eventFiles.has('SPECIMEN')) {
							this.setPatientsAndSamples(eventFiles.get('SPECIMEN'), () => {
								this.eventFiles = eventFiles;
								action(() => {
									this.parsingStatus.events = 'finished';
								})();
								callback();
							});
						} else {
							action(() => {
								this.parsingStatus.events = 'error';
							})();
							message.error({
								content: 'Required timeline file with EVENT_TYPE SPECIMEN is missing',
								duration: 8,
							});
						}
					}
				},
			});
		});
	};

	/**
	 * sets patients and samples
	 * @param {File} file
	 * @param {loadFinishedCallback} callback
	 */
	setPatientsAndSamples = (file, callback) => {
		let dateCorrect = true;
		const patients = [];
		const samples = [];
		Papa.parse(file, {
			delimiter: '\t',
			header: true,
			worker: true,
			skipEmptyLines: true,
			step: (row, parser) => {
				if (!patients.includes(row.data.PATIENT_ID)) {
					patients.push(row.data.PATIENT_ID);
				}
				if (!samples.includes(row.data.SAMPLE_ID)) {
					samples.push(row.data.SAMPLE_ID);
					this.samplePatientMap[row.data.SAMPLE_ID] = row.data.PATIENT_ID;
				}
				const date = parseInt(row.data.START_DATE, 10);
				if (Number.isNaN(date)) {
					message.error({
						content: 'START_DATE must be a numeric value',
						duration: 7,
					});
					action(() => {
						this.parsingStatus.events = 'error';
					})();
					dateCorrect = false;
					parser.abort();
				}
			},
			complete: () => {
				if (dateCorrect) {
					this.patients = patients;
					this.samples = samples;
					callback();
				}
			},
		});
	};

	/**
	 * creates array containing all mutations
	 * @param {File} file
	 */
	setMutations = (file) => {
		const skipMutations = ['Silent', 'Intron', "3'UTR", "3'Flank", "5'UTR", "5'Flank", 'IGR', 'RNA']; // mutations to be skipped according to cBio docs
		// are columns for variant allele frequency contained in the files
		let hasVaf = false;
		let firstRow = true;
		let aborted = false;
		let inconsistentLinebreaks = false;
		const mutations = []; // data array for mutations
		const counts = {}; // object for storing mutation counts
		this.parsingStatus.mutations = 'loading';
		Papa.parse(file, {
			delimiter: '\t',
			header: true,
			worker: true,
			skipEmptyLines: true,
			step: (row, parser) => {
				if (row.errors.length === 0) {
					if (firstRow) {
						// check header when parsing first row
						if (LocalFileLoader.checkMutationFileHeader(row.meta.fields, file.name)) {
							if ('t_ref_count' in row.data && 't_alt_count' in row.data) {
								hasVaf = true;
							}
							if ('VAF' in row.data) {
								hasVaf = true;
							}
							firstRow = false;
						} else {
							action(() => {
								this.parsingStatus.mutations = 'error';
							})();
							aborted = true;
							parser.abort();
						}
					}
					// add mutation if it's not in the list of excluded mutations
					if (!aborted && !skipMutations.includes(row.data.Variant_Classification)) {
						const mutation = {
							sampleId: row.data.Tumor_Sample_Barcode,
							proteinChange: row.data.HGVSp_Short.substring(2),
							gene: {
								hugoGeneSymbol: row.data.Hugo_Symbol,
							},
							mutationType: row.data.Variant_Classification,
						};
						if (hasVaf) {
							if (row.data.VAF) {
								mutation.VAF = row.data.VAF;
							} else {
								mutation.tumorAltCount = row.data.t_alt_count;
								mutation.tumorRefCount = row.data.t_ref_count;
							}
						} else {
							mutation.tumorAltCount = -1;
							mutation.tumorRefCount = -1;
						}
						mutations.push(mutation);
						if (!(row.data.Tumor_Sample_Barcode in counts)) {
							counts[row.data.Tumor_Sample_Barcode] = 0;
						}
						counts[row.data.Tumor_Sample_Barcode] += 1;
					}
				} else {
					inconsistentLinebreaks = LocalFileLoader.checkErrors(row.errors, row.data, file.name);
					aborted = true;
					parser.abort();
				}
			},
			complete: action(() => {
				if (!aborted) {
					this.molecularProfiles.push({
						molecularAlterationType: 'MUTATION_EXTENDED',
						name: 'Mutations',
						molecularProfileId: uuidv4(),
					});
					this.mutationCounts = this.samples.map((sample) => {
						let count = 0;
						if (sample in counts) {
							count = counts[sample];
						}
						return {
							clinicalAttribute: {
								displayName: 'Mutation Count',
								description: 'Mutation Count',
								datatype: 'NUMBER',
							},
							sampleId: sample,
							patientId: this.samplePatientMap[sample],
							clinicalAttributeId: 'MUTATION_COUNT',
							value: count,
						};
					});
					this.mutations = mutations;
					this.parsingStatus.mutations = 'finished';
					// if linebreaks are inconsistent replace them and retry
				} else if (inconsistentLinebreaks) {
					LocalFileLoader.replaceLinebreaks(file, (newFile) => {
						this.setMutations(newFile);
					});
				} else {
					this.parsingStatus.mutations = 'error';
				}
			}),
		});
	};

	/**
	 * loads an event file
	 * @param {File} file
	 * @param {loadFinishedCallback} callback
	 */
	loadEventFile = (file, callback) => {
		let aborted = false;
		let inconsistentLinebreak = false;
		let firstRow = true;
		let hasEndDate = false;
		const events = {};
		Papa.parse(file, {
			delimiter: '\t',
			header: true,
			worker: true,
			skipEmptyLines: true,
			step: (row, parser) => {
				if (row.errors.length === 0) {
					if (firstRow) {
						if ('STOP_DATE' in row.data) {
							hasEndDate = true;
						}
						firstRow = false;
					}
					if (!(row.data.PATIENT_ID in events)) {
						events[row.data.PATIENT_ID] = [];
					}
					const validStartDate = !Number.isNaN(parseInt(row.data.START_DATE, 10));
					const validEndDate =
						!hasEndDate ||
						row.data.STOP_DATE === '' ||
						(hasEndDate && !Number.isNaN(parseInt(row.data.STOP_DATE, 10)));
					if (validStartDate && validEndDate) {
						const attributes = [];
						Object.keys(row.data).forEach((key) => {
							if (
								key !== 'START_DATE' &&
								key !== 'STOP_DATE' &&
								key !== 'EVENT_TYPE' &&
								key !== 'PATIENT_ID'
							) {
								if (row.data[key].length > 0) {
									attributes.push({ key, value: row.data[key] });
								}
							}
						});
						const currRow = {
							attributes,
							eventType: row.data.EVENT_TYPE,
							patientId: row.data.PATIENT_ID,
							startNumberOfDaysSinceDiagnosis: parseInt(row.data.START_DATE, 10),
						};
						if (hasEndDate) {
							currRow.endNumberOfDaysSinceDiagnosis = parseInt(row.data.STOP_DATE, 10);
						}
						events[row.data.PATIENT_ID].push(currRow);
					} else {
						aborted = true;
						if (!validStartDate) {
							message.error({
								content: `File ${file.name}: START_DATE must be numeric`,
								duration: 8,
							});
						} else {
							message.error({
								content: `File ${file.name}: STOP_DATE must be numeric`,
								duration: 8,
							});
						}
						parser.abort();
					}
				} else {
					inconsistentLinebreak = LocalFileLoader.checkErrors(row.errors, row.data, file.name);
					aborted = true;
					parser.abort();
				}
			},
			complete: action(() => {
				if (!aborted) {
					Object.keys(events).forEach((patient) => {
						events[patient] = events[patient]
							.slice()
							.sort((a, b) => a.startNumberOfDaysSinceDiagnosis - b.startNumberOfDaysSinceDiagnosis);
					});
					callback(events);
				} else if (inconsistentLinebreak) {
					LocalFileLoader.replaceLinebreaks(file, (newFile) => {
						this.loadEventFile(newFile, callback);
					});
				} else {
					this.parsingStatus.events = 'error';
				}
			}),
		});
	};

	/**
	 * loads all events
	 * @param {returnDataCallback} callback
	 */
	loadEvents = (callback) => {
		const filePromises = [];
		this.eventFiles.forEach((d) => {
			filePromises.push(
				new Promise((resolve) => {
					this.loadEventFile(d, resolve);
				})
			);
		});
		Promise.all(filePromises).then((results) => {
			const events = {};
			results.forEach((fileEvents) => {
				Object.keys(fileEvents).forEach((patient) => {
					if (!(patient in events)) {
						events[patient] = fileEvents[patient];
					} else {
						events[patient].push(...fileEvents[patient]);
					}
				});
			});
			callback(events);
		});
	};

	/**
	 * sets the clinical file if the header is in the right format
	 * @param {File} file
	 * @param {boolean} isSample - sample related of patient related clinical data
	 */
	setClinicalFile = (file, isSample) => {
		if (isSample) {
			this.parsingStatus.clinicalSample = 'loading';
		} else {
			this.parsingStatus.clinicalPatient = 'loading';
		}

		let correctHeader = true;
		const errorMessages = [];
		let rowCounter = 0;
		Papa.parse(file, {
			delimiter: '\t',
			header: false,
			worker: true,
			skipEmptyLines: true,
			step: (row, parser) => {
				if (rowCounter === 0 && !row.data[0].startsWith('#')) {
					errorMessages.push('ERROR: wrong header format, first row has to start with #');
					correctHeader = false;
				} else if (rowCounter === 1 && !row.data[0].startsWith('#')) {
					errorMessages.push('ERROR: wrong header format, second row has to start with #');
					correctHeader = false;
				} else if (rowCounter === 2 && !row.data[0].startsWith('#')) {
					errorMessages.push('ERROR: wrong header format, third row has to start with #');
					correctHeader = false;
				} else if (rowCounter === 3 && !row.data[0].startsWith('#')) {
					errorMessages.push('ERROR: wrong header format, fourth row has to start with #');
					correctHeader = false;
				} else if (rowCounter === 4) {
					if (row.data[0].startsWith('#')) {
						errorMessages.push('ERROR: wrong header format, fifth row should not start with #');
						correctHeader = false;
					} else if (row.data.includes('PATIENT_ID')) {
						if (isSample && !row.data.includes('SAMPLE_ID')) {
							errorMessages.push('ERROR: no SAMPLE_ID column found');
							correctHeader = false;
						} else if (!isSample && row.data.includes('SAMPLE_ID')) {
							errorMessages.push('ERROR: SAMPLE_ID provided for non-sample specific clinical data');
							correctHeader = false;
						}
					} else {
						errorMessages.push('ERROR: No PATIENT_ID data column found');
						correctHeader = false;
					}
				} else if (rowCounter > 4) {
					if (errorMessages.length > 0) {
						message.error({
							content: errorMessages,
							duration: 10,
						});
					}
					parser.abort();
				}
				rowCounter += 1;
			},
			complete: action(() => {
				if (correctHeader) {
					if (isSample) {
						this.clinicalSampleFile = file;
						this.parsingStatus.clinicalSample = 'finished';
					} else {
						this.clinicalPatientFile = file;
						this.parsingStatus.clinicalPatient = 'finished';
					}
				} else if (isSample) {
					this.parsingStatus.clinicalSample = 'error';
				} else {
					this.parsingStatus.clinicalPatient = 'error';
				}
			}),
		});
	};

	/**
	 * Parse clinical data file header, then body
	 * @param {boolean} isSample - sample related or patient related clinical data
	 * @param {function} callback
	 */
	loadClinicalFile = (isSample, callback) => {
		const file = isSample ? this.clinicalSampleFile : this.clinicalPatientFile;
		if (file === null) {
			callback([]);
			return;
		}

		this._parseClinicalHeader(file).then(
			action((result) => {
				if (result.success) {
					this.loadClinicalBody(file, isSample, result.clinicalAttributes, callback);
				} else if (result.inconsistentLinebreaks) {
					LocalFileLoader.replaceLinebreaks(file, (newFile) => {
						if (isSample) {
							this.clinicalSampleFile = newFile;
						} else {
							this.clinicalPatientFile = newFile;
						}
						this.loadClinicalFile(isSample, callback);
					});
				} else if (isSample) {
					this.parsingStatus.clinicalSample = 'error';
				} else {
					this.parsingStatus.clinicalPatient = 'error';
				}
			})
		);
	};

	/**
	 * Parse clinical file header rows into clinicalAttributes map.
	 * Returns a Promise resolving to { success, clinicalAttributes, inconsistentLinebreaks }.
	 */
	_parseClinicalHeader = (file) => {
		return new Promise((resolve) => {
			const clinicalAttributes = {};
			const intermediateAttributes = [];
			let abort = false;
			let inconsistentLinebreaks = false;
			let rowCounter = 0;

			Papa.parse(file, {
				delimiter: '\t',
				worker: true,
				skipEmptyLines: true,
				step: (row, parser) => {
					if (row.errors.length === 0) {
						if (rowCounter === 0) {
							row.data.forEach((d, i) => {
								intermediateAttributes.push({
									displayName: LocalFileLoader.getSpliced(i, d),
								});
							});
						} else if (rowCounter === 1) {
							row.data.forEach((d, i) => {
								intermediateAttributes[i].description = LocalFileLoader.getSpliced(i, d);
							});
						} else if (rowCounter === 2) {
							row.data.forEach((d, i) => {
								intermediateAttributes[i].datatype = LocalFileLoader.getSpliced(i, d);
							});
						} else if (rowCounter === 4) {
							row.data.forEach((d, i) => {
								intermediateAttributes[i].clinicalAttributeId = LocalFileLoader.getSpliced(i, d);
								clinicalAttributes[d] = intermediateAttributes[i];
							});
							parser.abort();
						}
						rowCounter += 1;
					} else {
						inconsistentLinebreaks = LocalFileLoader.checkErrors(row.errors, row.data, file.name);
						abort = true;
						parser.abort();
					}
				},
				complete: () => {
					resolve({ success: !abort, clinicalAttributes, inconsistentLinebreaks });
				},
			});
		});
	};

	/**
	 * parses data rows of the clinical data file into an array of objects
	 * @param {File} file
	 * @param {boolean} isSample - sample related of patient related clinical data
	 * @param {object} clinicalAttributes - information about
	 * the column headers that is included in the resulting data array
	 * @param {returnDataCallback} callback
	 */
	loadClinicalBody = (file, isSample, clinicalAttributes, callback) => {
		const rows = [];
		let abort = false;
		let inconsistentLinebreaks = false;
		Papa.parse(file, {
			delimiter: '\t',
			header: true,
			worker: true,
			skipEmptyLines: true,
			comments: '#',
			step: (row, parser) => {
				if (row.errors.length === 0) {
					const patientId = row.data.PATIENT_ID;
					const sampleId = row.data.SAMPLE_ID;
					Object.keys(row.data).forEach((key) => {
						if (!(key === 'PATIENT_ID' || key === 'SAMPLE_ID') && row.data[key].trim() !== '') {
							if (isNumeric(clinicalAttributes[key].datatype)) {
								if (Number.isNaN(parseFloat(row.data[key]))) {
									abort = true;
									message.error({
										content: `File ${file.name}: Non-numeric value found for numeric variable "${key}"`,
										duration: 9,
									});
									parser.abort();
								}
							}
							const currRow = {
								clinicalAttribute: clinicalAttributes[key],
								clinicalAttributeId: clinicalAttributes[key].clinicalAttributeId,
								patientId,
								value: row.data[key],
							};
							if (isSample) {
								currRow.sampleId = sampleId;
							}
							rows.push(currRow);
						}
					});
				} else {
					inconsistentLinebreaks = LocalFileLoader.checkErrors(row.errors, row.data, file.name);
					abort = true;
					parser.abort();
				}
			},
			complete: action(() => {
				// only callback if there are no errors
				if (abort) {
					if (inconsistentLinebreaks) {
						if (isSample) {
							LocalFileLoader.replaceLinebreaks(file, (newFile) => {
								this.clinicalSampleFile = newFile;
								this.loadClinicalFile(isSample, callback);
							});
						} else {
							LocalFileLoader.replaceLinebreaks(file, (newFile) => {
								this.clinicalPatientFile = newFile;
								this.loadClinicalFile(isSample, callback);
							});
						}
					} else if (isSample) {
						this.parsingStatus.clinicalSample = 'error';
						this.clinicalSampleFile = null;
					} else {
						this.parsingStatus.clinicalPatient = 'error';
						this.clinicalPatientFile = null;
					}
				} else {
					callback(rows);
				}
			}),
		});
	};

	/**
	 * parse cnv data files
	 * @param {FileList} files - all cnv data files
	 * @param {string[]} metaData - datatypes and molecularAlteration types
	 */
	setMolecularFiles = (files, metaData) => {
		this.parsingStatus.molecular = 'loading';
		const filePromises = Array.from(files).map(
			(file, i) =>
				new Promise((resolve) => {
					this.setMolecular(file, metaData[i], resolve);
				})
		);
		Promise.all(filePromises).then(
			action(() => {
				this.parsingStatus.molecular = 'finished';
			})
		);
	};

	/**
	 * parses an molecular data file into an array of objects
	 * @param {File} file
	 * @param {loadFinishedCallback} callback
	 */
	setMolecular = (file, metaData, callback) => {
		let firstRow = true;
		let hasEntrezId;
		let hasHugoSymbol;
		let aborted = false;
		let inconsistentLinebreaks = false;
		const data = new Map();
		Papa.parse(file, {
			delimiter: '\t',
			header: true,
			worker: true,
			skipEmptyLines: true,
			step: (row, parser) => {
				if (row.errors.length === 0) {
					if (firstRow) {
						hasEntrezId = 'Entrez_Gene_Id' in row.data;
						hasHugoSymbol = 'Hugo_Symbol' in row.data;
						if (!hasEntrezId) {
							message.error({
								content: `File ${file.name} is missing required column: Entrez_Gene_Id`,
								duration: 8,
							});
							aborted = true;
							parser.abort();
							return;
						}
						firstRow = false;
					} else {
						const dataRow = [];
						if (row.data.Entrz_Gene_Id !== 'NA') {
							const entrezId = parseInt(row.data.Entrez_Gene_Id, 10);
							Object.keys(row.data).forEach((key) => {
								const dataPoint = {
									gene: { entrezGeneId: entrezId, hugoGeneSymbol: '' },
									entrezGeneId: entrezId,
								};
								if (hasHugoSymbol) {
									dataPoint.gene.hugoGeneSymbol = row.data.Hugo_Symbol;
								}
								if (key !== 'Entrez_Gene_Id' && key !== 'Hugo_Symbol') {
									let value = row.data[key];
									if (value !== 'NA' && metaData.datatype === 'CONTINUOUS') {
										value = parseFloat(row.data[key]);
										if (Number.isNaN(value)) {
											aborted = true;
											message.error({
												content: `File ${file.name}: Non-numeric value found where number is expected`,
												duration: 8,
											});
											parser.abort();
											return;
										}
									}
									dataPoint.sampleId = key;
									dataPoint.value = value;
									dataRow.push(dataPoint);
								}
							});
							data.set(entrezId, dataRow);
						} else {
							inconsistentLinebreaks = LocalFileLoader.checkErrors(row.errors, row.data, file.name);
							aborted = true;
							parser.abort();
							return;
						}
					}
				}
			},
			complete: action(() => {
				if (!aborted) {
					const id = uuidv4();
					this.molecularProfiles.push({
						molecularAlterationType: metaData.alterationType,
						name: file.name,
						datatype: metaData.datatype,
						molecularProfileId: id,
					});
					this.profileData.set(id, data);
					callback();
				} else if (inconsistentLinebreaks) {
					LocalFileLoader.replaceLinebreaks(file, (newFile) => {
						this.setMolecular(newFile, metaData, callback);
					});
				} else {
					this.parsingStatus.molecular = 'error';
				}
			}),
		});
	};

	setGenePanelMatrix = (file) => {
		this.parsingStatus.panelMatrix = 'loading';
		this.panelMatrix = {};
		Papa.parse(file, {
			delimiter: '\t',
			header: true,
			worker: true,
			skipEmptyLines: true,
			complete: action((response) => {
				const hasSampleID = response.meta.fields.includes('SAMPLE_ID');
				const hasMutations = response.meta.fields.includes('mutations');
				const hasCNA = response.meta.fields.includes('cna');
				if (hasSampleID && (hasMutations || hasCNA)) {
					response.data.forEach((row) => {
						this.panelMatrix[row.SAMPLE_ID] = {};
						if (hasMutations) {
							this.panelMatrix[row.SAMPLE_ID].mutations = row.mutations;
						}
						if (hasCNA) {
							this.panelMatrix[row.SAMPLE_ID].cna = row.cna;
						}
					});
					this.parsingStatus.panelMatrix = 'finished';
				} else {
					const missingColumns = [];
					if (hasSampleID) {
						missingColumns.push('mutations or cna');
					} else {
						missingColumns.push('SAMPLE_ID');
						if (!hasCNA && !hasMutations) {
							missingColumns.push('mutations or cna');
						} else {
							if (!hasMutations) {
								missingColumns.push('mutations');
							}
							if (!hasCNA) {
								missingColumns.push('cna');
							}
						}
					}
					message.error({
						content: `Missing required columns: ${missingColumns}`,
						duration: 9,
					});
					this.parsingStatus.panelMatrix = 'error';
				}
			}),
		});
	};

	setGenePanels = (files) => {
		this.parsingStatus.genePanels = 'loading';
		this.genePanels.clear();
		Array.from(files).forEach((file) => {
			const reader = new FileReader();
			reader.onload = action(() => {
				const lines = reader.result.split(/[\r\n]+/g).filter((line) => line.trim() !== ''); // tolerate both Windows and Unix linebreaks
				if (lines.length === 4) {
					const nameLineEntries = lines[1].split(':');
					if (nameLineEntries.length === 2) {
						const panelId = nameLineEntries[1].trim();
						const geneLineEntries = lines[3].split(':');
						if (geneLineEntries.length === 2) {
							this.genePanels.set(
								panelId,
								geneLineEntries[1].split('\t').filter((d) => d.trim() !== '')
							);
						} else {
							message.error({
								content: `File ${file.name}: Incorrect format on line 4`,
								duration: 8,
							});
							this.parsingStatus.genePanels = 'error';
						}
					} else {
						message.error({
							content: `File ${file.name}: Incorrect format on line 1`,
							duration: 8,
						});
						this.parsingStatus.genePanels = 'error';
					}
				} else {
					message.error({
						content: 'File has incorrect number of lines',
						duration: 7,
					});
					this.parsingStatus.genePanels = 'error';
				}
				if (this.genePanels.size === files.length) {
					this.parsingStatus.genePanels = 'finished';
				}
			});
			reader.readAsText(file);
		});
	};

	/**
	 * checks the header of a timeline file
	 * @param {string} eventType
	 * @param {string[]} fields
	 * @param {string} fileName
	 * @returns {boolean} valid or not valid
	 */
	static checkTimelineFileHeader(eventType, fields, fileName) {
		const requiredFields = ['PATIENT_ID', 'START_DATE', 'EVENT_TYPE'];
		const missingFields = requiredFields.filter((field) => !fields.includes(field));
		if (missingFields.length > 0) {
			message.error({
				content: `File ${fileName}: Missing required columns - ${missingFields}`,
				duration: 9,
			});
			return false;
		}
		if (eventType === 'SPECIMEN' && !fields.includes('SAMPLE_ID')) {
			message.error({
				content: `File ${fileName}: SAMPLE_ID column is required for timeline SPECIMEN files`,
				duration: 9,
			});
			return false;
		}

		return true;
	}

	/**
	 * checks header of mutation file
	 * @param {string[]} fields
	 * @param {string} fileName
	 * @returns {boolean} valid or not valid
	 */
	static checkMutationFileHeader(fields, fileName) {
		const requiredFields = ['Hugo_Symbol', 'Variant_Classification', 'Tumor_Sample_Barcode', 'HGVSp_Short'];
		const missingFields = requiredFields.filter((field) => !fields.includes(field));
		if (missingFields.length > 0) {
			message.error({
				content: `File ${fileName}: Missing required columns - ${missingFields}`,
				duration: 9,
			});
		}
		return missingFields.length === 0;
	}

	/**
	 * checks errors and throws error messages
	 * @param {Object[]} errors
	 * @param {object} data - data of row where errors occurred
	 * @param {string} fileName
	 * @returns {boolean} linebreaks consistent/inconsistent in file
	 */
	static checkErrors(errors, data, fileName) {
		let inconsistentLinebreak = false;
		const errorMessages = [];
		errors.forEach((error) => {
			if (error.code === 'TooManyFields') {
				for (let i = 0; i < data.__parsed_extra.length; i += 1) {
					if (
						data.__parsed_extra[i].includes('\n') ||
						data.__parsed_extra[i].includes('\r') ||
						data.__parsed_extra[i].includes('\r\n')
					) {
						inconsistentLinebreak = true;
						break;
					}
				}
			}
			if (!inconsistentLinebreak) {
				errorMessages.push(
					`${error.message} at data row ${error.row}. Please check for empty lines or inconsistent use of linebreaks.`
				);
			}
		});
		if (errorMessages.length > 0) {
			message.error({
				content: `File ${fileName}: Invalid file format - ${errorMessages}`,
				duration: 10,
			});
		}
		return inconsistentLinebreak;
	}

	/**
	 * replaces linebreaks in a file
	 * @param {File} file
	 * @param {replacedFileCallback} callback - the callback that returns the new file
	 */
	static replaceLinebreaks(file, callback) {
		const reader = new FileReader();
		reader.onload = () => {
			callback(new File([reader.result.replace(/(?:\r\n|\r)/g, '\n')], file.name));
		};
		reader.readAsText(file);
	}

	/**
	 * splices the first symbol (#) in the first column of the header rows
	 * @param {number} index
	 * @param {string} value
	 * @returns {string} spliced value if index is 0
	 */
	static getSpliced(index, value) {
		let returnVal = value;
		if (index === 0) {
			returnVal = value.substring(1);
		}
		return returnVal;
	}

	/**
	 * Get the parsing progress for a file type
	 * @param {string} fileType - The file type (events, mutations, etc.)
	 * @returns {number} - Progress percentage (0-100)
	 */
	getParseProgress(fileType) {
		return this.parseProgress[fileType] || 0;
	}

	/**
	 * Get the error message for a file type
	 * @param {string} fileType - The file type (events, mutations, etc.)
	 * @returns {string|null} - Error message or null
	 */
	getErrorMessage(fileType) {
		return this.parseErrors[fileType];
	}

	/**
	 * Set parsing progress for a file type
	 * @param {string} fileType - The file type (events, mutations, etc.)
	 * @param {number} progress - Progress percentage (0-100)
	 */
	setProgress = (fileType, progress) => {
		if (this.parseProgress[fileType] !== undefined) {
			this.parseProgress[fileType] = Math.min(100, Math.max(0, progress));
		}
	};

	/**
	 * Set error message for a file type
	 * @param {string} fileType - The file type (events, mutations, etc.)
	 * @param {string} errorMessage - The error message
	 */
	setError = (fileType, errorMessage) => {
		if (this.parseErrors[fileType] !== undefined) {
			this.parseErrors[fileType] = errorMessage;
			this.parsingStatus[fileType] = 'error';
		}
	};

	/**
	 * Reset progress and error for a file type
	 * @param {string} fileType - The file type (events, mutations, etc.)
	 */
	resetProgress(fileType) {
		if (this.parseProgress[fileType] !== undefined) {
			this.parseProgress[fileType] = 0;
			this.parseErrors[fileType] = null;
		}
	}
}

export default LocalFileLoader;
