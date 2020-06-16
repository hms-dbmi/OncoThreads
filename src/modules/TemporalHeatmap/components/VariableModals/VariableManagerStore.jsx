import { action, extendObservable, observe } from 'mobx';
import uuidv4 from 'uuid/v4';
import UndoRedoStore from '../../../UndoRedoStore';
import DerivedVariable from '../../stores/DerivedVariable';
import DerivedMapperFunctions from '../../UtilityClasses/DeriveMapperFunctions';

/**
 * store containing variables in variable manager
 */
class VariableManagerStore {
    /**
     * constructs the store. Variables are deserialized to recreate variable Objects
     * @param {{}} referencedVariables
     * @param {Object[]} currentVariables
     * @param {Object[]} primaryVariables
     * @param {Object[]} savedReferences
     */
    constructor(referencedVariables, currentVariables, primaryVariables, savedReferences) {
        // Variables that are referenced (displayed or used to create a derived variable)
        this.referencedVariables = UndoRedoStore
            .deserializeReferencedVariables(referencedVariables);
        this.primaryVariables = primaryVariables;
        this.savedReferences = savedReferences;
        this.log = [];
        extendObservable(this, {
            // List of ids of currently displayed variables and if they are new and/or selected
            currentVariables: currentVariables
                .map(d => ({ id: d, isNew: false, isSelected: false })),
            addOrder: [],
            /**
             * removes a variable and updates primary variables
             * @param {string} variableId
             */
            removeVariable: action((variableId) => {
                this.currentVariables.remove(this.currentVariables
                    .filter(d => d.id === variableId)[0]);
                this.addOrder.splice(this.addOrder.indexOf(variableId), 1);
                if (this.primaryVariables.includes(variableId)) {
                    this.primaryVariables.forEach((d, i) => {
                        if (d === variableId) {
                            if (this.currentVariables.length > 0){
                                this.primaryVariables[i] = this.currentVariables[0].id;
                            } else {
                                this.primaryVariables[i] = undefined;
                            }
                        }
                    });
                }
            }),

            /**
             * adds a variable to the table
             * @param {(OriginalVariable|DerivedVariable)} variable
             */
            addVariablesToBeDisplayed: action((variables) => {
                variables.forEach(variable => this.addVariableToBeDisplayed(variable));
            }),
            /**
             * adds a variable to the table
             * @param {(OriginalVariable|DerivedVariable)} variable
             */
            addVariableToBeDisplayed: action((variable) => {
                this.addVariableToBeReferenced(variable);
                if (!this.currentVariables.map(d => d.id).includes(variable.id)) {
                    this.currentVariables.push({ id: variable.id, isNew: true, isSelected: false });
                    this.addOrder.push(variable.id);
                }
                this.primaryVariables = this.primaryVariables.map(variableId => variableId === undefined ? variable.id : variableId);
            }),
            /**
             * replaces a variable in the table
             * @param {string} oldId - id of variable to be displayed
             * @param {(OriginalVariable|DerivedVariable)} new variable
             */
            replaceDisplayedVariable: action((oldId, newVariable) => {
                this.referencedVariables[newVariable.id] = newVariable;
                const replaceIndex = this.currentVariables.map(d => d.id).indexOf(oldId);
                this.currentVariables[replaceIndex] = {
                    id: newVariable.id,
                    isNew: this.currentVariables[replaceIndex].isNew,
                    isSelected: this.currentVariables[replaceIndex].isSelected,
                };
                this.addOrder[this.addOrder.indexOf(oldId)] = newVariable.id;
                if (this.primaryVariables.includes(oldId)) {
                    for (let i = 0; i < this.primaryVariables.length; i += 1) {
                        if (this.primaryVariables[this.primaryVariables.indexOf(oldId)] === oldId) {
                            this.primaryVariables[i] = newVariable.id;
                        }
                    }
                }
            }),
            /**
             * applies a modification of a single variable (no combinations)
             * to all variables in that profile
             * @param {DerivedVariable} newVariable - modified variable,
             * which modification should be applied to profile
             * @param {string} oldProfile - id of old Profile;
             */
            applyToEntireProfile: action((newVariable, oldProfile, nameEnding) => {
                this.currentVariables.forEach((variable) => {
                    const variableReference = this.getById(variable.id);
                    if (variableReference.profile === oldProfile) {
                        let derivedVariable;
                        if (variableReference.derived) {
                            const originalVariable = this.getById(variableReference.originalIds[0]);
                            derivedVariable = new DerivedVariable(uuidv4(),
                                originalVariable.name + nameEnding, newVariable.datatype,
                                originalVariable.description, [originalVariable.id],
                                newVariable.modification, newVariable.range, newVariable.domain,
                                DerivedMapperFunctions.getModificationMapper(
                                    newVariable.modification, [originalVariable.mapper],
                                ),
                                newVariable.profile, originalVariable.type);
                        } else {
                            derivedVariable = new DerivedVariable(uuidv4(),
                                variableReference.name + nameEnding,
                                newVariable.datatype, variableReference.description,
                                [variableReference.id], newVariable.modification, newVariable.range,
                                newVariable.domain,
                                DerivedMapperFunctions.getModificationMapper(
                                    newVariable.modification, [variableReference.mapper],
                                ), newVariable.profile, variableReference.type);
                        }
                        this.replaceDisplayedVariable(variable.id, derivedVariable);
                    }
                });
            }),
            /**
             * selects/unselect variable
             * @param {string} id
             */
            toggleSelected: action((id) => {
                this.currentVariables[this.currentVariables.map(d => d.id)
                    .indexOf(id)].isSelected = !this.currentVariables[this.currentVariables
                    .map(d => d.id).indexOf(id)].isSelected;
            }),
            /**
             * sorts variables by data source
             * @param {string[]} sourceOrder
             * @param {boolean} asc - sort ascending/descending
             */
            sortBySource: action((sourceOrder, asc) => {
                let factor = 1;
                if (!asc) {
                    factor = -1;
                }
                this.currentVariables.replace(this.currentVariables.sort((a, b) => {
                    if (sourceOrder.indexOf(this.referencedVariables[a.id].profile)
                        < sourceOrder.indexOf(this.referencedVariables[b.id].profile)) {
                        return -factor;
                    }
                    if (sourceOrder.indexOf(this.referencedVariables[a.id].profile)
                        > sourceOrder.indexOf(this.referencedVariables[b.id].profile)) {
                        return factor;
                    }
                    return 0;
                }));
            }),
            /**
             * sort variables by add order
             */
            sortByAddOrder: action(() => {
                this.currentVariables.replace(this.currentVariables.sort((a, b) => {
                    if (this.addOrder.indexOf(a.id) < this.addOrder.indexOf(b.id)) {
                        return -1;
                    }
                    if (this.addOrder.indexOf(a.id) > this.addOrder.indexOf(b.id)) {
                        return 1;
                    }
                    return 0;
                }));
            }),
            /**
             * sort variables alphabetically
             * @param {boolean} asc - sort ascending/descending
             */
            sortAlphabetically: action((asc) => {
                let factor = 1;
                if (!asc) {
                    factor = -1;
                }
                this.currentVariables.replace(this.currentVariables.sort((a, b) => {
                    if (this.referencedVariables[a.id].name < this.referencedVariables[b.id].name) {
                        return -factor;
                    }
                    if (this.referencedVariables[a.id].name > this.referencedVariables[b.id].name) {
                        return factor;
                    }
                    return 0;
                }));
            }),
            /**
             * sort variables by datatype (alphabetically)
             */
            sortByDatatype: action((asc) => {
                let factor = 1;
                if (!asc) {
                    factor = -1;
                }
                this.currentVariables.replace(this.currentVariables.sort((a, b) => {
                    if (this.referencedVariables[a.id].datatype
                        < this.referencedVariables[b.id].datatype) {
                        return -factor;
                    }
                    if (this.referencedVariables[a.id].datatype
                        > this.referencedVariables[b.id].datatype) {
                        return factor;
                    }
                    return 0;
                }));
            }),

            /**
             * moves variables up or down
             * @param {boolean} isUp - if true move up, if false move down
             * @param {boolean} toExtreme - if true move to top/bottom,
             * if false move only by one row
             * @param {number[]} indices: move these indices
             */
            move: action((isUp, toExtreme, indices) => {
                if (toExtreme) {
                    this.moveToExtreme(isUp, indices);
                } else {
                    this.moveByOneRow(isUp, indices);
                }
            }),

            /**
             * move a group of variables at indices to the top or the bottom
             * @param {boolean} isUp
             * @param {number[]} indices
             */
            moveToExtreme: action((isUp, indices) => {
                let currentVariablesCopy = this.currentVariables.slice();
                const selectedVariables = currentVariablesCopy
                    .filter((d, i) => indices.includes(i));
                const notSelectedVariables = currentVariablesCopy
                    .filter((d, i) => !indices.includes(i));
                if (isUp) {
                    currentVariablesCopy = [...selectedVariables, ...notSelectedVariables];
                } else {
                    currentVariablesCopy = [...notSelectedVariables, ...selectedVariables];
                }
                this.currentVariables.replace(currentVariablesCopy);
            }),

            /**
             * move variable(s) up or down by one row
             * @param {boolean} isUp
             * @param {number[]} indices
             */
            moveByOneRow: action((isUp, indices) => {
                const currentVariablesCopy = this.currentVariables.slice();
                let extreme; let
                    getNextIndex;
                if (isUp) {
                    extreme = 0;
                    getNextIndex = index => index - 1;
                } else {
                    extreme = currentVariablesCopy.length - 1;
                    indices.reverse();
                    getNextIndex = index => index + 1;
                }
                indices.forEach((d) => {
                    if ((d !== extreme)) {
                        if (!(indices.includes(extreme) && VariableManagerStore.isBlock(indices))) {
                            const save = currentVariablesCopy[getNextIndex(d)];
                            currentVariablesCopy[getNextIndex(d)] = currentVariablesCopy[d];
                            currentVariablesCopy[d] = save;
                        }
                    }
                });
                this.currentVariables.replace(currentVariablesCopy);
            }),
        });
        /**
         * removes a variable from current variables
         * @param {string} variableId
         */
        observe(this.currentVariables, () => {
            this.updateReferences();
        });
    }

    /**
     * saves a variable in saved references
     * @param {string} variableId
     */
    saveVariable(variableId) {
        if (!this.savedReferences.includes(variableId)) {
            this.savedReferences.push(variableId);
        }
    }

    /**
     * removes a variable from saved references
     * @param {string} variableId
     */
    removeSavedVariable(variableId) {
        if (this.savedReferences.includes(variableId)) {
            this.savedReferences.splice(this.savedReferences.indexOf(variableId), 1);
        }
    }

    /**
     * updates saving a variable
     * @param {string} variableId
     * @param {boolean} save - save variable (true) remove variable completely (false)
     */
    updateSavedVariables(variableId, save) {
        if (save) {
            this.saveVariable(variableId);
        } else {
            this.removeSavedVariable(variableId);
        }
    }

    /**
     * changes the color range of a variable
     * @param {string} variableId
     * @param {string[]} range
     * @param {boolean} applyToAll
     */
    changeVariableRange(variableId, range, applyToAll) {
        if (!range.every((d, i) => d === this.referencedVariables[variableId].range[i])) {
            if (applyToAll) {
                this.applyRangeToEntireProfile(this.referencedVariables[variableId].profile, range);
            } else {
                this.referencedVariables[variableId].changeRange(range);
            }
        }
    }

    /**
     * change the name of a variable
     * @param {string} variableId
     * @param {string} name
     */
    changeVariableName(variableId, name) {
        if (this.referencedVariables[variableId].name !== name) {
            this.referencedVariables[variableId].changeName(name);
        }
    }


    /**
     * applies a color range to all variables in a profile
     * @param {string} profileId
     * @param {string} range
     */
    applyRangeToEntireProfile(profileId, range) {
        Object.keys(this.referencedVariables).forEach((variable) => {
            if (this.referencedVariables[variable].profile === profileId) {
                this.referencedVariables[variable].changeRange(range);
            }
        });
    }

    /**
     * Increment the referenced property of all the variables which
     * are used by the current variable (and their "child variables")
     * @param {string} currentId
     */
    setReferences(currentId) {
        if (!(this.referencedVariables[currentId].originalIds.length === 1
            && this.referencedVariables[currentId].originalIds[0] === currentId)) {
            this.referencedVariables[currentId].originalIds.forEach((d) => {
                this.setReferences(d);
            });
        }
        this.referencedVariables[currentId].referenced += 1;
    }

    /**
     * updates references, removes variables that are no longer references
     */
    updateReferences() {
        Object.keys(this.referencedVariables).forEach((variable) => {
            this.referencedVariables[variable].referenced = 0;
        });
        this.currentVariables.forEach(d => this.setReferences(d.id));
        this.savedReferences.forEach(d => this.setReferences(d));
        Object.keys(this.referencedVariables).forEach((variable) => {
            if (this.referencedVariables[variable].referenced === 0) {
                delete this.referencedVariables[variable];
            }
        });
    }

    /**
     * adds a variable to referenced variables
     * @param {(DerivedVariable|OriginalVariable)} variable
     */
    addVariableToBeReferenced(variable) {
        if (!(variable.id in this.referencedVariables)) {
            this.referencedVariables[variable.id] = variable;
        }
    }

    /**
     * gets the minimum value of all variables in a continuous profile
     * @param {string} profile
     * @return {number}
     */
    getMinOfProfile(profile) {
        return Math.min(...Object.keys(this.referencedVariables)
            .filter(variable => this.getById(variable).profile === profile)
            .map(variable => this.getById(variable).domain[0]));
    }

    /**
     * gets the maximum value of all variables in a continuous profile
     * @param {string} profile
     * @return {number}
     */
    getMaxOfProfile(profile) {
        return Math.max(...Object.keys(this.referencedVariables)
            .filter(variable => this.getById(variable).profile === profile)
            .map(variable => this.getById(variable).domain[this
                .getById(variable).domain.length - 1]));
    }

    /**
     * gets the domain of values of all variables in a continuous profile
     * @param {string} profile
     * @return {number[]}
     */
    getProfileDomain(profile) {
        const min = this.getMinOfProfile(profile);
        const max = this.getMaxOfProfile(profile);
        return [min, max];
    }


    /**
     * checks if the selected variables indices are a block (not selected variable in between)
     * @param {number[]} array
     * @returns {boolean}
     */
    static isBlock(array) {
        const sorted = array.sort((a, b) => a - b);
        let isBlock = true;
        const current = sorted[0];
        for (let i = 1; i < sorted.length; i += 1) {
            if (sorted[i] !== current + 1) {
                isBlock = false;
                break;
            }
        }
        return isBlock;
    }

    /**
     * check if variable has changed
     * @param {string} oldId
     * @param {DerivedVariable} newVariable
     * @returns {boolean}
     */
    variableChanged(oldId, newVariable) {
        if (this.referencedVariables[oldId].datatype !== newVariable.datatype) {
            return true;
        }

        // case: domain changed?
        if (!this.referencedVariables[oldId].domain.every((d, i) => d === newVariable.domain[i])) {
            return true;
            // case: mapper changed?
        }
        return Object.keys(this.referencedVariables[oldId].mapper)
            .some(sample => this.referencedVariables[oldId].mapper[sample]
                !== newVariable.mapper[sample]);
    }

    isInTable(id) {
        return this.currentVariables.map(d => d.id).includes(id);
    }

    /**
     * gets a variable by id
     * @param {string} id
     */
    getById(id) {
        return this.referencedVariables[id];
    }

    /**
     * gets all variables that are selected
     * @return {(OriginalVariable|DerivedVariable)[]}
     */
    getSelectedVariables() {
        return this.currentVariables.filter(d => d.isSelected)
            .map(d => this.referencedVariables[d.id]);
    }

    /**
     * gets all selected variable indices
     * @return {number[]}
     */
    getSelectedIndices() {
        return this.currentVariables.map((d, i) => ({ isSelected: d.isSelected, index: i }))
            .filter(d => d.isSelected).map(d => d.index);
    }
}

export default VariableManagerStore;
