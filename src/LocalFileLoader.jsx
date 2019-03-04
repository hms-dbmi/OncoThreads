import * as Papa from "papaparse"
import {extendObservable} from "mobx";

//TODO: implement more checks

class LocalFileLoader {
    constructor() {
        this.patients = [];
        this.rawEvents = [];
        this.rawClinicalSampleData = [];
        this.rawClinicalPatientData = [];
        this.molecularProfiles=[];
        extendObservable(this, {
            specimenParsed: false,
            clinicalPatientParsed: false,
            clinicalSampleParsed: false
        })
    }

    /**
     * Parse specimen file
     * @param file
     */
    loadSpecimenFile(file) {
        this.specimenParsed = false;
        let allKeysPresent = false;
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
                if (!(row.data[0]["PATIENT_ID"] in this.rawEvents)) {
                    this.rawEvents[row.data[0]["PATIENT_ID"]] = [];
                }
                let date = parseInt(row.data[0]["START_DATE"], 10);
                if (!isNaN(date)) {
                    this.rawEvents[row.data[0]["PATIENT_ID"]].push({
                        attributes: [{key: "SURGERY", value: row.data[0]["SURGERY"]}, {
                            key: "SAMPLE_ID",
                            value: row.data[0]["SAMPLE_ID"]
                        }],
                        eventType: row.data[0]["EVENT_TYPE"],
                        patientId: row.data[0]["PATIENT_ID"],
                        startNumberOfDaysSinceDiagnosis: parseInt(row.data[0]["START_DATE"], 10)
                    });
                }
                else {
                    alert("ABORT: START_DATE is not a number");
                    parser.abort();
                }
            },
            complete: () => {
                if (allKeysPresent) {
                    for (let patient in this.rawEvents) {
                        this.rawEvents[patient].sort((a, b) => {
                            return a.startNumberOfDaysSinceDiagnosis - b.startNumberOfDaysSinceDiagnosis;
                        })
                    }
                    this.specimenParsed = true;
                }

            }
        });
    }

    /**
     * Parse clinical data file
     * @param file
     * @param isSample
     */
    loadClinicalFile(file, isSample) {
        if (isSample) {
            this.clinicalSampleParsed = false;
        }
        else {
            this.clinicalPatientParsed = false
        }
        let clinicalAttributes = {};
        let allKeysPresent = false;
        let rows = [];
        let sampleData = false;
        let rowCounter = 0;
        //parse header
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
                        if (row.data[0][key] === "PATIENT_ID") {
                            allKeysPresent = true
                        }
                        if (row.data[0][key] === "SAMPLE_ID") {
                            if (!isSample) {
                                alert("ABORT: Clinical patient data files should not contain column SAMPLE_ID");
                                allKeysPresent = false;
                                parser.abort()
                            }
                            sampleData = true;
                        }
                        clinicalAttributes[key].clinicalAttributeId = row.data[0][key];
                        clinicalAttributes[row.data[0][key]] = clinicalAttributes[key];
                        delete clinicalAttributes[key];
                    }
                    if (sampleData === false && isSample) {
                        alert("ABORT: Column SAMPLE_ID missing");
                        allKeysPresent = false;
                    }
                }
                else if (rowCounter > 3) {
                    parser.abort();
                }
                rowCounter++;
            },
            complete: () => {
                //parse data
                if (allKeysPresent) {
                    Papa.parse(file, {
                        delimiter: "\t",
                        header: true,
                        skipEmptyLines: true,
                        comments: "#",
                        step: row => {
                            const patientId = row.data[0]["PATIENT_ID"];
                            const sampleId = row.data[0]["SAMPLE_ID"];
                            for (let key in row.data[0]) {
                                if (!(key === "PATIENT_ID" || key === "SAMPLE_ID")) {
                                    let currRow = {
                                        clinicalAttribute: clinicalAttributes[key],
                                        clinicalAttributeId: clinicalAttributes[key].clinicalAttributeId,
                                        patientId: patientId,
                                        value: row.data[0][key]
                                    };
                                    if (sampleData) {
                                        currRow.sampleId = sampleId;
                                    }
                                    rows.push(currRow);
                                }
                            }
                        },
                        complete: () => {
                            if (sampleData) {
                                this.rawClinicalSampleData = rows;
                                this.clinicalSampleParsed = true
                            }
                            else {
                                this.rawClinicalPatientData = rows;
                                this.clinicalPatientParsed = true

                            }
                        }
                    });
                }
            }
        });


    }

}

export default LocalFileLoader;