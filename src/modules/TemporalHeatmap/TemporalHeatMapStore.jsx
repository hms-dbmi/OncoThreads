import {extendObservable} from "mobx";

class TemporalHeatMapStore {
    constructor() {
        this.clinicalEvents = {};
        this.sampleClinicalMap = {};
        this.sampleTimelineMap = {};
        this.sampleStructure = {};
        this.numberOfTimepoints = 0;
        extendObservable(this, {
            sampleData: [],
            primaryVariables: [],
            isGrouped: [],
            currentVariables: [],
            currentTransitionData: [],
            clinicalSampleCategories: [],
            eventCategories: [],
            numberOfpatients: 0,
            patientsPerTimepoint: []
        })
    }

    setClinicalEvents(events) {
        this.clinicalEvents = events;
    }

    setSampleClinicalMap(map) {
        this.sampleClinicalMap = map;
    }

    setSampleTimelineMap(map) {
        this.sampleTimelineMap = map;
    }

    setClinicalSampleCategories(categories) {
        this.clinicalSampleCategories = categories;
    }

    setEventCategories(categories) {
        this.eventCategories = categories;
    }

    setSampleStructure(sampleStructure) {
        this.sampleStructure = sampleStructure;
    }

    setNumberOfTimepoints(noTP) {
        this.numberOfTimepoints = noTP;
    }

    setPatientsPerTimepoint(patients) {
        this.patientsPerTimepoint = patients
    }

    setNumberOfPatients(patients) {
        this.numberOfPatients = patients;
    }

    initialize(category) {
        this.primaryVariables = Array(this.numberOfTimepoints).fill(category);
        this.isGrouped = Array(this.numberOfTimepoints).fill(false);
    }

    setIsGrouped(timepoint, boolean) {
        let isGrouped=this.isGrouped.slice();
        isGrouped[timepoint]=boolean;
        this.isGrouped=isGrouped;
    }

    setPrimaryVariable(timepoint, category) {
        let primaryVariables=this.primaryVariables.slice();
        primaryVariables[timepoint]=category;
        this.primaryVariables= primaryVariables;
    }

    /**
     * adds variable to heatmap sample data
     * @param timepoint: current timepoint
     * @param newVarIndex: index where newly added variable should go
     * @param patient: current patient
     * @param variable: variable to add
     */
    addHeatmapVariable(timepoint, newVarIndex, patient, variable) {
        let sampleData=this.sampleData.slice();
        if (timepoint >= sampleData.length) {
            sampleData.push({"heatmap": [{"variable": variable, "data": []}], "group": []});
        }
        if (newVarIndex >= sampleData[timepoint].heatmap.length) {
            sampleData[timepoint].heatmap.push({"variable": variable, "data": []});
        }
        sampleData[timepoint].heatmap[newVarIndex].data.push({
            "patient": patient,
            "value": this.sampleClinicalMap[this.sampleStructure[patient].timepoints[timepoint][0]][variable]
        });
        this.sampleData=sampleData;
    }

    /**
     * removes variable from heatmap sample data
     * @param timepoint
     * @param variable
     */
    removeHeatmapVariable(timepoint, variable) {
        let removeIndex = -1;
        for (let i = 0; i < timepoint.heatmap.length; i++) {
            if (timepoint.heatmap[i].variable === variable) {
                removeIndex = i;
                break;
            }
        }
        timepoint.heatmap.splice(removeIndex, 1);
    }

    /**
     * adds variable to sample data
     * 1. Add heatmap sample data
     * 2. Regroup data at timepoints which are grouped
     * @param variable
     */
    addVariable(variable) {
        let newVarIndex = this.currentVariables.length;
        this.currentVariables.push(variable);
        for (let patient in this.sampleStructure) {
            for (let timepoint in this.sampleStructure[patient].timepoints) {
                let tpNumber = Number(timepoint);
                this.addHeatmapVariable(tpNumber, newVarIndex, patient, variable);
            }
        }
        const _self = this;
        this.isGrouped.forEach(function (d, i) {
            if (d) {
                _self.groupTimepoint(i, _self.primaryVariables[i])
            }
        })
    }

    /**
     * Removes a variable from sample data
     * @param variable
     */
    removeVariable(variable) {
        const _self = this;
        this.sampleData.forEach(function (timepoint) {
            _self.removeHeatmapVariable(timepoint, variable);
        });
        this.currentVariables.splice(this.currentVariables.indexOf(variable), 1);
        this.isGrouped.forEach(function (d, i) {
            if (d) {
                _self.groupTimepoint(i, _self.primaryVariables[i])
            }
        })
    }

    /**
     * computes grouping of variables
     * @param timepoint
     * @param variable
     */
    groupTimepoint(timepoint, variable) {
        const index = this.sampleData[timepoint].heatmap.map(function (d, i) {
            return d.variable
        }).indexOf(variable);
        this.sampleData[timepoint].group = [];
        let partitionIndex = 0;
        for (let i = 0; i < this.sampleData[timepoint].heatmap[index].data.length; i++) {
            const currPrimary = this.sampleData[timepoint].heatmap[index].data[i].value;
            let variableIndex = this.sampleData[timepoint].group.map(function (e) {
                return e.partition;
            }).indexOf(currPrimary);
            if (variableIndex === -1) {
                let rows = this.currentVariables.map(function (d, i) {
                    return {variable: d, counts: []}
                });
                this.sampleData[timepoint].group.push({partition: currPrimary, rows: rows});
                variableIndex = partitionIndex;
                partitionIndex += 1;
            }
            this.addInstance(variableIndex,currPrimary,timepoint,index);
            for (let j = 0; j < this.sampleData[timepoint].heatmap.length; j++) {
                if (this.sampleData[timepoint].heatmap[j].variable !== variable) {
                    let currSecondary = this.sampleData[timepoint].heatmap[j].data[i].value;
                    this.addInstance(variableIndex,currSecondary,timepoint,j);
                }
            }

        }
        console.log(this.sampleData);
        this.setIsGrouped(timepoint, true);
    }

    addInstance(index,currKey,timepoint,j) {
        let rowIndex = this.sampleData[timepoint].group[index].rows.map(function (e) {
            return e.variable;
        }).indexOf(this.sampleData[timepoint].heatmap[j].variable);
        let keyIndex = this.sampleData[timepoint].group[index].rows[rowIndex].counts.map(function (e) {
            return e.key
        }).indexOf(currKey);
        if (keyIndex === -1) {
            this.sampleData[timepoint].group[index].rows[rowIndex].counts.push({
                "key": currKey,
                "value": 1
            })
        }
        else {
            this.sampleData[timepoint].group[index].rows[rowIndex].counts[keyIndex].value += 1;
        }
    }

    static hasPartition(partitions, partition) {
        for (let i = 0; i < partitions.length; i++) {
            if (partitions[i].partition === partition) {
                return partitions[i];
            }
        }
        return false;
    }

    sortHeatmapTimepoint(timepoint, variable) {
        let currTP = [];
        let index = -1;
        this.sampleData[timepoint].heatmap.forEach(function (d, i) {
            if (d.variable === variable) {
                currTP = d;
                index = i;
            }
        });
        this.sampleData[timepoint].heatmap[index].data = currTP.data.sort(function (a, b) {
            if (a.value < b.value)
                return -1;
            if (a.value > b.value)
                return 1;
            else {
                return 0;
            }
        });
    }


    getTransitionData(category) {
        let currentTransitionData = [];
        for (let patient in this.sampleStructure) {
            let transitions = [];
            let counter = 0;
            while (counter + 1 < Object.keys(this.sampleStructure[patient].timepoints).length) {
                const current_sample = this.sampleTimelineMap[this.sampleStructure[patient].timepoints[counter][0]];
                const next_sample = this.sampleTimelineMap[this.sampleStructure[patient].timepoints[counter + 1][0]];
                if (counter === 0) {
                    transitions.push({
                        "to": this.sampleStructure[patient].timepoints[counter][0],
                        "transitions": this.getTransitionBeforeSamples(patient, category, current_sample)
                    });
                }
                else if (counter + 1 === Object.keys(this.sampleStructure[patient].timepoints).length - 1) {
                    transitions.push({
                        "from": this.sampleStructure[patient].timepoints[counter + 1][0],
                        "transitions": this.getTransitionAfterSamples(patient, category, next_sample)
                    });
                }
                else transitions.push({
                        "from": this.sampleStructure[patient].timepoints[counter][0],
                        "to": this.sampleStructure[patient].timepoints[counter + 1][0],
                        "transitions": this.getTransitionBetweenSamples(patient, category, current_sample, next_sample)
                    });
            }
        }
    }

    getTransitionBeforeSamples(patient, category, sample) {
        let transitions = [];
        for (let i = 0; i < this.clinicalEvents[patient].length; i++) {
            let currEvent = this.clinicalEvents[patient][i];
            if (currEvent.startNumberOfDaysSinceDiagnosis < sample.startNumberOfDaysSinceDiagnosis) {
                if ("endNumberOfDaysSinceDiagnosis" in currEvent) {
                    if (currEvent.endNumberOfDaysSinceDiagnosis < sample.startNumberOfDaysSinceDiagnosis) {
                        transitions.push({
                            "start": currEvent.startNumberOfDaysSinceDiagnosis,
                            "end": currEvent.endNumberOfDaysSinceDiagnosis,
                            "attributes": currEvent.attributes
                        })
                    }
                }
                else {
                    transitions.push({
                        "start": currEvent.startNumberOfDaysSinceDiagnosis,
                        "attributes": currEvent.attributes
                    })
                }
            }
            else break;
        }
        return (transitions)
    }

    getTransitionBetweenSamples(patient, category, sample1, sample2) {
        let transitions = [];
        let betweenSamples = false;
        for (let i = 0; i < this.clinicalEvents[patient].length; i++) {
            let currEvent = this.clinicalEvents[patient][i];
            if (currEvent.startNumberOfDaysSinceDiagnosis > sample1.startNumberOfDaysSinceDiagnosis) {
                betweenSamples = true;
            }
            if (betweenSamples && currEvent.eventType === category) {
                if ("endNumberOfDaysSinceDiagnosis" in currEvent) {
                    if (currEvent.endNumberOfDaysSinceDiagnosis < sample2.startNumberOfDaysSinceDiagnosis) {
                        transitions.push({
                            "start": currEvent.startNumberOfDaysSinceDiagnosis,
                            "end": currEvent.endNumberOfDaysSinceDiagnosis,
                            "attributes": currEvent.attributes
                        })
                    }
                }
                else {
                    transitions.push({
                        "start": currEvent.startNumberOfDaysSinceDiagnosis,
                        "attributes": currEvent.attributes
                    })
                }
            }
            if (currEvent.startNumberOfDaysSinceDiagnosis > sample2.startNumberOfDaysSinceDiagnosis) {
                break;
            }
        }
        return (transitions)
    }

    getTransitionAfterSamples(patient, category, sample) {
        let transitions = [];
        for (let i = 0; i < this.clinicalEvents[patient].length; i++) {
            let currEvent = this.clinicalEvents[patient][i];
            if (currEvent.startNumberOfDaysSinceDiagnosis > sample.startNumberOfDaysSinceDiagnosis) {
                if ("endNumberOfDaysSinceDiagnosis" in currEvent) {
                    transitions.push({
                        "start": currEvent.startNumberOfDaysSinceDiagnosis,
                        "end": currEvent.endNumberOfDaysSinceDiagnosis,
                        "attributes": currEvent.attributes
                    })
                }
                else {
                    transitions.push({
                        "start": currEvent.startNumberOfDaysSinceDiagnosis,
                        "attributes": currEvent.attributes
                    })
                }
            }
            else break;
        }
        return (transitions)
    }
}

export default TemporalHeatMapStore;