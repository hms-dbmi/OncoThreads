import {extendObservable} from "mobx";
/*
stores information about transitions
 */
class TransitionStore {
    constructor(rootStore) {
        this.rootStore=rootStore;
        this.numberOfTransitions=0;
        this.patientsPerTimepoint=[];
        this.timeGapStructure=[];

        extendObservable(this, {
            transitionData: [],
        })
    }
    setNumberOfTransitions(numberOfTransitions){
        this.numberOfTransitions=numberOfTransitions;
    }
    setPatientsPerTimepoint(patientsPerTimepoint){
        this.patientsPerTimepoint=patientsPerTimepoint;
    }

    /**
     * initializes fields and sets line transitions
     * @param numberOfTransitions
     * @param patientsPerTimepoint
     */
    initializeTransitions(numberOfTransitions,patientsPerTimepoint){
        this.transitionData=[];
        this.setNumberOfTransitions(numberOfTransitions);
        this.setPatientsPerTimepoint(patientsPerTimepoint);
        this.timeGapStructure = this.rootStore.timeGapStructure;

        console.log(this.timeGapStructure);

         for (let i = 0; i < this.numberOfTransitions; i++) {
            this.transitionData.push({
                type: "line",
                data: {"from": this.patientsPerTimepoint[i], "to": this.patientsPerTimepoint[i + 1]},
                timeGapStructure: this.timeGapStructure[i+1]
            })
        }
    }
    /**
     * adapts the transitions for a timepoint (usually used after a timepoint is grouped, ungrouped or sorted)
     * @param timepoint
     */
    adaptTransitions(timepoint) {
        let previousTimepoint = timepoint - 1;
        let nextTimepoint = timepoint + 1;
        console.log(nextTimepoint,this.numberOfTransitions);
        if (this.rootStore.timepointStore.groupOrder[timepoint].isGrouped) {
            if (previousTimepoint !== -1) {
                if (this.rootStore.timepointStore.groupOrder[previousTimepoint].isGrouped) {
                    this.computeSankeyTransition(previousTimepoint, timepoint)
                }
                else {
                    this.computeGroupToPatientsTransition(previousTimepoint, timepoint)
                }
            }
            if (nextTimepoint !== this.numberOfTransitions+1) {
                if (this.rootStore.timepointStore.groupOrder[nextTimepoint].isGrouped) {
                    this.computeSankeyTransition(timepoint, nextTimepoint)
                }
                else {
                    this.computeGroupToPatientsTransition(timepoint, nextTimepoint)
                }
            }
        }
        else {
            if (previousTimepoint !== -1) {
                if (this.rootStore.timepointStore.groupOrder[previousTimepoint].isGrouped) {
                    this.computeGroupToPatientsTransition(previousTimepoint, timepoint)
                }
                else {
                    this.computeLineTransition(previousTimepoint, timepoint)
                }
            }
            if (nextTimepoint !== this.numberOfTransitions) {
                if (this.rootStore.timepointStore.groupOrder[nextTimepoint].isGrouped) {
                    this.computeGroupToPatientsTransition(timepoint, nextTimepoint)
                }
                else {
                    this.computeLineTransition(timepoint, nextTimepoint)
                }
            }
        }
        console.log(this.transitionData);
    }

    /**
     * computes sankey transitions between two timepoints
     * @param firstTP
     * @param secondTP
     */
    computeSankeyTransition(firstTP, secondTP) {
        let transitions = [];
        const _self = this;
        this.rootStore.timepointStore.timepointData[firstTP].group.data.forEach(function (d) {
            _self.rootStore.timepointStore.timepointData[secondTP].group.data.forEach(function (f) {
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
        let firstTP = this.rootStore.timepointStore.timepointData[firstTPindex].heatmap.filter(function (d) {
            return d.variable === _self.rootStore.timepointStore.primaryVariables[firstTPindex]
        })[0].data;
        let secondTP = this.rootStore.timepointStore.timepointData[secondTPindex].heatmap.filter(function (d) {
            return d.variable === _self.rootStore.timepointStore.primaryVariables[secondTPindex]
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
        const intersection = firstPatients.filter(function (d) {
            return secondPatients.indexOf(d) !== -1;
        });
        return intersection.length;
    }

    /**
     * computes transtiton between a grouped and an ungrouped timepoint
     * @param firstTP
     * @param secondTP
     */
    computeGroupToPatientsTransition(firstTP, secondTP) {
        let transitions = [];
        const _self = this;
        if (this.rootStore.timepointStore.groupOrder[firstTP].isGrouped) {
            this.rootStore.timepointStore.timepointData[firstTP].group.data.forEach(function (d) {
                transitions.push({from: d.partition, to: _self.getPatientsInPartition(firstTP, secondTP, d.partition)})
            })
        }
        else {
            this.rootStore.timepointStore.timepointData[secondTP].group.data.forEach(function (d) {
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
        let TP = this.rootStore.timepointStore.timepointData[groupedIndex].heatmap.filter(function (d) {
            return d.variable === _self.rootStore.timepointStore.primaryVariables[groupedIndex]
        })[0].data;
        return (TP.filter(function (d) {
            return d.value === partition && _self.patientsPerTimepoint[ungroupedIndex].includes(d.patient)
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
            "from": this.patientsPerTimepoint[firstTP],
            "to": this.patientsPerTimepoint[secondTP]
        }
    }

   // no lines, do nothing 
    computeEmptyTransition(firstTP,secondTP){
        this.transitionData[firstTP].type = "empty";
        this.transitionData[firstTP].data = [];
    }
}


export default TransitionStore;