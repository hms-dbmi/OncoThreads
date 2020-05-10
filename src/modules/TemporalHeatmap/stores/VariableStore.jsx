import { action, extendObservable, observe } from 'mobx';
import MultipleTimepointsStore from './MultipleTimepointsStore';

/*
 Store containing information about variables
 */
class VariableStore {
    constructor(rootStore, type) {
        this.childStore = new MultipleTimepointsStore(rootStore, type);
        this.rootStore = rootStore;
        this.type = type;
        // Derived variables that are not displayed but should be saved for later use
        this.savedReferences = [];
        extendObservable(this, {
            // List of ids of currently displayed variables
            currentVariables: [],
            // Variables that are referenced (displayed or used to create a derived variable)
            referencedVariables: {},
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
            removeCurrentVariable: action((id) => {
                this.currentVariables.remove(id);
            }),
            /**
             * adds a variable to the view
             */
            addCurrentVariable: action((id) => {
                this.currentVariables.push(id);
            }),
            /**
             * replaces a current variable
             */
            replaceCurrentVariable: action((oldId, id) => {
                this.currentVariables[this.currentVariables.indexOf(oldId)] = id;
            }),
            /**
             * replaces all current variables
             */
            replaceAllCurrentVariables: action((newIds) => {
                this.currentVariables.replace(newIds);
            }),
            /**
             * adds a variable to be displayed
             */
            addVariableToBeDisplayed: action((variable) => {
                if (!(variable.id in this.referencedVariables)) {
                    this.referencedVariables[variable.id] = variable;
                }
                if (!this.currentVariables.includes(variable.id)) {
                    this.addCurrentVariable(variable.id);
                }
            }),
            /**
             * adds variables to be displayed
             */
            addVariablesToBeDisplayed: action((variables) => {
                variables.forEach((d) => {
                    this.addVariableToBeDisplayed(d);
                });
            }),
            /**
             * replaces a displayed variable
             */
            replaceDisplayedVariable: action((oldId, newVariable) => {
                if (!(newVariable.id in this.referencedVariables)) {
                    this.referencedVariables[newVariable.id] = newVariable;
                }
                this.replaceCurrentVariable(oldId, newVariable.id);
            }),
            /**
             * replaces referenced, current and primary variables
             */
            replaceAll: action((referencedVariables, currentVariables, primaryVariables) => {
                console.info('variablestrore', primaryVariables)
                this.replaceVariables(referencedVariables, currentVariables);
                this.childStore.timepoints.forEach((d, i) => {
                    if (primaryVariables[i] !== undefined) {
                        if (referencedVariables[primaryVariables[i]].datatype === 'NUMBER') {
                            d.setIsGrouped(false);
                        }
                    }
                    d.setPrimaryVariable(primaryVariables[i]);
                });
            }),
            /**
             * replaces referenced and current variables
             */
            replaceVariables: action((referencedVariables, currentVariables) => {
                this.referencedVariables = referencedVariables;
                this.replaceAllCurrentVariables(currentVariables);
            }),

            /**
             * removes a variable from current variables
             * @param variableId
             */
            removeVariable: action((variableId) => {
                this.removeCurrentVariable(variableId);
            }),

        });
        // Observe the change and update timepoints accordingly
        observe(this.currentVariables, (change) => {
            if (change.type === 'splice') {
                if (change.removedCount > 0) {
                    change.removed.forEach((d) => {
                        if (!change.added.includes(d)) {
                            this.childStore.removeHeatmapRows(d);
                        }
                    });
                }
                if (change.addedCount > 0) {
                    change.added.forEach((d) => {
                        if (!change.removed.includes(d)) {
                            this.childStore.addHeatmapRows(d, this.referencedVariables[d].mapper);
                        }
                    });
                }
                if (this.currentVariables.length > 0) {
                    this.childStore.resortHeatmapRows(this.currentVariables);
                    if (this.type === 'sample' && change.removed.includes(this.rootStore.dataStore.globalPrimary)) {
                        this.rootStore.dataStore.setGlobalPrimary(this.currentVariables[0]);
                    }
                }
                if(this.type === 'sample' && this.currentVariables.length === change.addedCount - change.removedCount){
                    this.rootStore.dataStore.setGlobalPrimary(this.currentVariables[0]);
                }
                if (change.addedCount > change.removedCount) {
                    this.rootStore.visStore.fitToBlockHeight();
                }
            } else if (change.type === 'update') {
                this.childStore.updateHeatmapRows(change.index, change.newValue,
                    this.getById(change.newValue).mapper);
            }
            this.updateReferences();
            this.updateVariableRanges();
        });
    }

    /**
     * Update children if structure changes
     * @param structure
     * @param order
     */
    update(structure, order) {
        this.childStore.updateTimepointStructure(structure, order);
        this.currentVariables.forEach((d) => {
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
        } else {
            this.removeSavedVariable(variableId);
        }
    }

    /**
     * updates shared range of variables of the same profile (e.g. expression data)
     */
    updateVariableRanges() {
        const profileDomains = {};
        // only variables that are associated with a molecular profile and have a numerical range
        const profileVariables = this.currentVariables.filter(d => this.referencedVariables[d].type === 'molecular' && this.referencedVariables[d].datatype === 'NUMBER');
        profileVariables.forEach((variableId) => {
            const variable = this.referencedVariables[variableId];
            const domain = variable.getDefaultDomain();
            if (!(variable.profile in profileDomains)) {
                profileDomains[variable.profile] = domain;
            } else {
                if (profileDomains[variable.profile][0] > domain[0]) {
                    profileDomains[variable.profile][0] = domain[0];
                }
                if (profileDomains[variable.profile][1] < domain[1]) {
                    profileDomains[variable.profile][1] = domain[1];
                }
            }
        });
        profileVariables.forEach((variableId) => {
            if (this.referencedVariables[variableId].profile in profileDomains) {
                this.referencedVariables[variableId]
                    .changeDomain(profileDomains[this.referencedVariables[variableId].profile]);
            }
        });
    }


    /**
     * Increment the referenced property of all the variables
     * which are used by the current variable (and their "descendant variables")
     * @param currentId
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
     * updates variable tree, deletes unused variables and events
     */
    updateReferences() {
        Object.keys(this.referencedVariables).forEach((id) => {
            this.referencedVariables[id].referenced = 0;
        });
        this.currentVariables.forEach(d => this.setReferences(d));
        this.savedReferences.forEach(d => this.setReferences(d));
        Object.keys(this.referencedVariables).forEach((id) => {
            if (this.referencedVariables[id].referenced === 0) {
                delete this.referencedVariables[id];
            }
        });
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
     * gets all current variables which are related by type (related = derived from)
     * @param variableType
     * @returns {any[]}
     */
    getRelatedVariables(variableType) {
        const relatedVariables = [];
        this.currentVariables.forEach((d) => {
            if (this.recursiveSearch(d, variableType)) {
                relatedVariables.push(d);
            }
        });
        return relatedVariables.map(d => this.referencedVariables[d]);
    }

    /**
     * check if a variable is or is derived of an event
     * @param variableId
     * @returns {boolean}
     */
    isEventDerived(variableId) {
        if (this.referencedVariables[variableId].type === 'event') {
            return true;
        }
        if (this.referencedVariables[variableId].derived) {
            return this.referencedVariables[variableId].originalIds
                .map(d => this.isEventDerived(d)).includes(true);
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
        if (this.referencedVariables[id].derived) {
            return this.referencedVariables[id].originalIds
                .map(d => this.recursiveSearch(d, variableType)).includes(true);
        }

        return false;
    }
}

export default VariableStore;
