import {extendObservable, observe} from "mobx";

/*
Store containing information about variables
 */
class VariableManagerStore {
    constructor(referencedVariables, currentVariables, primaryVariables) {
        //Variables that are referenced (displayed or used to create a derived variable)
        this.referencedVariables = referencedVariables;
        this.primaryVariables = primaryVariables;
        extendObservable(this, {
            //List of ids of currently displayed variables
            currentVariables: currentVariables.map(d => {
                return {id: d, isNew: false, isSelected: false}
            }),
        });
        observe(this.currentVariables, () => {
            this.updateReferences();
        });
    }


    /**
     * removes a variable from current variables
     * @param variableId
     */
    removeVariable(variableId) {
        this.currentVariables.remove(this.currentVariables.filter(d => d.id === variableId)[0]);
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
        this.currentVariables.forEach(d => this.setReferences(d.id));
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
        if (!this.currentVariables.map(d => d.id).includes(variable.id)) {
            this.currentVariables.push({id: variable.id, isNew: true, isSelected: false});
        }
    }


    replaceDisplayedVariable(oldId, newVariable) {
        if (oldId !== newVariable.id) {
            this.referencedVariables[newVariable.id] = newVariable;
            const replaceIndex = this.currentVariables.map(d => d.id).indexOf(oldId);
            this.currentVariables[replaceIndex] = {
                id: newVariable.id,
                isNew: this.currentVariables[replaceIndex].isNew,
                isSelected: this.currentVariables[replaceIndex].isSelected
            };
        }
        if (this.primaryVariables.includes(oldId)) {
            this.primaryVariables[this.primaryVariables.indexOf(oldId)] = newVariable.id;
        }
    }

    toggleSelected(id) {
        this.currentVariables[this.currentVariables.map(d => d.id).indexOf(id)].isSelected = !this.currentVariables[this.currentVariables.map(d => d.id).indexOf(id)].isSelected;
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

    sortByAddOrder(addOrder) {
        this.currentVariables.replace(this.currentVariables.sort((a, b) => {
                if (addOrder.indexOf(a.id) < addOrder.indexOf(b.id)) {
                    return -1
                }
                if (addOrder.indexOf(a.id) > addOrder.indexOf(b.id)) {
                    return 1;
                }
                else return 0;
            }
        ))
    }

    sortAlphabetically() {
        this.currentVariables.replace(this.currentVariables.sort((a, b) => {
            if (this.referencedVariables[a.id].name < this.referencedVariables[b.id].name) {
                return -1
            }
            if (this.referencedVariables[a.id].name > this.referencedVariables[b.id].name) {
                return 1;
            }
            else return 0;
        }));
    }

    sortByDatatype() {
        this.currentVariables.replace(this.currentVariables.sort((a, b) => {
                if (this.referencedVariables[a.id].datatype < this.referencedVariables[b.id].datatype) {
                    return -1
                }
                if (this.referencedVariables[a.id].datatype > this.referencedVariables[b.id].datatype) {
                    return 1;
                }
                else return 0;
            }
        ))
    }

    /**
     * moves variables up or down
     * @param isUp: if true move up, if false move down
     * @param toExtreme: if true move to top/bottom, if false move only by one row
     * @param indices: move these indices
     */
    move(isUp, toExtreme, indices) {
        if (toExtreme) {
            this.moveToExtreme(isUp, indices);
        }
        else {
            this.moveByOneRow(isUp, indices);
        }
    }

    /**
     * move a group of variables at indices to the top or the bottom
     * @param isUp
     * @param indices
     */
    moveToExtreme(isUp, indices) {
        let currentVariables = this.currentVariables.slice();
        let selectedVariables = currentVariables.filter((d, i) => indices.includes(i));
        let notSelectedVariables = currentVariables.filter((d, i) => !indices.includes(i));
        if (isUp) {
            currentVariables = [...selectedVariables, ...notSelectedVariables]
        }
        else {
            currentVariables = [...notSelectedVariables, ...selectedVariables];
        }
        this.currentVariables.replace(currentVariables);
    }

    /**
     * move variable(s) up or down by one row
     * @param isUp
     * @param indices
     */
    moveByOneRow(isUp, indices) {
        let currentVariables = this.currentVariables.slice();
        let extreme, getNextIndex;
        if (isUp) {
            extreme = 0;
            getNextIndex = function (index) {
                return index - 1;
            }
        }
        else {
            extreme = currentVariables.length - 1;
            indices.reverse();
            getNextIndex = function (index) {
                return index + 1;
            }
        }
        indices.forEach(d => {
            if ((d !== extreme)) {
                if (!(indices.includes(extreme) && VariableManagerStore.isBlock(indices))) {
                    let save = currentVariables[getNextIndex(d)];
                    currentVariables[getNextIndex(d)] = currentVariables[d];
                    currentVariables[d] = save;
                }
            }
        });
        this.currentVariables.replace(currentVariables);
    }

    /**
     * checks if the selected indices are a block (no not selected variable in between)
     * @param array
     * @returns {boolean}
     */
    static isBlock(array) {
        let sorted = array.sort((a, b) => a - b);
        let isBlock = true;
        let current = sorted[0];
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] !== current + 1) {
                isBlock = false;
                break;
            }
        }
        return isBlock
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
        return this.currentVariables.map(d => this.referencedVariables[d.id]);
    }

    getSelectedVariables() {
        return this.currentVariables.filter(d => d.isSelected).map(d => this.referencedVariables[d.id]);
    }

    getSelectedIndices() {
        return this.currentVariables.map((d, i) => {
            return {isSelected: d.isSelected, index: i}
        }).filter(d => d.isSelected).map(d => d.index);
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

export default VariableManagerStore;