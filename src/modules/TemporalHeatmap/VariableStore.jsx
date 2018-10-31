import {extendObservable, observe} from "mobx";
import OriginalVariable from "./OriginalVariable";
import DerivedVariable from "./DerivedVariable";
import EventVariable from "./EventVariable";
import MapperCombine from "./MapperCombineFunctions";
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
        this.currentVariables.splice(this.currentVariables.indexOf(variableId), 1);
        this.removeReferences(variableId);
        this.rootStore.undoRedoStore.saveVariableHistory("REMOVED", +name, true);
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
        _self.referencedVariables[currentId].referenced += 1;
    }

    /**
     * adds an original variable. If display is true the variable will be added to the current variables
     * @param id
     * @param name
     * @param datatype
     * @param description
     * @param range
     * @param display
     * @param mapper
     */
    addOriginalVariable(id, name, datatype, description, range, display, mapper) {
        if (!this.isReferenced(id)) {
            this.referencedVariables[id] = new OriginalVariable(id, name, datatype, description, range, [], mapper);
        }
        if (display && !this.isDisplayed(id)) {
            this.updateReferences(id);
            this.currentVariables.push(id);
            this.rootStore.undoRedoStore.saveVariableHistory("ADD", name, true);
        }
    }

    addVariableToBeReferenced(variable) {
        this.referencedVariables[variable.id] = variable;
    }

    addVariableToBeDisplayed(variable) {
        this.referencedVariables[variable.id] = variable;
        this.updateReferences(variable.id);
        this.currentVariables.push(variable.id);
    }

    /**
     * add an event variable. If display is true the variable will be added to the current variables
     * @param eventType
     * @param selectedVariable
     * @param display
     */
    addEventVariable(eventType, selectedVariable, display) {
        const _self = this;
        if (!this.isReferenced(selectedVariable.id)) {
            _self.referencedVariables[selectedVariable.id] = new EventVariable(selectedVariable.id, selectedVariable.name, "binary", eventType, selectedVariable.eventType, [], this.rootStore.getSampleEventMapping(eventType, selectedVariable));
        }
        if (!(_self.currentVariables.includes(selectedVariable.id)) && display) {
            this.updateReferences(selectedVariable.id);
            _self.currentVariables.push(selectedVariable.id);
            this.rootStore.undoRedoStore.saveVariableHistory("ADD", selectedVariable.name, true);
        }
    }

    /**
     * adds a derived variable to current and all variables
     * @param id
     * @param name
     * @param datatype
     * @param description
     * @param originalIds
     * @param modificationType
     * @param modification
     * @param display
     */
    addDerivedVariable(id, name, datatype, description, originalIds, modificationType, modification, display) {
        this.referencedVariables[id] = new DerivedVariable(id, name, datatype, description, originalIds, modificationType, modification, [], [], MapperCombine.getModificationMapper(modificationType, modification, originalIds.map(d => this.referencedVariables[d].mapper)));
        console.log(id);
        if (display) {
            this.updateReferences(id);
            this.currentVariables.push(id);
            this.rootStore.undoRedoStore.saveVariableHistory("ADD", name, true);
        }

    }

    replaceDisplayedVariable(oldId, newVariable) {
        if (!this.isReferenced(newVariable.id)) {
            this.referencedVariables[newVariable.id] = newVariable;
        }
        this.updateReferences(newVariable.id);
        this.removeReferences(oldId);
        this.currentVariables[this.currentVariables.indexOf(oldId)] = newVariable.id;
    }

    addDerivedToCurrent(id) {
        console.log(id);
        this.updateReferences(id);
        this.currentVariables.push(id);
    }

    /**
     * replaces a variable with a variable derived from it
     * @param id
     * @param name
     * @param datatype
     * @param description
     * @param originalId
     * @param modificationType
     * @param modification
     */
    modifyVariable(id, name, datatype, description, originalId, modificationType, modification) {
        let oldName = this.referencedVariables[originalId].name;
        this.referencedVariables[id] = new DerivedVariable(id, name, datatype, description, [originalId], modificationType, modification, [], [], MapperCombine.getModificationMapper(modificationType, modification, [this.referencedVariables[originalId].mapper]));
        this.updateReferences(id);
        this.currentVariables[this.getIndex(originalId)] = id;
        this.removeReferences(originalId);
        this.rootStore.undoRedoStore.saveVariableModification(modificationType, oldName, true);
    }


    /**
     * gets a variable by id
     * @param id
     */
    getById(id) {
        return this.referencedVariables[id];
    }

    /**
     * check if a variable is referenced (is in referencedVariables)
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