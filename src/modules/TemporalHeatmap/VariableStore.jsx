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
            //Saves the shared domain (min,max) of continuous molecular profile data
            profileDomains: new Map(),
            //List of ids of currently displayed variables
            currentVariables: [],
        });
        //Observe the change and update timepoints accordingly
        observe(this.currentVariables, (change) => {
            if (change.type === 'splice') {
                if (change.added.length > 0) {
                    if (this.type === "between" && this.currentVariables.length === 1) {
                        this.rootStore.timepointStore.toggleTransition()
                    }
                    change.added.forEach(d => this.childStore.addHeatmapRows(d, this.getById(d).mapper))
                }
                if (change.removed.length > 0) {
                    if (this.type === "between" && this.currentVariables.length === 0) {
                        this.rootStore.timepointStore.toggleTransition()
                    }
                    if (this.type === "sample" && change.removed[0] === this.rootStore.timepointStore.globalPrimary) {
                        this.rootStore.timepointStore.setGlobalPrimary(this.currentVariables[0]);
                    }
                    change.removed.forEach(d => this.childStore.removeHeatmapRows(d));
                }
            }
            else if (change.type === "update") {
                this.childStore.updateHeatmapRows(change.newValue, this.getById(change.newValue).mapper, change.index)
            }
            this.rootStore.timepointStore.regroupTimepoints();
        });
        //observe change in profileDomains and update domains of corresponding variables
        observe(this.profileDomains, change => {
            if (change.type === "update") {
                for (let id in this.referencedVariables) {
                    if (this.referencedVariables[id].profile === change.name) {
                        this.referencedVariables[id].domain = change.newValue;
                    }
                }
            }
        })
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
        this.removeFromProfileDomain(variableId);
        this.currentVariables.splice(this.currentVariables.indexOf(variableId), 1);
        this.removeReferences(variableId);
        this.rootStore.undoRedoStore.saveVariableHistory("REMOVED", name, true);
    }

    /**
     * Decrement the referenced property of all the variables which were used by the current variable (and their "child variables"). If the referenced property is 0 remove the variable
     * @param currentId
     */
    removeReferences(currentId) {
        const _self = this;
        if (!(this.referencedVariables[currentId].originalIds.length === 1 && this.referencedVariables[currentId].originalIds[0] === currentId)) {
            this.referencedVariables[currentId].originalIds.forEach(function (d) {
                _self.removeReferences(d);
            });
        }
        this.referencedVariables[currentId].referenced -= 1;
        if (this.referencedVariables[currentId].referenced === 0) {
            if (this.referencedVariables[currentId].type === "event") {
                delete this.rootStore.eventTimelineMap[currentId];
            }
            delete this.referencedVariables[currentId];
        }
    }

    /**
     * updates shared profile domain of variableId to the new min/max
     * @param variableId
     */
    removeFromProfileDomain(variableId) {
        if (this.referencedVariables[variableId].profile !== undefined && this.referencedVariables[variableId].datatype === "NUMBER") {
            let isMin = Math.min(...Object.values(this.referencedVariables[variableId].mapper)) === this.profileDomains.get(this.referencedVariables[variableId].profile)[0];
            let isMax = Math.max(...Object.values(this.referencedVariables[variableId].mapper)) === this.profileDomains.get(this.referencedVariables[variableId].profile)[1];
            if (isMin || isMax) {
                let currMin = Number.POSITIVE_INFINITY;
                let currMax = Number.NEGATIVE_INFINITY;
                let profileVariables = this.getCurrentVariables().filter(d => d.profile === this.referencedVariables[variableId].profile && d.id !== variableId);
                if (profileVariables.length > 0) {
                    profileVariables.forEach(d => {
                        const min = Math.min(...Object.values(d.mapper).filter(d => d !== undefined));
                        const max = Math.max(...Object.values(d.mapper).filter(d => d !== undefined));
                        if (min < currMin) {
                            currMin = min;
                        }
                        if (max > currMax) {
                            currMax = max;
                        }
                    });
                    let newDomain = this.profileDomains.get(this.referencedVariables[variableId].profile).slice();
                    if (isMin) {
                        newDomain[0] = currMin;
                    }
                    if (isMax) {
                        newDomain[1] = currMax;
                    }
                    this.profileDomains.set(this.referencedVariables[variableId].profile, newDomain);
                }
                else {
                    this.profileDomains.delete(this.referencedVariables[variableId].profile);
                }
            }
        }
    }

    /**
     * updates shared profile domain with domain of variable
     * @param variable
     */
    addToProfileDomain(variable) {
        let profileChanged = false;
        let newDomain = [];
        if (variable.profile !== undefined && variable.datatype === "NUMBER") {
            if (!(this.profileDomains.has(variable.profile))) {
                this.profileDomains.set(variable.profile, variable.domain);
            }
            newDomain = [this.profileDomains.get(variable.profile)[0], this.profileDomains.get(variable.profile)[1]];
            if (this.profileDomains.get(variable.profile)[0] > variable.domain[0]) {
                newDomain[0] = variable.domain[0];
                profileChanged = true;
            }
            if (this.profileDomains.get(variable.profile)[1] < variable.domain[1]) {
                newDomain[1] = variable.domain[1];
                profileChanged = true;
            }
            if (profileChanged) {
                this.profileDomains.set(variable.profile, newDomain);
            }
            variable.domain = this.profileDomains.get(variable.profile);
        }
    }

    /**
     * Increment the referenced property of all the variables which are used by the current variable (and their "child variables")
     * @param currentId
     */
    updateReferences(currentId) {
        const _self = this;
        if (!(this.referencedVariables[currentId].originalIds.length === 1 && this.referencedVariables[currentId].originalIds[0] === currentId)) {
            this.referencedVariables[currentId].originalIds.forEach(function (d) {
                _self.updateReferences(d);
            });
        }
        _self.referencedVariables[currentId].referenced += 1;
    }


    addVariableToBeReferenced(variable) {
        this.referencedVariables[variable.id] = variable;
    }

    addVariableToBeDisplayed(variable) {
        this.addToProfileDomain(variable);
        this.referencedVariables[variable.id] = variable;
        this.updateReferences(variable.id);
        this.currentVariables.push(variable.id);
    }

    replaceDisplayedVariable(oldId, newVariable) {
        if (!this.isReferenced(newVariable.id)) {
            this.referencedVariables[newVariable.id] = newVariable;
        }
        this.updateReferences(newVariable.id);
        this.removeReferences(oldId);
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