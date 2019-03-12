import {action, extendObservable, observe} from "mobx";
import MultipleTimepointsStore from "./MultipleTimepointsStore";

/*
Store containing information about variables
 */
class VariableStore {
    constructor(rootStore, type) {
        this.childStore = new MultipleTimepointsStore(rootStore, type);
        this.rootStore = rootStore;
        this.type = type;
        //Variables that are referenced (displayed or used to create a derived variable)
        this.referencedVariables = {};
        //Derived variables that are not displayed but should be saved for later use
        this.savedReferences = [];
        extendObservable(this, {
            //List of ids of currently displayed variables
            currentVariables: [],
            get fullCurrentVariables() {
                return this.currentVariables.map(d => this.referencedVariables[d]);
            },
            resetVariables: action(() => {
                this.referencedVariables = {};
                this.currentVariables.clear();
            }),
            /**
             * removes a variable from view
             */
            removeCurrentVariable: action(function (id) {
                this.currentVariables.remove(id);
            }),
            /**
             * adds a variable to the view
             */
            addCurrentVariable: action(function (id) {
                this.currentVariables.push(id);
            }),
            /**
             * replaces a current variable
             */
            replaceCurrentVariable: action(function (oldId, id) {
                this.currentVariables[this.currentVariables.indexOf(oldId)] = id;
            }),
            /**
             * replaces all current variables
             */
            replaceAllCurrentVariables: action(function (newIds) {
                this.currentVariables.replace(newIds);
            }),
            /**
             * adds a variable to be displayed
             */
            addVariableToBeDisplayed: action(function (variable) {
                if (!(variable.id in this.referencedVariables)) {
                    this.referencedVariables[variable.id] = variable;
                }
                if (!this.currentVariables.includes(variable.id)) {
                    this.addCurrentVariable(variable.id)
                }
            }),
            /**
             * adds variables to be displayed
             */
            addVariablesToBeDisplayed: action(function (variables) {
                variables.forEach(d => {
                    this.addVariableToBeDisplayed(d);
                });
            }),
            /**
             * replaces a displayed variable
             */
            replaceDisplayedVariable: action(function (oldId, newVariable) {
                if (!(newVariable.id in this.referencedVariables)) {
                    this.referencedVariables[newVariable.id] = newVariable;
                }
                this.replaceCurrentVariable(oldId, newVariable.id);
            }),
            /**
             * replaces referenced, current and primary variables
             */
            replaceAll: action(function (referencedVariables, currentVariables, primaryVariables) {
                this.childStore.timepoints.forEach((d, i) => {
                    d.setPrimaryVariable(primaryVariables[i])
                });
                this.replaceVariables(referencedVariables, currentVariables);
            }),
            /**
             * replaces referenced and current variables
             */
            replaceVariables: action(function (referencedVariables, currentVariables) {
                this.referencedVariables = referencedVariables;
                this.replaceAllCurrentVariables(currentVariables);
            }),

            /**
             * removes a variable from current variables
             * @param variableId
             */
            removeVariable: action(function (variableId) {
                this.removeCurrentVariable(variableId);
            })

        });
        //Observe the change and update timepoints accordingly
        observe(this.currentVariables, (change) => {
            if (change.type === 'splice') {
                if (change.removedCount > 0) {
                    change.removed.forEach(d => {
                        if (!change.added.includes(d)) {
                            this.childStore.removeHeatmapRows(d)
                        }
                    });
                }
                if (change.addedCount > 0) {
                    change.added.forEach(d => {
                        if (!change.removed.includes(d)) {
                            this.childStore.addHeatmapRows(d, this.referencedVariables[d].mapper)
                        }
                    });
                }
                if (this.currentVariables.length > 0) {
                    this.childStore.resortHeatmapRows(this.currentVariables);
                    if (this.type === "sample" && change.removed.includes(this.rootStore.dataStore.globalPrimary)) {
                        this.rootStore.dataStore.setGlobalPrimary(this.currentVariables[0]);
                    }
                }
            }
            else if (change.type === "update") {
                this.childStore.updateHeatmapRows(change.index, change.newValue, this.getById(change.newValue).mapper);
            }
            this.updateReferences();
            this.updateVariableRanges();
            this.rootStore.visStore.fitToScreenHeight();
        });

    }

    /**
     * Update children if structure changes
     * @param structure
     * @param order
     */
    update(structure, order) {
        this.childStore.updateTimepointStructure(structure, order);
        this.currentVariables.forEach(d => {
            this.childStore.addHeatmapRows(d, this.getById(d).mapper);
        });
    }

    /**
     * adds a saved variable
     * @param variableId
     */
    saveVariable(variableId) {
        if (!this.savedReferences.includes(variableId)) {
            this.savedReferences.push(variableId);
        }
    }

    /**
     * removes a saved variable
     * @param variableId
     */
    removeSavedVariable(variableId) {
        if (this.savedReferences.includes(variableId)) {
            this.savedReferences.splice(this.savedReferences.indexOf(variableId), 1);
        }
    }

    /**
     * adds or removes a saved variable
     * @param variableId
     * @param save
     */
    updateSavedVariables(variableId, save) {
        if (save) {
            this.saveVariable(variableId);
        }
        else {
            this.removeSavedVariable(variableId);
        }
    }

    /**
     * updates shared range of variables of the same profile (e.g. expression data)
     */
    updateVariableRanges() {
        let profileDomains = {};
        let profileVariables = this.currentVariables
            .filter(d => this.rootStore.availableProfiles.map(d => d.molecularProfileId).includes(this.referencedVariables[d].profile)
                && this.referencedVariables[d].datatype === "NUMBER");
        profileVariables.forEach(variableId => {
            const variable = this.referencedVariables[variableId];
            let min = Math.min(...Object.values(variable.mapper));
            let max = Math.max(...Object.values(variable.mapper));
            if (!(variable.profile in profileDomains)) {
                profileDomains[variable.profile] = [min, max];
            }
            else {
                if (profileDomains[variable.profile][0] > min) {
                    profileDomains[variable.profile][0] = min;
                }
                if (profileDomains[variable.profile][1] < max) {
                    profileDomains[variable.profile][1] = max;
                }
            }

        });
        profileVariables.forEach(variableId => {
            if (this.referencedVariables[variableId].profile in profileDomains) {
                this.referencedVariables[variableId].domain = profileDomains[this.referencedVariables[variableId].profile]
            }
        });
    }


    /**
     * Increment the referenced property of all the variables which are used by the current variable (and their "child variables")
     * @param currentId
     */
    setReferences(currentId) {
        const _self = this;
        if (!(this.referencedVariables[currentId].originalIds.length === 1 && this.referencedVariables[currentId].originalIds[0] === currentId)) {
            this.referencedVariables[currentId].originalIds.forEach(function (d) {
                _self.setReferences(d);
            });
        }
        this.referencedVariables[currentId].referenced += 1;
    }

    /**
     * updates variable tree, deletes unused variables and events
     */
    updateReferences() {
        for (let variable in this.referencedVariables) {
            this.referencedVariables[variable].referenced = 0;
        }
        this.currentVariables.forEach(d => this.setReferences(d));
        this.savedReferences.forEach(d => this.setReferences(d));
        for (let variable in this.referencedVariables) {
            if (this.referencedVariables[variable].referenced === 0) {
                if (this.referencedVariables[variable].type === "event") {
                    this.rootStore.removeEvent(variable);
                }
                delete this.referencedVariables[variable]
            }
        }
    }


    /**
     * gets a variable by id
     * @param id
     */
    getById(id) {
        return this.referencedVariables[id];
    }

    /**
     * check if a variable is displayed (is in currentVariables)
     * @param id
     * @returns {boolean}
     */
    isDisplayed(id) {
        return this.currentVariables.includes(id);
    }

    /**
     * gets the index of a variable in current variables (-1 if not contained)
     * @param id
     * @returns {number}
     */
    getIndex(id) {
        return this.currentVariables.indexOf(id);
    }

    /**
     * gets variables of a certain type
     * @param type
     * @returns {Array}
     */
    getVariablesOfType(type) {
        let typeVar = [];
        for (let variableId in this.referencedVariables) {
            if (this.referencedVariables[variableId].type === type) {
                typeVar.push(this.referencedVariables[variableId]);
            }
        }
        return typeVar;
    }

    /**
     * gets the number of referenced Variables
     * @returns {number}
     */
    getNumberOfReferencedVariables() {
        return (Object.keys(this.referencedVariables).length);
    }

    /**
     * gets all current variables which are related by type (related = derived from)
     * @param variableType
     * @returns {any[]}
     */
    getRelatedVariables(variableType) {
        const _self = this;
        let relatedVariables = [];
        this.currentVariables.forEach(function (d) {
            if (_self.recursiveSearch(d, variableType)) {
                relatedVariables.push(d);
            }
        });
        return relatedVariables.map(d => this.referencedVariables[d])
    }

    /**
     * check if a variable is or is derived of an event
     * @param variableId
     * @returns {boolean}
     */
    isEventDerived(variableId) {
        if (this.referencedVariables[variableId].type === "event") {
            return true;
        }
        else if (this.referencedVariables[variableId].type === "derived") {
            return this.referencedVariables[variableId].originalIds.map(d => this.isEventDerived(d)).includes(true);
        }
        return false;
    }

    /**
     * checks is a variable is derived from a variable with a certain type
     * @param id
     * @param variableType
     * @returns {boolean}
     */
    recursiveSearch(id, variableType) {
        if (this.referencedVariables[id].type === variableType) {
            return true;
        }
        else if (this.referencedVariables[id].type === "derived") {
            return this.referencedVariables[id].originalIds.map(d => this.recursiveSearch(d, variableType)).includes(true);
        }
        else {
            return false;
        }
    }
}

export default VariableStore;