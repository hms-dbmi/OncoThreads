import * as Papa from "papaparse"
import {extendObservable} from "mobx";

//TODO: implement more checks

class LocalFileLoader {
    constructor() {
        this.patients = [];
        this.samples = [];
        this.eventFiles = new Map();
        this.clinicalSampleFile = null;
        this.clinicalPatientFile = null;
        this.molecularProfiles = [];
        extendObservable(this, {
            specimenParsed: false,
            eventsParsed: false,
            clinicalPatientParsed: false,
            clinicalSampleParsed: false
        })
    }

    /**
     * sets current event files if headers are correct and file of type SPECIMEN is contained
     * @param files
     * @param callback
     */
    setEventFiles(files, callback) {
        let eventFiles = new Map();
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
                        this.eventsParsed = undefined;
                    }
                    parser.abort();
                },
                complete: () => {
                    if (eventFiles.size === files.length) {
                        if (eventFiles.has("SPECIMEN")) {
                            this.setPatientsAndSamples(eventFiles.get("SPECIMEN"), () => {
                                this.eventFiles = eventFiles;
                                this.eventsParsed = true;
                                callback();
                            });
                        }
                        else {
                            this.eventsParsed = undefined;
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
        const validEventTypes = ["SPECIMEN", "TREATMENT", "LAB_TEST", "IMAGING", "STATUS", "SURGERY"];
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
            else if (validEventTypes.includes(row["EVENT_TYPE"])) {
                return true;
            }
            else {
                alert("ERROR: unknown EVENT_TYPE " + row["EVENT_TYPE"] + " in file " + fileName);
                return false;
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
                    this.eventsParsed = undefined;
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


    loadEventFile(file, rawEvents, callback) {
        let abort = false;
        let firstRow = true;
        let hasEndDate = false;
        Papa.parse(file, {
            delimiter: "\t",
            header: true,
            skipEmptyLines: true,
            step: (row, parser) => {
                if(row.errors.length===0) {
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
                    const validEndDate = !hasEndDate || (hasEndDate && !isNaN(parseInt(row.data[0]["STOP_DATE"], 10)));
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
                        this.eventsParsed = undefined;
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
                else{
                    alert("ERROR: internal parsing error. Please make sure that the input file is a valid tab separated file with only one type of newline character.");
                    console.log(row);
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
            this.clinicalSampleParsed = false;
        }
        else {
            this.clinicalPatientParsed = false
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
                        this.clinicalSampleParsed = true
                    }
                    else {
                        this.clinicalPatientFile = file;
                        this.clinicalPatientParsed = true
                    }

                }
                else {
                    if (isSample) {
                        this.clinicalSampleParsed = undefined
                    }
                    else {
                        this.clinicalPatientParsed = undefined
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
        let rows = [];
        let abort = false;
        let rowCounter = 0;
        //parse header
        if (file !== null) {
            Papa.parse(file, {
                delimiter: "\t",
                header: true,
                skipEmptyLines: true,
                step: (row, parser) => {
                    if (rowCounter === 0) {
                        for (let key in row.data[0]) {
                            clinicalAttributes[key] = {displayName: key, description: row.data[0][key]}
                        }
                    }
                    else if (rowCounter === 1) {
                        for (let key in row.data[0]) {
                            clinicalAttributes[key].datatype = row.data[0][key]
                        }
                    }
                    else if (rowCounter === 3) {
                        for (let key in row.data[0]) {
                            clinicalAttributes[key].clinicalAttributeId = row.data[0][key];
                            clinicalAttributes[row.data[0][key]] = clinicalAttributes[key];
                            delete clinicalAttributes[key];
                        }
                    }
                    else if (rowCounter > 3) {
                        parser.abort();
                    }
                    rowCounter++;
                },
                complete: () => {
                    //parse data
                    Papa.parse(file, {
                        delimiter: "\t",
                        header: true,
                        skipEmptyLines: true,
                        comments: "#",
                        step: (row, parser) => {
                            const patientId = row.data[0]["PATIENT_ID"];
                            const sampleId = row.data[0]["SAMPLE_ID"];
                            /*
                            if (!this.patients.includes(patientId)) {
                                abort = true;
                                alert("ERROR: Unknown PATIENT_ID " + patientId + " in " + file.name);
                            }
                            else if (isSample && !this.samples.includes(sampleId)) {
                                abort = true;
                                alert("ERROR: Unknown SAMPLE_ID " + sampleId + " in " + file.name);
                            }
                            if (abort) {
                                parser.abort();
                            }*/
                            for (let key in row.data[0]) {
                                if (!(key === "PATIENT_ID" || key === "SAMPLE_ID")) {
                                    if (clinicalAttributes[key].datatype === "NUMBER") {
                                        if (isNaN(parseFloat(row.data[0][key]))) {
                                            abort = true;
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
                        },
                        complete: () => {
                            //only callback if there are no errors
                            if (abort) {
                                if (isSample) {
                                    this.clinicalSampleParsed = undefined;
                                    this.clinicalSampleFile = null;
                                }
                                else {
                                    this.clinicalPatientParsed = undefined;
                                    this.clinicalPatientFile = null;
                                }
                            }
                            else {
                                callback(rows)
                            }
                        }
                    });

                }
            });
        }
        else callback([])


    }

}

export default LocalFileLoader;