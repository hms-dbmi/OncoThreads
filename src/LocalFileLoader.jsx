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
            clinicalPatientParsed: false,
            clinicalSampleParsed: false
        })
    }

    /**
     * sets the file for specimen information
     * @param file
     * @param callback
     */
    setSpecimenFile(file, callback) {
        this.specimenParsed = false;
        let allKeysPresent = false;
        let dateCorrect = true;
        Papa.parse(file, {
            delimiter: "\t",
            header: true,
            skipEmptyLines: true,
            step: (row, parser) => {
                if (!allKeysPresent) {
                    const hasPatientId = "PATIENT_ID" in row.data[0];
                    const hasStartDate = "START_DATE" in row.data[0];
                    const hasEventType = "EVENT_TYPE" in row.data[0];
                    const hasSampleId = "SAMPLE_ID" in row.data[0];
                    if (hasPatientId && hasStartDate && hasEventType && hasSampleId) {
                        allKeysPresent = true;
                    }
                    else {
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
                        if (!hasSampleId) {
                            missingColumns.push("SAMPLE_ID")
                        }
                        alert("Column headers of Specimen Timeline file do not match! Columns " + missingColumns + " are missing");
                        parser.abort();
                    }
                }
                if (!this.patients.includes(row.data[0]["PATIENT_ID"])) {
                    this.patients.push(row.data[0]["PATIENT_ID"]);
                }
                if (!this.samples.includes(row.data[0]["SAMPLE_ID"])) {
                    this.samples.push(row.data[0]["SAMPLE_ID"]);
                }
                let date = parseInt(row.data[0]["START_DATE"], 10);
                if (isNaN(date)) {
                    alert("ERROR: START_DATE is not a number");
                    dateCorrect = false;
                    parser.abort();
                }
            },
            complete: () => {
                if (allKeysPresent && dateCorrect) {
                    this.specimenParsed = true;
                    this.eventFiles.set("SPECIMEN", file);
                    callback();
                }

            }
        });
    }

    /**
     * Parse specimen file
     * @param file
     * @param rawEvents
     * @param callback
     */
    loadSpecimenFile(file, rawEvents, callback) {
        Papa.parse(file, {
            delimiter: "\t",
            header: true,
            skipEmptyLines: true,
            step: row => {
                if (!(row.data[0]["PATIENT_ID"] in rawEvents)) {
                    rawEvents[row.data[0]["PATIENT_ID"]] = [];
                }
                rawEvents[row.data[0]["PATIENT_ID"]].push({
                    attributes: [{key: "SURGERY", value: row.data[0]["SURGERY"]}, {
                        key: "SAMPLE_ID",
                        value: row.data[0]["SAMPLE_ID"]
                    }],
                    eventType: row.data[0]["EVENT_TYPE"],
                    patientId: row.data[0]["PATIENT_ID"],
                    startNumberOfDaysSinceDiagnosis: parseInt(row.data[0]["START_DATE"], 10)
                });
            },
            complete: () => {
                for (let patient in rawEvents) {
                    rawEvents[patient].sort((a, b) => {
                        return a.startNumberOfDaysSinceDiagnosis - b.startNumberOfDaysSinceDiagnosis;
                    })
                }
                callback();

            }
        });
    }

    loadEvents(callback) {
        let rawEvents = [];
        if (this.eventFiles.has("SPECIMEN")) {
            this.loadSpecimenFile(this.eventFiles.get("SPECIMEN"), rawEvents, () => {
                callback(rawEvents);
            })
        }
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
                            if (!this.patients.includes(patientId)) {
                                abort = true;
                                alert("ERROR: Unknown PATIENT_ID " + patientId + " in " + file.name);
                            }
                            else if (isSample && !this.samples.includes(sampleId)) {
                                abort = true;
                                alert("ERROR: Unknown PATIENT_ID " + patientId + " in " + file.name);
                            }
                            if (abort) {
                                parser.abort();
                            }
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
                            if (abort) {
                                if (isSample) {
                                    this.clinicalSampleParsed = false;
                                    this.clinicalSampleFile=null;
                                }
                                else {
                                    this.clinicalPatientParsed = false;
                                    this.clinicalPatientFile=null;
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