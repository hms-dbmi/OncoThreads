import {extendObservable} from "mobx";

class DataStore {
    constructor() {
        this.clinicalEvents = {};
        this.sampleClinicalMap = {};
        this.sampleStructure = {};
        this.numberOfTimepoints = 0;
        extendObservable(this, {
            timepointData: [],
            transitionData: [],
            primaryVariables: [],
            isGrouped: [],
            currentVariables: [],
            currentTransitionData: [],
            clinicalSampleCategories: [],
            eventCategories: [],
            numberOfpatients: 0,
            patientOrderPerTimepoint: [],
            patientsPerTimepoint: [],
            allPatients: []
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

    setAllPatients(patients) {
        this.allPatients = patients;
    }

    setNumberOfTimepoints(noTP) {
        this.numberOfTimepoints = noTP;
    }

    setPatientOrderPerTimepoint(patients) {
        this.patientOrderPerTimepoint = patients;
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
        for (let i = 0; i < this.numberOfTimepoints - 1; i++) {
            this.transitionData.push({
                type: "line",
                data: {"from": this.patientsPerTimepoint[i], "to": this.patientsPerTimepoint[i + 1]}
            })
        }
        console.log(this.transitionData);
    }

    setIsGrouped(timepoint, boolean) {
        let isGrouped = this.isGrouped.slice();
        isGrouped[timepoint] = boolean;
        this.isGrouped = isGrouped;
    }

    /**
     * Promotes variable to primary variable of a timepoint
     * @param timepoint: current timepoint
     * @param variable: future primary variable
     */
    setPrimaryVariable(timepoint, variable) {
        let primaryVariables = this.primaryVariables.slice();
        primaryVariables[timepoint] = variable;
        this.primaryVariables = primaryVariables;
    }

    /**
     * adds variable to heatmap sample data
     * @param timepoint: current timepoint
     * @param newVarIndex: index where newly added variable should go
     * @param patient: current patient
     * @param variable: variable to add
     */
    addHeatmapVariable(timepoint, newVarIndex, patient, variable) {
        let sampleData = this.timepointData.slice();
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
        this.timepointData = sampleData;
    }

    /**
     * removes variable from heatmap sample data
     * @param timepoint
     * @param variable
     */
    static removeHeatmapVariable(timepoint, variable) {
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
        this.currentVariables.splice(this.currentVariables.indexOf(variable), 1);
        let sampleData = this.timepointData.slice();
        sampleData.forEach(function (timepoint) {
            DataStore.removeHeatmapVariable(timepoint, variable);
        });
        this.timepointData = sampleData;
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
        const variableIndex = this.timepointData[timepoint].heatmap.map(function (d, i) {
            return d.variable
        }).indexOf(variable);
        this.timepointData[timepoint].group = [];
        let currPartitionCount = 0;
        for (let i = 0; i < this.timepointData[timepoint].heatmap[variableIndex].data.length; i++) {
            const currPartitionKey = this.timepointData[timepoint].heatmap[variableIndex].data[i].value;
            let partitionIndex = this.timepointData[timepoint].group.map(function (e) {
                return e.partition;
            }).indexOf(currPartitionKey);
            if (partitionIndex === -1) {
                let rows = this.currentVariables.map(function (d, i) {
                    return {variable: d, counts: []}
                });
                this.timepointData[timepoint].group.push({partition: currPartitionKey, rows: rows});
                partitionIndex = currPartitionCount;
                currPartitionCount += 1;
            }
            this.addInstance(partitionIndex, currPartitionKey, timepoint, variableIndex);
            for (let row = 0; row < this.timepointData[timepoint].heatmap.length; row++) {
                if (this.timepointData[timepoint].heatmap[row].variable !== variable) {
                    let currSecondary = this.timepointData[timepoint].heatmap[row].data[i].value;
                    this.addInstance(partitionIndex, currSecondary, timepoint, row);
                }
            }
        }
        this.sortGroups(timepoint);
        this.setIsGrouped(timepoint, true);
        this.adaptTransitions(timepoint);
        console.log(this.transitionData);
    }

    /**
     * Adds counts to a partition or creates partition if it does not exist yet
     * @param partitionIndex: Index of partition to add to
     * @param currKey: Key of partition
     * @param timepoint: current timepoint
     * @param row: current row
     */
    addInstance(partitionIndex, currKey, timepoint, row) {
        let rowIndex = this.timepointData[timepoint].group[partitionIndex].rows.map(function (e) {
            return e.variable;
        }).indexOf(this.timepointData[timepoint].heatmap[row].variable);
        let keyIndex = this.timepointData[timepoint].group[partitionIndex].rows[rowIndex].counts.map(function (e) {
            return e.key
        }).indexOf(currKey);
        if (keyIndex === -1) {
            this.timepointData[timepoint].group[partitionIndex].rows[rowIndex].counts.push({
                "key": currKey,
                "value": 1
            })
        }
        else {
            this.timepointData[timepoint].group[partitionIndex].rows[rowIndex].counts[keyIndex].value += 1;
        }
    }

    sortGroups(timepoint) {
        this.timepointData[timepoint].group = this.timepointData[timepoint].group.sort(function (a, b) {
            if (a.partition < b.partition) {
                return -1;
            }
            if (a.partition > b.partition) {
                return 1;
            }
            else return 0;
        });
        this.timepointData[timepoint].group.forEach(function (d, i) {
            d.rows.forEach(function (f, j) {
                f.counts = f.counts.sort(function (a, b) {
                    if (a.key < b.key) {
                        return -1;
                    }
                    if (a.key > b.key) {
                        return 1
                    }
                    else return 0;
                })
            })
        })
    }

    /**
     * sorts a heatmap timepoint
     * @param timepoint
     * @param variable
     */
    sortHeatmapTimepoint(timepoint, variable) {
        let currTP = [];
        this.timepointData[timepoint].heatmap.forEach(function (d) {
            if (d.variable === variable) {
                currTP = d;
            }
        });
        let helper = this.patientOrderPerTimepoint[timepoint].map(function (d, i) {
            return ({"patient": d, "value": undefined})
        });
        currTP.data.forEach(function (d) {
            helper.forEach(function (f, j) {
                if (d.patient === f.patient) {
                    f.value = d.value;
                }
            })
        });
        this.patientOrderPerTimepoint[timepoint] = helper.sort(function (a, b) {
            if (a.value < b.value)
                return -1;
            if (a.value > b.value)
                return 1;
            else {
                if (a.patient < b.patient) {
                    return -1;
                }
                if (a.patient > b.patient) {
                    return 1;
                }
                else return 0;
            }
        }).map(function (d) {
            return d.patient;
        });
    }

    adaptTransitions(timepoint) {
        let previousTimepoint = timepoint - 1;
        let nextTimepoint = timepoint + 1;
        if (previousTimepoint !== -1) {
            if (this.isGrouped[previousTimepoint]) {
                this.computeSankeyTransition(previousTimepoint, timepoint)
            }
            else {
                this.computeGroupToPatientsTransition(previousTimepoint, timepoint)
            }
        }
        if (nextTimepoint !== this.numberOfTimepoints) {
            if (this.isGrouped[nextTimepoint]) {
                this.computeSankeyTransition(timepoint, nextTimepoint)
            }
            else {
                this.computeGroupToPatientsTransition(timepoint, nextTimepoint)
            }
        }
        console.log(this.transitionData);

    }

    computeSankeyTransition(firstTP, secondTP) {
        let transitions = [];
        let transitionIndex = -1;
        const _self = this;
        this.timepointData[firstTP].group.forEach(function (d) {
            _self.timepointData[secondTP].group.forEach(function (f) {
                transitions.push({
                    from: d.partition,
                    to: f.partition,
                    value: _self.computeIntersection(firstTP, secondTP, d.partition, f.partition)
                });

            })
        });
        this.transitionData[firstTP].type = "sankey";
        this.transitionData[firstTP].data = transitions;
    }

    computeIntersection(firstTPindex, secondTPindex, firstPartition, secondPartition) {
        let firstPatients = [];
        let secondPatients = [];
        const _self = this;
        let firstTP = this.timepointData[firstTPindex].heatmap.filter(function (d, i) {
            return d.variable === _self.primaryVariables[firstTPindex]
        })[0].data;
        let secondTP = this.timepointData[secondTPindex].heatmap.filter(function (d, i) {
            return d.variable === _self.primaryVariables[secondTPindex]
        })[0].data;
        firstTP.forEach(function (d, i) {
            if (d.value === firstPartition) {
                firstPatients.push(d.patient)
            }
        });
        secondTP.forEach(function (d, i) {
            if (d.value === secondPartition) {
                secondPatients.push(d.patient)
            }
        });
        const intersection = firstPatients.filter(function (d) {
            return secondPatients.indexOf(d) !== -1;
        });
        return intersection.length;
    }

    computeGroupToPatientsTransition(firstTP, secondTP) {
        let transitions = [];
        const _self = this;
        if (this.isGrouped[firstTP]) {
            this.timepointData[firstTP].group.forEach(function (d) {
                transitions.push({from: d.partition, to: _self.getPatientsInPartition(firstTP, secondTP, d.partition)})
            })
        }
        else {
            this.timepointData[secondTP].group.forEach(function (d) {
                transitions.push({from: _self.getPatientsInPartition(secondTP, firstTP, d.partition), to: d.partition})
            })
        }
        this.transitionData[firstTP].type = "groupToPatients";
        this.transitionData[firstTP].data = transitions;
    }

    getPatientsInPartition(groupedIndex, ungroupedIndex, partition) {
        let patients = [];
        const _self = this;
        let TP = this.timepointData[groupedIndex].heatmap.filter(function (d) {
            return d.variable === _self.primaryVariables[groupedIndex]
        })[0].data;
        return (TP.filter(function (d) {
            return d.value === partition && _self.patientsPerTimepoint[ungroupedIndex].includes(d.patient)
        }).map(function (d) {
            return d.patient;
        }));
    }
}


export default DataStore;