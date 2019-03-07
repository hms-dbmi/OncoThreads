import * as Papa from "papaparse"
import {extendObservable} from "mobx";
import uuidv4 from 'uuid/v4';

//TODO: implement more checks

class LocalFileLoader {
    constructor() {
        this.patients = [];
        this.samples = [];
        this.mutations = [];
        this.mutationCounts = [];
        this.eventFiles = new Map();
        this.clinicalSampleFile = null;
        this.clinicalPatientFile = null;
        this.molecularProfiles = [];
        extendObservable(this, {
            eventsParsed: "empty", //empty,loading,finished,error
            mutationsParsed: "empty",
            clinicalPatientParsed: "empty",
            clinicalSampleParsed: "empty"
        })
    }

    /**
     * sets current event files if headers are correct and file of type SPECIMEN is contained
     * @param files
     * @param callback
     */
    setEventFiles(files, callback) {
        let eventFiles = new Map();
        this.eventsParsed = "loading";
        Array.from(files).forEach(d => {
            Papa.parse(d, {
                delimiter: "\t",
                header: true,
                skipEmptyLines: true,
                step: (row, parser) => {
                    parser.pause();
                    if (LocalFileLoader.checkTimelineFileHeader(row.data[0], d.name)) {
                        eventFiles.set(row.data[0]["EVENT_TYPE"], d);
                    }
                    else {
                        this.eventsParsed = "error";
                    }
                    parser.abort();
                },
                complete: () => {
                    if (eventFiles.size === files.length) {
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
    }

    /**
     * checks the header of a timeline file
     * @param row
     * @param fileName
     * @returns {*}
     */
    static checkTimelineFileHeader(row, fileName) {
        const hasPatientId = "PATIENT_ID" in row;
        const hasStartDate = "START_DATE" in row;
        const hasEventType = "EVENT_TYPE" in row;
        let missingColumns = [];
        if (!hasPatientId) {
            missingColumns.push("PATIENT_ID")
        }
        if (!hasStartDate) {
            missingColumns.push("START_DATE")
        }
        if (!hasEventType) {
            missingColumns.push("EVENT_TYPE")
        }
        if (missingColumns.length > 0) {
            alert("ERROR: Column headers do not match. Columns " + missingColumns + " are missing in file " + fileName);
        }
        if (hasEventType && hasPatientId && hasStartDate) {
            if (row["EVENT_TYPE"] === "SPECIMEN") {
                return LocalFileLoader.checkSpecimenFileHeader(row, fileName);
            }
            else {
                return true;
            }
        }
        else {
            return false;
        }
    }

    /**
     * checks header of a SPECIMEN timeline file
     * @param row
     * @param fileName
     * @returns {boolean}
     */
    static checkSpecimenFileHeader(row, fileName) {
        if (!("SAMPLE_ID" in row)) {
            alert("ERROR: SAMPLE_ID is missing in timeline SPECIMEN file " + fileName);
            return false;
        }
        else {
            return true;
        }
    }

    /**
     * sets patients and samples
     * @param file
     * @param callback
     */
    setPatientsAndSamples(file, callback) {
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
    }

    /**
     * sets mutations
     * @param file
     */
    setMutations(file) {
        const skipMutations = ["Silent", "Intron", "3'UTR", "3'Flank", "5'UTR", "5'Flank", "IGR", "RNA"];
        let firstRow = true;
        let hasVaf = false;
        let aborted = false;
        let inconsistentLinebreaks = false;
        let mutations = [];
        let counts = {};
        this.mutationsParsed = "loading";
        this.replaceLinebreaks(file, newFile => {
            Papa.parse(newFile, {
                delimiter: "\t",
                header: true,
                skipEmptyLines: true,
                step: (row, parser) => {
                    if (row.errors.length === 0) {
                        if (firstRow) {
                            if (LocalFileLoader.checkMutationFileHeader(row.data[0], file.name)) {
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
                                sampleId: sample,
                                mutationCount: count
                            }
                        });
                        this.mutations = mutations;
                        this.mutationsParsed = "finished";
                    }
                    else {
                        this.mutationsParsed = "error";
                        if (inconsistentLinebreaks) {
                            this.replaceLinebreaks(file, newFile => {
                                this.setMutations(newFile);
                            })
                        }
                    }
                }
            })
        })
    }

    /**
     * checks header of mutation file
     * @param row
     * @param fileName
     * @returns {boolean}
     */
    static checkMutationFileHeader(row, fileName) {
        const hasHugo = "Hugo_Symbol" in row;
        const hasMutationType = "Variant_Classification" in row;
        const hasSampleId = "Tumor_Sample_Barcode" in row;
        const hasProteinChange = "HGVSp_Short" in row;
        let missingColumns = [];
        if (!hasHugo) {
            missingColumns.push("Hugo_Symbol")
        }
        if (!hasMutationType) {
            missingColumns.push("Variant_Classification")
        }
        if (!hasSampleId) {
            missingColumns.push("Tumor_Sample_Barcode")
        }
        if (!hasProteinChange) {
            missingColumns.push("HGVSp_Short")
        }
        if (missingColumns.length > 0) {
            alert("ERROR: Column headers do not match. Columns " + missingColumns + " are missing in file " + fileName);
        }
        return (hasHugo && hasMutationType && hasSampleId && hasProteinChange);
    }

    /**
     * loads an event file
     * @param file
     * @param rawEvents
     * @param callback
     */
    loadEventFile(file, rawEvents, callback) {
        let abort = false;
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
                        abort = true;
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
                    abort = true;
                    parser.abort();
                }
            },
            complete: () => {
                if (!abort) {
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
    }

    /**
     * loads all events
     * @param callback
     */
    loadEvents(callback) {
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
    }

    /**
     * sets the clinical file if the header is in the right format
     * @param file
     * @param isSample
     */
    setClinicalFile(file, isSample) {
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
    }

    /**
     * Parse clinical data file
     * @param isSample
     * @param callback
     */
    loadClinicalFile(isSample, callback) {
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
    }

    loadClinicalBody(file, isSample, clinicalAttributes, callback) {
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
                                    alert("ERROR: File "+file.name+"- non numeric value of numeric variable "+key);
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
                    inconsistentLinebreaks = this.checkErrors(row.errors, row[0].data, file.name);
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
    }

    static getSpliced(index, value) {
        let returnVal = value;
        if (index === 0) {
            returnVal = value.substring(1);
        }
        return returnVal;
    }

    /**
     * checks errors and throws error messages
     * @param errors
     * @param data
     * @param fileName
     * @returns {boolean}
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
                if (inconsistentLinebreak) {
                    errorMessages.push("Inconsistent use of linebreaks at data row " + error.row);

                }
                else {
                    errorMessages.push(error.message + " at data row " + error.row);
                }
            }
            else {
                errorMessages.push(error.message + " at data row " + error.row);
            }
        });
        alert("ERROR wrong file format in file " + fileName + ": " + errorMessages);
        return inconsistentLinebreak;
    }

    /**
     * replaces linebreak;
     * @param file
     * @param callback
     */
    replaceLinebreaks(file, callback) {
        let reader = new FileReader();
        reader.onload = () => {
            callback(new File([reader.result.replace(/(?:\r\n|\r|\n)/g, '\n')], file.name));
        };
        reader.readAsText(file);
    }

}

export default LocalFileLoader;