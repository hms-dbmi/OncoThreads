import {extendObservable} from "mobx";

/*
Store containing information about variables
 */
class ReducedVariableStore {
    constructor(referencedVariables, currentVariables) {
        //Variables that are referenced (displayed or used to create a derived variable)
        this.referencedVariables = referencedVariables;
        extendObservable(this, {
            //List of ids of currently displayed variables
            currentVariables: currentVariables.map(d => {
                return {id: d.id, isModified: false, isNew: false}
            }),
        });
    }


    /**
     * removes a variable from current variables
     * @param variableId
     */
    removeVariable(variableId) {
        let name = this.getById(variableId).name;
        let spliceIndex = this.currentVariables.map(d=>d.id).indexOf(variableId);
        this.currentVariables.splice(spliceIndex, 1);
        this.removeReferences(variableId);
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
        this.referencedVariables[currentId].referenced += 1;
    }


    addVariableToBeReferenced(variable) {
        if (!(variable.id in this.referencedVariables)) {
            this.referencedVariables[variable.id] = variable;
        }
    }

    addVariableToBeDisplayed(variable) {
        this.addVariableToBeReferenced(variable);
        if (!this.currentVariables.map(d=>d.id).includes(variable.id)) {
            this.updateReferences(variable.id);
            this.currentVariables.push({id:variable.id,isNew:true,isModified:false});
        }
    }


    replaceDisplayedVariable(oldId, newVariable) {
        if (!this.isReferenced(newVariable.id)) {
            this.referencedVariables[newVariable.id] = newVariable;
        }
        this.updateReferences(newVariable.id);
        this.removeReferences(oldId);
        const replaceIndex = this.currentVariables.map(d=>d.id).indexOf(oldId);
        this.currentVariables[replaceIndex] = {id:newVariable.id,isModified:true,isNew:false};
        this.isModified[replaceIndex] = true;
    }

    sortBySource(profileOrder) {
        this.currentVariables.replace(this.currentVariables.sort((a, b) => {
                if (profileOrder.indexOf(this.referencedVariables[a.id].profile) < profileOrder.indexOf(this.referencedVariables[b.id].profile)) {
                    return -1
                }
                if (profileOrder.indexOf(this.referencedVariables[a.id].profile) > profileOrder.indexOf(this.referencedVariables[b.id].profile)) {
                    return 1;
                }
                else return 0;
            }
        ))
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

export default ReducedVariableStore;