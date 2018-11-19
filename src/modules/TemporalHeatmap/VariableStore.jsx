import {extendObservable, observe} from "mobx";
import MultipleTimepointsStore from "./MultipleTimepointsStore";

/*
Store containing information about variables
 */
class VariableStore {
    constructor(rootStore, structure, type) {
        this.childStore = new MultipleTimepointsStore(rootStore, structure, type);
        this.rootStore = rootStore;
        this.type = type;
        //Variables that are referenced (displayed or used to create a derived variable)
        this.referencedVariables = {};
        extendObservable(this, {
            //List of ids of currently displayed variables
            currentVariables: [],

        });
        //Observe the change and update timepoints accordingly
        observe(this.currentVariables, (change) => {
            if (change.type === 'splice') {
                change.added.forEach(d => {
                    if (!change.removed.includes(d)) {
                        this.childStore.addHeatmapRows(d, this.getById(d).mapper);
                    }
                });
                change.removed.forEach(d => {
                    if (!change.added.includes(d)) {
                        this.childStore.removeHeatmapRows(d);
                    }
                });
                if (change.removedCount > 0 && change.addedCount > 0) {
                    this.childStore.resortHeatmapRows(this.currentVariables);
                }
                if (change.removedCount > 0 && change.added === 0) {
                    if (this.type === "between" && this.currentVariables.length === 0) {
                        this.rootStore.timepointStore.toggleTransition()
                    }
                    if (this.type === "sample" && change.removed[0] === this.rootStore.timepointStore.globalPrimary) {
                        this.rootStore.timepointStore.setGlobalPrimary(this.currentVariables[0]);
                    }
                }
                if (change.addedCount > 0) {
                    if (this.type === "between" && this.currentVariables.length === 1) {
                        this.rootStore.timepointStore.toggleTransition()
                    }
                }
            }
            else if (change.type === "update") {
                this.childStore.updateHeatmapRows(change.newValue, this.getById(change.newValue).mapper, change.index)
            }
            this.updateReferences();
            this.updateVariableRanges();
            this.rootStore.timepointStore.regroupTimepoints();
        });

    }

    /**
     * Update children if structure changes
     * @param structure
     * @param order
     * @param names
     */
    update(structure, order, names) {
        this.childStore.updateTimepointStructure(structure, order, names);
        this.currentVariables.forEach(d => this.childStore.addHeatmapRows(d, this.referencedVariables[d].mapper))
    }

    /**
     * removes a variable from current variables
     * @param variableId
     */
    removeVariable(variableId) {
        let name = this.getById(variableId).name;
        this.currentVariables.remove(variableId);
        this.rootStore.undoRedoStore.saveVariableHistory("REMOVED", name, true);
    }


    updateVariableRanges() {
        let profileDomains = {};
        let profileVariables = this.currentVariables
            .filter(d => this.rootStore.cbioAPI.molecularProfiles.map(d => d.molecularProfileId).includes(this.referencedVariables[d].profile)
                && this.referencedVariables[d].datatype === "NUMBER");
        profileVariables.forEach(variableId => {
            const variable=this.referencedVariables[variableId];
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

    updateReferences() {
        for (let variable in this.referencedVariables) {
            this.referencedVariables[variable].referenced = 0;
        }
        this.currentVariables.forEach(d => this.setReferences(d));
        for (let variable in this.referencedVariables) {
            if (!this.referencedVariables[variable].derived && this.referencedVariables[variable].referenced === 0) {
                delete this.referencedVariables[variable]
            }
        }
    }


    addVariableToBeReferenced(variable) {
        if (!(variable.id in this.referencedVariables)) {
            this.referencedVariables[variable.id] = variable;
        }
    }

    addVariableToBeDisplayed(variable) {
        this.addVariableToBeReferenced(variable);
        if (!this.currentVariables.includes(variable.id)) {
            this.currentVariables.push(variable.id);
        }
    }

    addVariablesToBeDisplayed(variables) {
        let currentVariables = this.currentVariables.slice();
        variables.forEach(d => {
            this.addVariableToBeReferenced(d);
        });
        variables.forEach(d => {
            if (!currentVariables.includes(d.id)) {
                currentVariables.push(d.id);
            }
        });
        this.currentVariables.replace(currentVariables);
    }


    replaceDisplayedVariable(oldId, newVariable) {
        if (!this.isReferenced(newVariable.id)) {
            this.referencedVariables[newVariable.id] = newVariable;
        }
        this.currentVariables[this.currentVariables.indexOf(oldId)] = newVariable.id;
    }


    /**
     * gets a variable by id
     * @param id
     */
    getById(id) {
        return this.referencedVariables[id];
    }

    /**
     * check if a variable is referenced (is in originalVariables)
     * @param id
     * @returns {boolean}
     */
    isReferenced(id) {
        return id in this.referencedVariables;
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
     * gets complete current variables (not only ids)
     * @returns {*}
     */
    getCurrentVariables() {
        return this.currentVariables.map(d => this.referencedVariables[d]);
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