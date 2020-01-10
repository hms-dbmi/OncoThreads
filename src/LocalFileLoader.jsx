/* eslint-disable no-underscore-dangle */
import * as Papa from 'papaparse';
import {action, extendObservable, reaction} from 'mobx';
import uuidv4 from 'uuid/v4';

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
    constructor() {
        this.patients = []; // all patients contained in the timeline SPECIMEN file
        this.samples = []; // all samples contained in the timeline SPECIMEN file
        this.samplePatientMap = {};
        this.mutations = []; // array of mutation objects
        this.mutationCounts = []; // array of mutation counts
        this.eventFiles = new Map(); // map of event files
        this.profileData = new Map(); // map of molecular data
        this.clinicalSampleFile = null; // file containing clinical sample data
        this.clinicalPatientFile = null; // file containing clinical patient data
        this.molecularProfiles = []; // all available molecular profiles
        this.panelMatrix = {};
        this.genePanels = new Map();
        extendObservable(this, {
            // states reflecting the load status of the different types of files:
            // empty, loading, finished, or error
            parsingStatus: {
                events: 'empty',
                mutations: 'empty',
                molecular: 'empty',
                clinicalPatient: 'empty',
                clinicalSample: 'empty',
                panelMatrix: 'empty',
                genePanels: 'empty',
            },
            /**
             * is any of the files currently loading
             * @returns {boolean}
             */
            get dataLoading() {
                return Object.values(this.parsingStatus).some(value => value === 'loading');
            },
            /**
             * were there errors during the file parsing
             * @returns {boolean}
             */
            get dataHasErrors() {
                return Object.values(this.parsingStatus).some(value => value === 'error');
            },
            /**
             * is data ready to be displayed
             * @returns {boolean}
             */
            get dataReady() {
                return !this.dataLoading
                    && !this.dataHasErrors
                    && this.parsingStatus.events === 'finished'
                    && (this.parsingStatus.mutations === 'finished'
                        || this.parsingStatus.clinicalSample === 'finished'
                        || this.parsingStatus.clinicalPatient === 'finished')
                    && this.parsingStatus.genePanels === this.parsingStatus.panelMatrix;
            },
            setEventsParsed: action((loadingState) => {
                this.parsingStatus.events = loadingState;
            }),
            setMutationsParsed: action((loadingState) => {
                this.parsingStatus.mutations = loadingState;
            }),
            setMolecularParsed: action((loadingState) => {
                this.parsingStatus.molecular = loadingState;
            }),
            setClinicalPatientParsed: action((loadingState) => {
                this.parsingStatus.clinicalPatient = loadingState;
            }),
            setClinicalSampleParsed: action((loadingState) => {
                this.parsingStatus.clinicalSample = loadingState;
            }),
            setPanelMatrixParsed: action((loadingState) => {
                this.parsingStatus.panelMatrix = loadingState;
            }),
            setGenePanelsParsed: action((loadingState) => {
                this.parsingStatus.genePanels = loadingState;
            }),
            /**
             * sets current event files if headers are correct
             * and file of type SPECIMEN is contained
             * @param {FileList} files: all event files
             * @param {loadFinishedCallback} callback
             */
            setEventFiles: action((files, callback) => {
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
                            if (LocalFileLoader.checkTimelineFileHeader(row.data.EVENT_TYPE,
                                row.meta.fields, d.name)) {
                                eventFiles.set(row.data.EVENT_TYPE, d);
                            } else {
                                this.parsingStatus.events = 'error';
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
                                        this.parsingStatus.events = 'finished';
                                        callback();
                                    });
                                } else {
                                    this.parsingStatus.events = 'error';
                                    alert('ERROR: Required timeline file with EVENT_TYPE SPECIMEN missing');
                                }
                            }
                        },
                    });
                });
            }),

            /**
             * sets patients and samples
             * @param {File} file
             * @param {loadFinishedCallback} callback
             */
            setPatientsAndSamples: action((file, callback) => {
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
                            alert('ERROR: START_DATE is not a number');
                            this.parsingStatus.events = 'error';
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
            }),

            /**
             * creates array containing all mutations
             * @param {File} file
             */
            setMutations: action((file) => {
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
                                if (LocalFileLoader.checkMutationFileHeader(row.meta.fields,
                                    file.name)) {
                                    if ('t_ref_count' in row.data && 't_alt_count' in row.data) {
                                        hasVaf = true;
                                    }
                                    firstRow = false;
                                } else {
                                    this.parsingStatus.mutations = 'error';
                                    aborted = true;
                                    parser.abort();
                                }
                            }
                            // add mutation if it's not in the list of excluded mutations
                            if (!aborted && !skipMutations
                                .includes(row.data.Variant_Classification)) {
                                const mutation = {
                                    sampleId: row.data.Tumor_Sample_Barcode,
                                    proteinChange: row.data.HGVSp_Short.substring(2),
                                    gene: {
                                        hugoGeneSymbol: row.data.Hugo_Symbol,
                                    },
                                    mutationType: row.data.Variant_Classification,
                                };
                                if (hasVaf) {
                                    mutation.tumorAltCount = row.data.t_alt_count;
                                    mutation.tumorRefCount = row.data.t_ref_count;
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
                            inconsistentLinebreaks = LocalFileLoader.checkErrors(row.errors,
                                row.data, file.name);
                            aborted = true;
                            parser.abort();
                        }
                    },
                    complete: () => {
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
                    },
                });
            }),


            /**
             * loads an event file
             * @param {File} file
             * @param {loadFinishedCallback} callback
             */
            loadEventFile: action((file, callback) => {
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
                            const validStartDate = !Number
                                .isNaN(parseInt(row.data.START_DATE, 10));
                            const validEndDate = !hasEndDate || row.data.STOP_DATE === ''
                                || (hasEndDate && !Number
                                    .isNaN(parseInt(row.data.STOP_DATE, 10)));
                            if (validStartDate && validEndDate) {
                                const attributes = [];
                                Object.keys(row.data).forEach((key) => {
                                    if (key !== 'START_DATE' && key !== 'STOP_DATE' && key !== 'EVENT_TYPE' && key !== 'PATIENT_ID') {
                                        if (row.data[key].length > 0) {
                                            attributes.push({key, value: row.data[key]});
                                        }
                                    }
                                });
                                const currRow = {
                                    attributes,
                                    eventType: row.data.EVENT_TYPE,
                                    patientId: row.data.PATIENT_ID,
                                    startNumberOfDaysSinceDiagnosis:
                                        parseInt(row.data.START_DATE, 10),
                                };
                                if (hasEndDate) {
                                    currRow.endNumberOfDaysSinceDiagnosis = parseInt(row.data
                                        .STOP_DATE, 10);
                                }
                                events[row.data.PATIENT_ID].push(currRow);
                            } else {
                                aborted = true;
                                if (!validStartDate) {
                                    alert(`ERROR: START_DATE is not a number in file ${file.name}`);
                                } else {
                                    alert(`ERROR: STOP_DATE is not a number in file ${file.name}`);
                                }
                                parser.abort();
                            }
                        } else {
                            inconsistentLinebreak = LocalFileLoader.checkErrors(row.errors,
                                row.data, file.name);
                            aborted = true;
                            parser.abort();
                        }
                    },
                    complete: () => {
                        if (!aborted) {
                            Object.keys(events).forEach((patient) => {
                                events[patient].sort((a, b) => a.startNumberOfDaysSinceDiagnosis
                                    - b.startNumberOfDaysSinceDiagnosis);
                            });
                            callback(events);
                        } else if (inconsistentLinebreak) {
                            LocalFileLoader.replaceLinebreaks(file, (newFile) => {
                                this.loadEventFile(newFile, callback);
                            });
                        } else {
                            this.parsingStatus.events = 'error';
                        }
                    },
                });
            }),

            /**
             * loads all events
             * @param {returnDataCallback} callback
             */
            loadEvents: action((callback) => {
                const events = {};
                let filesVisited = 0;
                this.eventFiles.forEach((d) => {
                    this.loadEventFile(d, (fileEvents) => {
                        filesVisited += 1;
                        Object.keys(fileEvents).forEach((patient) => {
                            if (!(patient in events)) {
                                events[patient] = fileEvents[patient];
                            } else {
                                events[patient].push(...fileEvents[patient]);
                            }
                        });
                        if (filesVisited === this.eventFiles.size) {
                            callback(events);
                        }
                    });
                });
            }),

            /**
             * sets the clinical file if the header is in the right format
             * @param {File} file
             * @param {boolean} isSample - sample related of patient related clinical data
             */
            setClinicalFile: action((file, isSample) => {
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
                            alert(errorMessages);
                            parser.abort();
                        }
                        rowCounter += 1;
                    },
                    complete: () => {
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
                    },
                });
            }),

            /**
             * Parse clinical data file
             * @param {boolean} isSample - sample related or patient related clinical data
             * @param {function} callback
             */
            loadClinicalFile: action((isSample, callback) => {
                let file;
                if (isSample) {
                    file = this.clinicalSampleFile;
                } else {
                    file = this.clinicalPatientFile;
                }
                const clinicalAttributes = {};
                const intermediateAttributes = [];
                let abort = false;
                let inconsistentLinebreaks = false;
                let rowCounter = 0;
                // parse header
                if (file !== null) {
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
                                        intermediateAttributes[i]
                                            .description = LocalFileLoader.getSpliced(i, d);
                                    });
                                } else if (rowCounter === 2) {
                                    row.data.forEach((d, i) => {
                                        intermediateAttributes[i]
                                            .datatype = LocalFileLoader.getSpliced(i, d);
                                    });
                                } else if (rowCounter === 4) {
                                    row.data.forEach((d, i) => {
                                        intermediateAttributes[i]
                                            .clinicalAttributeId = LocalFileLoader.getSpliced(i, d);
                                        clinicalAttributes[d] = intermediateAttributes[i];
                                    });
                                    parser.abort();
                                }
                                rowCounter += 1;
                            } else {
                                inconsistentLinebreaks = LocalFileLoader.checkErrors(row.errors,
                                    row.data, file.name);
                                abort = true;
                                parser.abort();
                            }
                        },
                        complete: () => {
                            // parse data
                            if (!abort) {
                                this.loadClinicalBody(file, isSample, clinicalAttributes, callback);
                            } else if (inconsistentLinebreaks) {
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
                            } else {
                                this.parsingStatus.clinicalPatient = 'error';
                            }
                        },
                    });
                } else callback([]);
            }),

            /**
             * parses data rows of the clinical data file into an array of objects
             * @param {File} file
             * @param {boolean} isSample - sample related of patient related clinical data
             * @param {object} clinicalAttributes - information about
             * the column headers that is included in the resulting data array
             * @param {returnDataCallback} callback
             */
            loadClinicalBody: action((file, isSample, clinicalAttributes, callback) => {
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
                                    if (clinicalAttributes[key].datatype === 'NUMBER') {
                                        if (Number.isNaN(parseFloat(row.data[key]))) {
                                            abort = true;
                                            alert(`ERROR: File ${file.name}- non numeric value of numeric variable ${key}`);
                                            parser.abort();
                                        }
                                    }
                                    const currRow = {
                                        clinicalAttribute: clinicalAttributes[key],
                                        clinicalAttributeId: clinicalAttributes[key]
                                            .clinicalAttributeId,
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
                            inconsistentLinebreaks = LocalFileLoader.checkErrors(row.errors,
                                row.data, file.name);
                            abort = true;
                            parser.abort();
                        }
                    },
                    complete: () => {
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
                    },
                });
            }),

            /**
             * parse cnv data files
             * @param {FileList} files - all cnv data files
             * @param {string[]} metaData - datatypes and molecularAlteration types
             */
            setMolecularFiles: action((files, metaData) => {
                let filesParsed = 0;
                this.parsingStatus.molecular = 'loading';
                Array.from(files).forEach((file, i) => {
                    this.setMolecular(file, metaData[i], () => {
                        filesParsed += 1;
                        if (filesParsed === files.length) {
                            this.parsingStatus.molecular = 'finished';
                        }
                    });
                });
            }),

            /**
             * parses an molecular data file into an array of objects
             * @param {File} file
             * @param {loadFinishedCallback} callback
             */
            setMolecular: action((file, metaData, callback) => {
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
                                    alert(`ERROR: file ${file.name} missing Entrez_Gene_Id column`);
                                    aborted = true;
                                    parser.abort();
                                }
                                firstRow = false;
                            } else {
                                const dataRow = [];
                                if (row.data.Entrz_Gene_Id !== 'NA') {
                                    const entrezId = parseInt(row.data.Entrez_Gene_Id, 10);
                                    Object.keys(row.data).forEach((key) => {
                                        const dataPoint = {
                                            gene: {entrezGeneId: entrezId, hugoGeneSymbol: ''},
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
                                                    alert(`ERROR: file ${file.name} value is not a number`);
                                                    parser.abort();
                                                }
                                            }
                                            dataPoint.sampleId = key;
                                            dataPoint.value = value;
                                            dataRow.push(dataPoint);
                                        }
                                    });
                                    data.set(entrezId, dataRow);
                                } else {
                                    inconsistentLinebreaks = LocalFileLoader.checkErrors(row.errors,
                                        row.data, file.name);
                                    aborted = true;
                                    parser.abort();
                                }
                            }
                        }
                    },
                    complete: () => {
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
                    },
                });
            }),
            setGenePanelMatrix: action((file) => {
                this.parsingStatus.panelMatrix = 'loading';
                this.panelMatrix = {};
                Papa.parse(file, {
                    delimiter: '\t',
                    header: true,
                    worker: true,
                    skipEmptyLines: true,
                    complete: (response) => {
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
                            alert(`The following columns are missing ${missingColumns}`);
                            this.parsingStatus.panelMatrix = 'error';
                        }
                    },
                });
            }),
            setGenePanels: action((files) => {
                this.parsingStatus.genePanels = 'loading';
                this.genePanels.clear();
                Array.from(files).forEach((file) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const lines = reader.result.split(/[\r\n]+/g).filter(line => line.trim() !== ''); // tolerate both Windows and Unix linebreaks
                        if (lines.length === 4) {
                            const nameLineEntries = lines[1].split(':');
                            if (nameLineEntries.length === 2) {
                                const panelId = nameLineEntries[1].trim();
                                const geneLineEntries = lines[3].split(':');
                                if (geneLineEntries.length === 2) {
                                    this.genePanels.set(panelId, geneLineEntries[1].split('\t').filter(d => d.trim() !== ''));
                                } else {
                                    alert(`Line 4 of file ${file.name} incorrect`);
                                    this.parsingStatus.genePanels = 'error';
                                }
                            } else {
                                alert(`Line 1 of file ${file.name} incorrect`);
                                this.parsingStatus.genePanels = 'error';
                            }
                        } else {
                            alert('Incorrect number of lines');
                            this.parsingStatus.genePanels = 'error';
                        }
                        if (this.genePanels.size === files.length) {
                            this.parsingStatus.genePanels = 'finished';
                        }
                    };
                    reader.readAsText(file);
                });
            }),
        });

        // reactions to errors or removal of files:
        // clears data fields if there is an error or the file is removed
        reaction(() => this.parsingStatus.events, (parsed) => {
            if (parsed === 'error' || parsed === 'empty') {
                this.eventFiles.clear();
            }
        });
        reaction(() => this.parsingStatus.mutations, (parsed) => {
            if (parsed === 'error' || parsed === 'empty') {
                this.mutations = [];
            }
        });
        reaction(() => this.parsingStatus.molecular, (parsed) => {
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
        });
        reaction(() => this.parsingStatus.clinicalSample, (parsed) => {
            if (parsed === 'error' || parsed === 'empty') {
                this.clinicalSampleFile = null;
            }
        });
        reaction(() => this.parsingStatus.clinicalPatient, (parsed) => {
            if (parsed === 'error' || parsed === 'empty') {
                this.clinicalPatientFile = null;
            }
        });
        reaction(() => this.parsingStatus.panelMatrix, (parsed) => {
            if (parsed === 'empty') {
                this.panelMatrix = {};
            } else if (parsed === 'finished' && (this.parsingStatus.genePanels === 'finished'
                || (this.parsingStatus.genePanels === 'error' && this.genePanels.size > 0))) {
                let broke = false;
                Object.keys(this.panelMatrix).every((sample) => {
                    Object.keys(this.panelMatrix[sample]).every((key) => {
                        if (!this.genePanels.has(this.panelMatrix[sample][key]) && this.panelMatrix[sample][key] !== 'NA') {
                            this.parsingStatus.genePanels = 'error';
                            this.parsingStatus.panelMatrix = 'error';
                            alert("ERROR: Gene panel Ids don't mach panel ids in panel matrix");
                            broke = true;
                            return false;
                        }
                        return true;
                    });
                    return !broke;
                });
                if (!broke) {
                    this.parsingStatus.genePanels = 'finished';
                }
            }
        });
        reaction(() => this.parsingStatus.genePanels, (parsed) => {
            if (parsed === 'empty') {
                this.genePanels.clear();
            } else if (parsed === 'finished' && (this.parsingStatus.panelMatrix === 'finished'
                || (this.parsingStatus.panelMatrix === 'error' && Object.keys(this.parsingStatus.panelMatrix).length > 0))) {
                let broke = false;
                Object.keys(this.panelMatrix).every((sample) => {
                    Object.keys(this.panelMatrix[sample]).every((key) => {
                        if (!this.genePanels.has(this.panelMatrix[sample][key]) && this.panelMatrix[sample][key] !== 'NA') {
                            this.parsingStatus.genePanels = 'error';
                            this.parsingStatus.panelMatrix = 'error';
                            alert("ERROR: Gene panel Ids don't mach panel ids in panel matrix");
                            broke = true;
                            return false;
                        }
                        return true;
                    });
                    return !broke;
                });
                if (!broke) {
                    this.parsingStatus.panelMatrix = 'finished';
                }
            }
        });
    }

    /**
     * checks the header of a timeline file
     * @param {string} eventType
     * @param {string[]} fields
     * @param {string} fileName
     * @returns {boolean} valid or not valid
     */
    static checkTimelineFileHeader(eventType, fields, fileName) {
        const requiredFields = ['PATIENT_ID', 'START_DATE', 'EVENT_TYPE'];
        const missingFields = requiredFields.filter(field => !fields.includes(field));
        if (missingFields.length > 0) {
            alert(`ERROR: Column headers do not match. Columns ${missingFields} are missing in file ${fileName}`);
            return false;
        }
        if (eventType === 'SPECIMEN' && !fields.includes('SAMPLE_ID')) {
            alert(`ERROR: SAMPLE_ID is missing in timeline SPECIMEN file ${fileName}`);
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
        const missingFields = requiredFields.filter(field => !fields.includes(field));
        if (missingFields.length > 0) {
            alert(`ERROR: Column headers do not match. Columns ${missingFields} are missing in file ${fileName}`);
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
                    if (data.__parsed_extra[i].includes('\n') || data.__parsed_extra[i].includes('\r') || data.__parsed_extra[i].includes('\r\n')) {
                        inconsistentLinebreak = true;
                        break;
                    }
                }
            }
            if (!inconsistentLinebreak) {
                errorMessages.push(`${error.message} at data row ${error.row}. Please check for empty lines or inconsistent use of linebreaks.`);
            }
        });
        if (errorMessages.length > 0) {
            alert(`ERROR wrong file format in file ${fileName}: ${errorMessages}`);
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
}

export default LocalFileLoader;
