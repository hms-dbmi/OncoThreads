import {extendObservable} from "mobx";

/*
stores information about transitions
 */
class TransitionStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.numberOfTransitions = 0;
        this.timeGapStructure = [];

        extendObservable(this, {
            transitionData: [],
            get timeGapStructure() {
                const _self = this;
                let timeGapStructure = [];
                this.rootStore.transitionStructure.forEach(function (d, i) {
                    let variableData = {};
                    d.forEach(function (f) {
                        variableData[f.patient] = _self.rootStore.staticMappers.timeGapMapping[f.sample];
                    });
                    timeGapStructure.push(variableData);
                });
                return timeGapStructure;
            }
        });

    }

    setNumberOfTransitions(numberOfTransitions) {
        this.numberOfTransitions = numberOfTransitions;
    }

    /**
     * initializes fields and sets line transitions
     * @param numberOfTransitions
     */
    initializeTransitions(numberOfTransitions) {
        this.transitionData = [];
        this.setNumberOfTransitions(numberOfTransitions);
        for (let i = 0; i < this.numberOfTransitions; i++) {
            this.transitionData.push({
                type: "",
                data: null,
                timeGapStructure: null
            });
            if (i < this.numberOfTransitions) {
                this.adaptTransitions(i);
            }
        }
    }

    /**
     * adapts the transitions for a timepoint (usually used after a timepoint is grouped, ungrouped or sorted)
     * @param timepoint
     */
    adaptTransitions(timepoint) {
        let previousTimepoint = timepoint - 1;
        let nextTimepoint = timepoint + 1;
        if (this.rootStore.timepointStore.timepoints[timepoint].isGrouped) {
            if (previousTimepoint !== -1) {
                if (this.rootStore.timepointStore.timepoints[previousTimepoint].isGrouped) {
                    this.computeSankeyTransition(previousTimepoint, timepoint)
                }
                else {
                    this.computeGroupToPatientsTransition(previousTimepoint, timepoint)
                }
            }
            if (nextTimepoint !== this.numberOfTransitions + 1) {
                if (this.rootStore.timepointStore.timepoints[nextTimepoint].isGrouped) {
                    this.computeSankeyTransition(timepoint, nextTimepoint)
                }
                else {
                    this.computeGroupToPatientsTransition(timepoint, nextTimepoint)
                }
            }
        }
        else {
            if (previousTimepoint !== -1) {
                if (this.rootStore.timepointStore.timepoints[previousTimepoint].isGrouped) {
                    this.computeGroupToPatientsTransition(previousTimepoint, timepoint)
                }
                else {
                    this.computeLineTransition(previousTimepoint, timepoint)
                }
            }
            if (nextTimepoint !== this.numberOfTransitions + 1) {
                if (this.rootStore.timepointStore.timepoints[nextTimepoint].isGrouped) {
                    this.computeGroupToPatientsTransition(timepoint, nextTimepoint)
                }
                else {
                    this.computeLineTransition(timepoint, nextTimepoint)
                }
            }
        }
    }

    /**
     * computes sankey transitions between two timepoints
     * @param firstTP
     * @param secondTP
     */
    computeSankeyTransition(firstTP, secondTP) {
        let transitions = [];
        const _self = this;
        this.rootStore.timepointStore.timepoints[firstTP].grouped.forEach(function (d) {
            _self.rootStore.timepointStore.timepoints[secondTP].grouped.forEach(function (f) {
                const intersection = _self.computeIntersection(firstTP, secondTP, d.partition, f.partition);
                transitions.push({
                    from: d.partition,
                    to: f.partition,
                    value: intersection.length,
                    patients: intersection
                });

            })
        });
        this.transitionData[firstTP].type = "sankey";
        this.transitionData[firstTP].data = transitions;
    }

    /**
     * Computes the intersection between the patients of two partitions of two timepoints in order to receive the number of patients going from one state to the other
     * @param firstTPindex
     * @param secondTPindex
     * @param firstPartition
     * @param secondPartition
     * @returns count of patients in state change
     */
    computeIntersection(firstTPindex, secondTPindex, firstPartition, secondPartition) {
        let firstPatients = [];
        let secondPatients = [];
        const _self = this;
        let firstTP = this.rootStore.timepointStore.timepoints[firstTPindex].heatmap.filter(function (d) {
            return d.variable === _self.rootStore.timepointStore.timepoints[firstTPindex].primaryVariableId
        })[0].data;
        let secondTP = this.rootStore.timepointStore.timepoints[secondTPindex].heatmap.filter(function (d) {
            return d.variable === _self.rootStore.timepointStore.timepoints[secondTPindex].primaryVariableId
        })[0].data;
        firstTP.forEach(function (d) {
            if (d.value === firstPartition) {
                firstPatients.push(d.patient)
            }
        });
        secondTP.forEach(function (d) {
            if (d.value === secondPartition) {
                secondPatients.push(d.patient)
            }
        });
        return firstPatients.filter(function (d) {
            return secondPatients.indexOf(d) !== -1;
        });
    }

    /**
     * computes transtiton between a grouped and an ungrouped timepoint
     * @param firstTP
     * @param secondTP
     */
    computeGroupToPatientsTransition(firstTP, secondTP) {
        let transitions = [];
        const _self = this;
        if (this.rootStore.timepointStore.timepoints[firstTP].isGrouped) {
            this.rootStore.timepointStore.timepoints[firstTP].grouped.forEach(function (d) {
                transitions.push({from: d.partition, to: _self.getPatientsInPartition(firstTP, secondTP, d.partition)})
            })
        }
        else {
            this.rootStore.timepointStore.timepoints[secondTP].grouped.forEach(function (d) {
                transitions.push({from: _self.getPatientsInPartition(secondTP, firstTP, d.partition), to: d.partition})
            })
        }
        this.transitionData[firstTP].type = "groupToPatients";
        this.transitionData[firstTP].data = transitions;
    }

    /**
     * gets the patients in a partition of a grouped timepoint which also exist in a different ungrouped timepoint
     * @param groupedIndex
     * @param ungroupedIndex
     * @param partition
     */
    getPatientsInPartition(groupedIndex, ungroupedIndex, partition) {
        const _self = this;
        let TP = this.rootStore.timepointStore.timepoints[groupedIndex].heatmap.filter(function (d) {
            return d.variable === _self.rootStore.timepointStore.timepoints[groupedIndex].primaryVariableId
        })[0].data;
        return (TP.filter(function (d) {
            return d.value === partition && _self.rootStore.timepointStore.timepoints[ungroupedIndex].patients.includes(d.patient)
        }).map(function (d) {
            return d.patient;
        }));
    }

    /**
     * computes transitions between two ungrouped timepoints
     * @param firstTP
     * @param secondTP
     */
    computeLineTransition(firstTP, secondTP) {
        this.transitionData[firstTP].type = "line";
        this.transitionData[firstTP].data = {
            "from": this.rootStore.timepointStore.timepoints[firstTP].patients,
            "to": this.rootStore.timepointStore.timepoints[secondTP].patients
        };
        this.transitionData[firstTP].timeGapStructure = this.timeGapStructure[secondTP];
    }

    /**
     * creates an empty transition
     * @param firstTP
     * @param secondTP
     */
    computeEmptyTransition(firstTP, secondTP) {
        this.transitionData[firstTP].type = "empty";
        this.transitionData[firstTP].data = [];
    }
}


export default TransitionStore;