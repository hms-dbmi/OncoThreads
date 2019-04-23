import * as Papa from "papaparse"
import {action, extendObservable, reaction} from "mobx";
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
        this.samplePatientMap={};
        this.mutations = []; // array of mutation objects
        this.mutationCounts = []; // array of mutation counts
        this.eventFiles = new Map(); // map of event files
        this.profileData = new Map(); // map of molecular data (one array in map corresponds to one molecular profile)
        this.clinicalSampleFile = null; // file containing clinical sample data
        this.clinicalPatientFile = null; // file containing clinical patient data
        this.molecularProfiles = []; // all available molecular profiles
        this.panelMatrix = {};
        this.genePanels = new Map();
        extendObservable(this, {
            // states reflecting the load status of the different types of files: empty, loading, finished, or error
            eventsParsed: "empty",
            mutationsParsed: "empty",
            molecularParsed: "empty",
            clinicalPatientParsed: "empty",
            clinicalSampleParsed: "empty",
            panelMatrixParsed: "empty",
            genePanelsParsed: "empty",
            /**
             * is any of the files currently loading
             * @returns {boolean}
             */
            get dataLoading() {
                return this.eventsParsed === "loading"
                    || this.mutationsParsed === "loading"
                    || this.molecularParsed === "loading"
                    || this.clinicalPatientParsed === "loading"
                    || this.clinicalSampleParsed === "loading"
                    || this.panelMatrixParsed === "loading"
                    || this.genePanelsParsed === "loading";
            },
            /**
             * were there errors during the file parsing
             * @returns {boolean}
             */
            get dataHasErrors() {
                return this.eventsParsed === "error"
                    || this.mutationsParsed === "error"
                    || this.molecularParsed === "error"
                    || this.clinicalPatientParsed === "error"
                    || this.clinicalSampleParsed === "error"
                    || this.panelMatrixParsed === "error"
                    || this.genePanelsParsed === "error";
            },
            /**
             * is data ready to be displayed
             * @returns {boolean}
             */
            get dataReady() {
                return !this.dataLoading
                    && !this.dataHasErrors
                    && this.eventsParsed === "finished"
                    && (this.mutationsParsed === "finished"
                        || this.clinicalSampleParsed === "finished"
                        || this.clinicalPatientParsed === "finished")
                    && this.genePanelsParsed === this.panelMatrixParsed;
            },
            setEventsParsed: action(loadingState => {
                this.eventsParsed = loadingState;
            }),
            setMutationsParsed: action(loadingState => {
                this.mutationsParsed = loadingState;
            }),
            setExpressionsParsed: action(loadingState => {
                this.expressionsParsed = loadingState;
            }),
            setMolecularParsed: action(loadingState => {
                this.molecularParsed = loadingState;
            }),
            setClinicalPatientParsed: action(loadingState => {
                this.clinicalPatientParsed = loadingState;
            }),
            setClinicalSampleParsed: action(loadingState => {
                this.clinicalSampleParsed = loadingState
            }),
            setPanelMatrixParsed: action(loadingState => {
                this.panelMatrixParsed = loadingState;
            }),
            setGenePanelsParsed: action(loadingState => {
                this.genePanelsParsed = loadingState
            }),
            /**
             * sets current event files if headers are correct and file of type SPECIMEN is contained
             * @param {FileList} files: all event files
             * @param {loadFinishedCallback} callback
             */
            setEventFiles: action((files, callback) => {
                let eventFiles = new Map();
                this.eventsParsed = "loading";
                Array.from(files).forEach(d => {
                    Papa.parse(d, {
                        delimiter: "\t",
                        header: true,
                        skipEmptyLines: true,
                        step: (row, parser) => {
                            parser.pause();
                            // check header
                            if (LocalFileLoader.checkTimelineFileHeader(row.data[0]["EVENT_TYPE"], row.meta.fields, d.name)) {
                                eventFiles.set(row.data[0]["EVENT_TYPE"], d);
                            }
                            else {
                                this.eventsParsed = "error";
                            }
                            parser.abort();
                        },
                        complete: () => {
                            //all file headers have been checked and are valid
                            if (eventFiles.size === files.length) {
                                //one of the files has to be of eventType SPECIMEN
                                if (eventFiles.has("SPECIMEN")) {
                                    this.setPatientsAndSamples(eventFiles.get("SPECIMEN"), () => {
                                        this.eventFiles = eventFiles;
                                        this.eventsParsed = "finished";
                                        callback();
                                    });
                                }
                                else {
                                    this.eventsParsed = "error";
                                    alert("ERROR: Required timeline file with EVENT_TYPE SPECIMEN missing");
                                }
                            }
                        }
                    })
                })
            }),

            /**
             * sets patients and samples
             * @param {File} file
             * @param {loadFinishedCallback} callback
             */
            setPatientsAndSamples: action((file, callback) => {
                let dateCorrect = true;
                let patients = [];
                let samples = [];
                Papa.parse(file, {
                    delimiter: "\t",
                    header: true,
                    skipEmptyLines: true,
                    step: (row, parser) => {
                        if (!patients.includes(row.data[0]["PATIENT_ID"])) {
                            patients.push(row.data[0]["PATIENT_ID"]);
                        }
                        if (!samples.includes(row.data[0]["SAMPLE_ID"])) {
                            samples.push(row.data[0]["SAMPLE_ID"]);
                            this.samplePatientMap[row.data[0]["SAMPLE_ID"]]=row.data[0]["PATIENT_ID"];
                        }
                        let date = parseInt(row.data[0]["START_DATE"], 10);
                        if (isNaN(date)) {
                            alert("ERROR: START_DATE is not a number");
                            this.eventsParsed = "error";
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
                    }
                });
            }),

            /**
             * creates array containing all mutations
             * @param {File} file
             */
            setMutations: action(file => {
                const skipMutations = ["Silent", "Intron", "3'UTR", "3'Flank", "5'UTR", "5'Flank", "IGR", "RNA"]; //mutations to be skipped according to cBio docs
                let hasVaf = false; // are columns for variant allele frequency contained in the files
                let firstRow = true;
                let aborted = false;
                let inconsistentLinebreaks = false;
                let mutations = []; // data array for mutations
                let counts = {}; // object for storing mutation counts
                this.mutationsParsed = "loading";
                Papa.parse(file, {
                    delimiter: "\t",
                    header: true,
                    skipEmptyLines: true,
                    step: (row, parser) => {
                        if (row.errors.length === 0) {
                            if (firstRow) {
                                // check header when parsing first row
                                if (LocalFileLoader.checkMutationFileHeader(row.meta.fields, file.name)) {
                                    if ("t_ref_count" in row.data[0] && "t_alt_count" in row.data[0]) {
                                        hasVaf = true;
                                    }
                                    firstRow = false;
                                }
                                else {
                                    this.mutationsParsed = "error";
                                    aborted = true;
                                    parser.abort();
                                }
                            }
                            // add mutation if it's not in the list of excluded mutations
                            if (!aborted && !skipMutations.includes(row.data[0]["Variant_Classification"])) {
                                let mutation = {
                                    sampleId: row.data[0]["Tumor_Sample_Barcode"],
                                    proteinChange: row.data[0]["HGVSp_Short"].substring(2),
                                    gene: {
                                        hugoGeneSymbol: row.data[0]["Hugo_Symbol"]
                                    },
                                    mutationType: row.data[0]["Variant_Classification"]
                                };
                                if (hasVaf) {
                                    mutation.tumorAltCount = row.data[0]["t_alt_count"];
                                    mutation.tumorRefCount = row.data[0]["t_ref_count"];
                                }
                                else {
                                    mutation.tumorAltCount = -1;
                                    mutation.tumorRefCount = -1;
                                }
                                mutations.push(mutation);
                                if (!(row.data[0]["Tumor_Sample_Barcode"] in counts)) {
                                    counts[row.data[0]["Tumor_Sample_Barcode"]] = 0;
                                }
                                counts[row.data[0]["Tumor_Sample_Barcode"]]++;
                            }
                        }
                        else {
                            inconsistentLinebreaks = this.checkErrors(row.errors, row.data[0], file.name);
                            aborted = true;
                            parser.abort();
                        }

                    },
                    complete: () => {
                        if (!aborted) {
                            this.molecularProfiles.push({
                                molecularAlterationType: "MUTATION_EXTENDED",
                                name: "Mutations",
                                molecularProfileId: uuidv4()
                            });
                            this.mutationCounts = this.samples.map(sample => {
                                let count = 0;
                                if (sample in counts) {
                                    count = counts[sample];
                                }
                                return {
                                    clinicalAttribute:{displayName:"Mutation Count", description:"Mutation Count",datatype:"NUMBER"},
                                    sampleId: sample,
                                    patientId:this.samplePatientMap[sample],
                                    clinicalAttributeId:"MUTATION_COUNT",
                                    value:count,
                                }
                            });
                            console.log(this.mutationCounts);
                            this.mutations = mutations;
                            this.mutationsParsed = "finished";
                        }
                        else {
                            // if linebreaks are inconsistent replace them and retry
                            if (inconsistentLinebreaks) {
                                this.replaceLinebreaks(file, newFile => {
                                    this.setMutations(newFile);
                                })
                            }
                            else {
                                this.mutationsParsed = "error";
                            }
                        }
                    }
                })
            }),


            /**
             * loads an event file
             * @param {File} file
             * @param {object} rawEvents
             * @param {loadFinishedCallback} callback
             */
            loadEventFile: action((file, rawEvents, callback) => {
                let aborted = false;
                let inconsistentLinebreak = false;
                let firstRow = true;
                let hasEndDate = false;
                Papa.parse(file, {
                    delimiter: "\t",
                    header: true,
                    skipEmptyLines: true,
                    step: (row, parser) => {
                        if (row.errors.length === 0) {
                            if (firstRow) {
                                if ("STOP_DATE" in row.data[0]) {
                                    hasEndDate = true;
                                }
                                firstRow = false;
                            }
                            if (!(row.data[0]["PATIENT_ID"] in rawEvents)) {
                                rawEvents[row.data[0]["PATIENT_ID"]] = [];
                            }
                            const validStartDate = !isNaN(parseInt(row.data[0]["START_DATE"], 10));
                            const validEndDate = !hasEndDate || row.data[0]["STOP_DATE"] === "" || (hasEndDate && !isNaN(parseInt(row.data[0]["STOP_DATE"], 10)));
                            if (validStartDate && validEndDate) {
                                let attributes = [];
                                for (let key in row.data[0]) {
                                    if (key !== "START_DATE" && key !== "STOP_DATE" && key !== "EVENT_TYPE" && key !== "PATIENT_ID") {
                                        if (row.data[0][key].length > 0) {
                                            attributes.push({key: key, value: row.data[0][key]})
                                        }
                                    }
                                }
                                let currRow = {
                                    attributes: attributes,
                                    eventType: row.data[0]["EVENT_TYPE"],
                                    patientId: row.data[0]["PATIENT_ID"],
                                    startNumberOfDaysSinceDiagnosis: parseInt(row.data[0]["START_DATE"], 10)
                                };
                                if (hasEndDate) {
                                    currRow.endNumberOfDaysSinceDiagnosis = parseInt(row.data[0]["STOP_DATE"], 10);
                                }
                                rawEvents[row.data[0]["PATIENT_ID"]].push(currRow);
                            }
                            else {
                                aborted = true;
                                if (!validStartDate) {
                                    alert("ERROR: START_DATE is not a number in file " + file.name);
                                }
                                else {
                                    alert("ERROR: STOP_DATE is not a number in file " + file.name);
                                }
                                parser.abort();
                            }
                        }
                        else {
                            inconsistentLinebreak = this.checkErrors(row.errors, row.data[0], file.name);
                            aborted = true;
                            parser.abort();
                        }
                    },
                    complete: () => {
                        if (!aborted) {
                            for (let patient in rawEvents) {
                                rawEvents[patient].sort((a, b) => {
                                    return a.startNumberOfDaysSinceDiagnosis - b.startNumberOfDaysSinceDiagnosis;
                                })
                            }
                            callback();
                        }
                        else {
                            if (inconsistentLinebreak) {
                                this.replaceLinebreaks(file, (newFile) => {
                                    this.loadEventFile(newFile, rawEvents, callback);
                                });
                            }
                            else {
                                this.eventsParsed = "error";
                            }
                        }
                    }
                });
            }),

            /**
             * loads all events
             * @param {returnDataCallback} callback
             */
            loadEvents: action(callback => {
                let rawEvents = [];
                let filesVisited = 0;
                this.eventFiles.forEach(d => {
                    this.loadEventFile(d, rawEvents, () => {
                        filesVisited++;
                        if (filesVisited === this.eventFiles.size) {
                            callback(rawEvents);
                        }
                    })

                });
            }),

            /**
             * sets the clinical file if the header is in the right format
             * @param {File} file
             * @param {boolean} isSample - sample related of patient related clinical data
             */
            setClinicalFile: action((file, isSample) => {
                if (isSample) {
                    this.clinicalSampleParsed = "loading";
                }
                else {
                    this.clinicalPatientParsed = "loading"
                }

                let correctHeader = true;
                let rowCounter = 0;
                Papa.parse(file, {
                    delimiter: "\t",
                    header: false,
                    skipEmptyLines: true,
                    step: (row, parser) => {
                        if (rowCounter === 0 && !row.data[0][0].startsWith("#")) {
                            alert("ERROR: wrong header format, first row has to start with #");
                            correctHeader = false;
                        }
                        else if (rowCounter === 1 && !row.data[0][0].startsWith("#")) {
                            alert("ERROR: wrong header format, second row has to start with #");
                            correctHeader = false;
                        }
                        else if (rowCounter === 2 && !row.data[0][0].startsWith("#")) {
                            alert("ERROR: wrong header format, third row has to start with #");
                            correctHeader = false
                        }
                        else if (rowCounter === 3 && !row.data[0][0].startsWith("#")) {
                            alert("ERROR: wrong header format, fourth row has to start with #");
                            correctHeader = false
                        }
                        else if (rowCounter === 4) {
                            if (row.data[0][0].startsWith("#")) {
                                alert("ERROR: wrong header format, fifth row should not start with #");
                                correctHeader = false
                            }
                            else {
                                if (row.data[0].includes("PATIENT_ID")) {
                                    if (isSample && !row.data[0].includes("SAMPLE_ID")) {
                                        alert("ERROR: no SAMPLE_ID column found");
                                        correctHeader = false;
                                    }
                                    else if (!isSample && row.data[0].includes("SAMPLE_ID")) {
                                        alert("ERROR: SAMPLE_ID provided for non-sample specific clinical data");
                                        correctHeader = false;
                                    }
                                }
                                else {
                                    alert("ERROR: No PATIENT_ID data column found");
                                    correctHeader = false;
                                }
                            }
                        }
                        else if (rowCounter > 4) {
                            parser.abort();
                        }
                        rowCounter++;
                    },
                    complete: () => {
                        if (correctHeader) {
                            if (isSample) {
                                this.clinicalSampleFile = file;
                                this.clinicalSampleParsed = "finished"
                            }
                            else {
                                this.clinicalPatientFile = file;
                                this.clinicalPatientParsed = "finished"
                            }
                        }
                        else {
                            if (isSample) {
                                this.clinicalSampleParsed = "error"
                            }
                            else {
                                this.clinicalPatientParsed = "error"
                            }
                        }
                    }
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
                }
                else {
                    file = this.clinicalPatientFile;
                }
                let clinicalAttributes = {};
                let intermediateAttributes = [];
                let abort = false;
                let inconsistentLinebreaks = false;
                let rowCounter = 0;
                //parse header
                if (file !== null) {
                    Papa.parse(file, {
                        delimiter: "\t",
                        skipEmptyLines: true,
                        step: (row, parser) => {
                            if (row.errors.length === 0) {
                                if (rowCounter === 0) {
                                    row.data[0].forEach((d, i) => {
                                        intermediateAttributes.push({displayName: LocalFileLoader.getSpliced(i, d)});
                                    });
                                }
                                else if (rowCounter === 1) {
                                    row.data[0].forEach((d, i) => {
                                        intermediateAttributes[i].description = LocalFileLoader.getSpliced(i, d);
                                    });
                                }
                                else if (rowCounter === 2) {
                                    row.data[0].forEach((d, i) => {
                                        intermediateAttributes[i].datatype = LocalFileLoader.getSpliced(i, d);
                                    });
                                }
                                else if (rowCounter === 4) {
                                    row.data[0].forEach((d, i) => {
                                        intermediateAttributes[i].clinicalAttributeId = LocalFileLoader.getSpliced(i, d);
                                        clinicalAttributes[d] = intermediateAttributes[i];
                                    });
                                    parser.abort();
                                }
                                rowCounter++;
                            }
                            else {
                                inconsistentLinebreaks = this.checkErrors(row.errors, row.data[0], file.name);
                                abort = true;
                                parser.abort();
                            }
                        },
                        complete: () => {
                            //parse data
                            if (!abort) {
                                this.loadClinicalBody(file, isSample, clinicalAttributes, callback)
                            }
                            else {
                                if (inconsistentLinebreaks) {
                                    if (isSample) {
                                        this.replaceLinebreaks(file, newFile => {
                                            this.clinicalSampleFile = newFile;
                                            this.loadClinicalFile(isSample, callback);
                                        })
                                    }
                                    else {
                                        this.replaceLinebreaks(file, newFile => {
                                            this.clinicalPatientFile = newFile;
                                            this.loadClinicalFile(isSample, callback);
                                        })
                                    }
                                }
                                else {
                                    if (isSample) {
                                        this.clinicalSampleParsed = "error";
                                    }
                                    else {
                                        this.clinicalPatientParsed = "error";
                                    }
                                }
                            }
                        }
                    });
                }
                else callback([])
            }),

            /**
             * parses data rows of the clinical data file into an array of objects
             * @param {File} file
             * @param {boolean} isSample - sample related of patient related clinical data
             * @param {object} clinicalAttributes - information about the column headers that is included in the resulting data array
             * @param {returnDataCallback} callback
             */
            loadClinicalBody: action((file, isSample, clinicalAttributes, callback) => {
                let rows = [];
                let abort = false;
                let inconsistentLinebreaks = false;
                Papa.parse(file, {
                    delimiter: "\t",
                    header: true,
                    skipEmptyLines: true,
                    comments: "#",
                    step: (row, parser) => {
                        if (row.errors.length === 0) {
                            const patientId = row.data[0]["PATIENT_ID"];
                            const sampleId = row.data[0]["SAMPLE_ID"];
                            for (let key in row.data[0]) {
                                if (!(key === "PATIENT_ID" || key === "SAMPLE_ID") && row.data[0][key].trim() !== "") {
                                    if (clinicalAttributes[key].datatype === "NUMBER") {
                                        if (isNaN(parseFloat(row.data[0][key]))) {
                                            abort = true;
                                            alert("ERROR: File " + file.name + "- non numeric value of numeric variable " + key);
                                            parser.abort();
                                        }
                                    }
                                    let currRow = {
                                        clinicalAttribute: clinicalAttributes[key],
                                        clinicalAttributeId: clinicalAttributes[key].clinicalAttributeId,
                                        patientId: patientId,
                                        value: row.data[0][key]
                                    };
                                    if (isSample) {
                                        currRow.sampleId = sampleId;
                                    }
                                    rows.push(currRow);
                                }
                            }
                        }
                        else {
                            inconsistentLinebreaks = this.checkErrors(row.errors, row.data[0], file.name);
                            abort = true;
                            parser.abort();
                        }
                    },
                    complete: () => {
                        //only callback if there are no errors
                        if (abort) {
                            if (inconsistentLinebreaks) {
                                if (isSample) {
                                    this.replaceLinebreaks(file, newFile => {
                                        this.clinicalSampleFile = newFile;
                                        this.loadClinicalFile(isSample, callback);
                                    })
                                }
                                else {
                                    this.replaceLinebreaks(file, newFile => {
                                        this.clinicalPatientFile = newFile;
                                        this.loadClinicalFile(isSample, callback);
                                    })
                                }
                            }
                            else {
                                if (isSample) {
                                    this.clinicalSampleParsed = "error";
                                    this.clinicalSampleFile = null;
                                }
                                else {
                                    this.clinicalPatientParsed = "error";
                                    this.clinicalPatientFile = null;
                                }
                            }
                        }
                        else {
                            callback(rows)
                        }
                    }
                });
            }),

            /**
             * parse cnv data files
             * @param {FileList} files - all cnv data files
             * @param {string[]} metaData - datatypes and molecularAlteration types
             */
            setMolecularFiles: action((files, metaData) => {
                let filesParsed = 0;
                this.molecularParsed = "loading";
                Array.from(files).forEach((file, i) => {
                    this.setMolecular(file, metaData[i], () => {
                        filesParsed++;
                        if (filesParsed === files.length) {
                            this.molecularParsed = "finished";
                        }
                    })
                })
            }),

            /**
             * parses an molecular data file into an array of objects
             * @param {File} file
             * @param {loadFinishedCallback} callback
             */
            setMolecular: action((file, metaData, callback) => {
                let firstRow = true;
                let hasEntrezId, hasHugoSymbol;
                let aborted = false;
                let inconsistentLinebreaks = false;
                let data = new Map();
                Papa.parse(file, {
                    delimiter: "\t",
                    header: true,
                    skipEmptyLines: true,
                    step: (row, parser) => {
                        if (row.errors.length === 0) {
                            if (firstRow) {
                                hasEntrezId = "Entrez_Gene_Id" in row.data[0];
                                hasHugoSymbol = "Hugo_Symbol" in row.data[0];
                                if (!hasEntrezId) {
                                    alert("ERROR: file " + file.name + " missing Entrez_Gene_Id column");
                                    aborted = true;
                                    parser.abort();
                                }
                                firstRow = false;
                            }
                            let dataRow = [];
                            let entrezId = parseInt(row.data[0]["Entrez_Gene_Id"], 10);
                            for (let key in row.data[0]) {
                                let dataPoint = {
                                    gene: {entrezGeneId: entrezId, hugoGeneSymbol: ""},
                                    entrezGeneId: entrezId
                                };
                                if (hasHugoSymbol) {
                                    dataPoint.gene.hugoGeneSymbol = row.data[0]["Hugo_Symbol"];
                                }
                                if (key !== "Entrez_Gene_Id" && key !== "Hugo_Symbol") {
                                    let value = row.data[0][key];
                                    if (value !== "NA" && metaData === "NUMBER") {
                                        value = parseFloat(row.data[0][key]);
                                        if (isNaN(value)) {
                                            aborted = true;
                                            alert("ERROR: file " + file.name + " value is not a number");
                                            parser.abort();
                                        }
                                    }
                                    dataPoint.sampleId = key;
                                    dataPoint.value = value;
                                    dataRow.push(dataPoint);
                                }
                            }
                            data.set(entrezId, dataRow);
                        }
                        else {
                            inconsistentLinebreaks = this.checkErrors(row.errors, row.data[0], file.name);
                            aborted = true;
                            parser.abort();
                        }

                    },
                    complete: () => {
                        if (!aborted) {
                            let id = uuidv4();
                            this.molecularProfiles.push({
                                molecularAlterationType: metaData.alterationType,
                                name: file.name,
                                datatype: metaData.datatype,
                                molecularProfileId: id
                            });
                            this.profileData.set(id, data);
                            callback();
                        }
                        else {
                            if (inconsistentLinebreaks) {
                                this.replaceLinebreaks(file, newFile => {
                                    this.setMolecular(newFile, metaData, callback);
                                })
                            }
                            else {
                                this.molecularParsed = "error";
                            }
                        }
                    }
                })
            }),
            setGenePanelMatrix: action(file => {
                this.panelMatrixParsed = "loading";
                this.panelMatrix = {};
                Papa.parse(file, {
                    delimiter: "\t",
                    header: true,
                    skipEmptyLines: true,
                    complete: response => {
                        let hasSampleID = response.meta.fields.includes("SAMPLE_ID");
                        let hasMutations = response.meta.fields.includes("mutations");
                        let hasCNA = response.meta.fields.includes("cna");
                        if (hasSampleID && (hasMutations || hasCNA)) {
                            response.data.forEach(row => {
                                this.panelMatrix[row["SAMPLE_ID"]] = {};
                                if (hasMutations) {
                                    this.panelMatrix[row["SAMPLE_ID"]].mutations = row.mutations;
                                }
                                if (hasCNA) {
                                    this.panelMatrix[row["SAMPLE_ID"]].cna = row.cna;
                                }
                            });
                            this.panelMatrixParsed = "finished";
                        }
                        else {
                            let missingColumns = [];
                            if (hasSampleID) {
                                missingColumns.push("mutations or cna");
                            }
                            else {
                                missingColumns.push("SAMPLE_ID");
                                if (!hasCNA && !hasMutations) {
                                    missingColumns.push("mutations or cna")
                                }
                                else {
                                    if (!hasMutations) {
                                        missingColumns.push("mutations");
                                    }
                                    if (!hasCNA) {
                                        missingColumns.push("cna");
                                    }
                                }
                            }
                            alert("The following columns are missing " + missingColumns);
                            this.panelMatrixParsed = "error";
                        }
                    }
                })
            }),
            setGenePanels: action(files => {
                this.genePanelsParsed = "loading";
                this.genePanels.clear();
                Array.from(files).forEach(file => {
                    let reader = new FileReader();
                    reader.onload = () => {
                        const lines = reader.result.split(/[\r\n]+/g).filter(line => line.trim() !== ""); // tolerate both Windows and Unix linebreaks
                        if (lines.length === 4) {
                            const nameLineEntries = lines[1].split(":");
                            if (nameLineEntries.length === 2) {
                                const panelId = nameLineEntries[1].trim();
                                const geneLineEntries = lines[3].split(":");
                                if (geneLineEntries.length === 2) {
                                    this.genePanels.set(panelId, geneLineEntries[1].split("\t").filter(d => d.trim() !== ""));
                                }
                                else {
                                    alert("Line 4 of file " + file.name + " incorrect");
                                    this.genePanelsParsed = "error";
                                }
                            }
                            else {
                                alert("Line 1 of file " + file.name + " incorrect");
                                this.genePanelsParsed = "error";
                            }
                        }
                        else {
                            alert("Incorrect number of lines");
                            this.genePanelsParsed = "error";
                        }
                        if (this.genePanels.size === files.length) {
                            this.genePanelsParsed = "finished";
                        }
                    };
                    reader.readAsText(file);
                })
            })
        });

        // reactions to errors or removal of files: clears data fields if there is an error or the file is removed
        reaction(() => this.eventsParsed, parsed => {
            if (parsed === "error" || parsed === "empty") {
                this.eventFiles.clear();
            }
        });
        reaction(() => this.mutationsParsed, parsed => {
            if (parsed === "error" || parsed === "empty") {
                this.mutations = [];
            }
        });
        reaction(() => this.molecularParsed, parsed => {
            if (parsed === "error" || parsed === "empty") {
                let spliceIndices = [];
                this.molecularProfiles.forEach((profile, i) => {
                    if (profile.molecularAlterationType === "COPY_NUMBER_ALTERATION") {
                        spliceIndices.push(i);
                        this.profileData.delete(profile.molecularProfileId);
                    }
                });
                for (let i = spliceIndices.length - 1; i >= 0; i--) {
                    this.molecularProfiles.splice(spliceIndices[i], 1);
                }
            }
        });
        reaction(() => this.clinicalSampleParsed, parsed => {
            if (parsed === "error" || parsed === "empty") {
                this.clinicalSampleFile = null;
            }
        });
        reaction(() => this.clinicalPatientParsed, parsed => {
            if (parsed === "error" || parsed === "empty") {
                this.clinicalPatientFile = null;
            }
        });
        reaction(() => this.panelMatrixParsed, parsed => {
            if (parsed === "empty") {
                this.panelMatrix = {};
            }
            else if (parsed === "finished" && (this.genePanelsParsed === "finished"
                || (this.genePanelsParsed === "error" && this.genePanels.size > 0))) {
                let broke = false;
                for (let sample in this.panelMatrix) {
                    for (let key in this.panelMatrix[sample]) {
                        if (!this.genePanels.has(this.panelMatrix[sample][key]) && this.panelMatrix[sample][key] !== "NA") {
                            this.genePanelsParsed = "error";
                            this.panelMatrixParsed = "error";
                            alert("ERROR: Gene panel Ids don't mach panel ids in panel matrix");
                            broke = true;
                            break;
                        }
                    }
                    if (broke) {
                        break;
                    }
                }
                if (!broke) {
                    this.genePanelsParsed = "finished";
                }
            }
        });
        reaction(() => this.genePanelsParsed, parsed => {
            if (parsed === "empty") {
                this.genePanels.clear();
            }
            else if (parsed === "finished" && (this.panelMatrixParsed === "finished"
                || (this.panelMatrixParsed === "error" && Object.keys(this.panelMatrixParsed).length > 0))) {
                let broke = false;
                for (let sample in this.panelMatrix) {
                    for (let key in this.panelMatrix[sample]) {
                        if (!this.genePanels.has(this.panelMatrix[sample][key]) && this.panelMatrix[sample][key] !== "NA") {
                            this.genePanelsParsed = "error";
                            this.panelMatrixParsed = "error";
                            alert("ERROR: Gene panel Ids don't mach panel ids in panel matrix");
                            broke = true;
                            break;
                        }
                    }
                    if (broke) {
                        break;
                    }
                }
                if (!broke) {
                    this.panelMatrixParsed = "finished";
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
        const requiredFields = ["PATIENT_ID", "START_DATE", "EVENT_TYPE"];
        let missingFields = requiredFields.filter(field => !fields.includes(field));
        if (missingFields.length > 0) {
            alert("ERROR: Column headers do not match. Columns " + missingFields + " are missing in file " + fileName);
            return false;
        }
        else if (eventType === "SPECIMEN" && !fields.includes("SAMPLE_ID")) {
            alert("ERROR: SAMPLE_ID is missing in timeline SPECIMEN file " + fileName);
            return false;
        }
        else {
            return true;
        }
    }


    /**
     * checks header of mutation file
     * @param {string[]} fields
     * @param {string} fileName
     * @returns {boolean} valid or not valid
     */
    static checkMutationFileHeader(fields, fileName) {
        const requiredFields = ["Hugo_Symbol", "Variant_Classification", "Tumor_Sample_Barcode", "HGVSp_Short"];
        let missingFields = requiredFields.filter(field => !fields.includes(field));
        if (missingFields.length > 0) {
            alert("ERROR: Column headers do not match. Columns " + missingFields + " are missing in file " + fileName);
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
    checkErrors(errors, data, fileName) {
        let inconsistentLinebreak = false;
        let errorMessages = [];
        errors.forEach(error => {
            if (error.code === "TooManyFields") {
                for (let i = 0; i < data["__parsed_extra"].length; i++) {
                    if (data["__parsed_extra"][i].includes("\n") || data["__parsed_extra"][i].includes("\r") || data["__parsed_extra"][i].includes("\r\n")) {
                        inconsistentLinebreak = true;
                        break;
                    }
                }
            }
            if (!inconsistentLinebreak) {
                errorMessages.push(error.message + " at data row " + error.row);
            }
        });
        if (errorMessages.length > 0) {
            alert("ERROR wrong file format in file " + fileName + ": " + errorMessages);
        }
        return inconsistentLinebreak;
    }

    /**
     * replaces linebreaks in a file
     * @param {File} file
     * @param {replacedFileCallback} callback - the callback that returns the new file
     */
    replaceLinebreaks(file, callback) {
        let reader = new FileReader();
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