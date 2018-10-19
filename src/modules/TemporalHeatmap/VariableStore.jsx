import {extendObservable, observe} from "mobx";
import OriginalVariable from "./OriginalVariable";
import DerivedVariable from "./DerivedVariable";
import EventVariable from "./EventVariable";

/*
Store containing information about variables
 */
class VariableStore {
    constructor(parent, rootStore) {
        this.parent = parent;
        this.rootStore = rootStore;
        this.allVariables = {};
        extendObservable(this, {
            currentVariables: [],
        });
        observe(this.currentVariables, (change) => {
            if (change.type === 'splice') {
                if (change.added.length > 0) {
                    this.parent.addHeatmapVariable(change.added[0], this.getById(change.added[0]).mapper)
                }
                if (change.removed.length > 0) {
                    this.parent.removeVariable(change.removed[0]);
                }
            }
            else if (change.type === "update") {
                this.parent.updateVariable(change.newValue, this.getById(change.newValue).mapper, change.index)
            }

        });
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

    removeReferences(currentId) {
        const _self = this;
        if (!(this.allVariables[currentId].originalIds.length === 1 && this.allVariables[currentId].originalIds[0] === currentId)) {
            this.allVariables[currentId].originalIds.forEach(function (d) {
                _self.removeReferences(d);
            });
        }
        this.allVariables[currentId].referenced -= 1;
        if (this.allVariables[currentId].referenced === 0) {
            delete this.allVariables[currentId];
        }
    }


    updateReferences(currentId) {
        const _self = this;
        if (!(this.allVariables[currentId].originalIds.length === 1 && this.allVariables[currentId].originalIds[0] === currentId)) {
            this.allVariables[currentId].originalIds.forEach(function (d) {
                _self.updateReferences(d);
            });
        }
        _self.allVariables[currentId].referenced += 1;
    }

    /**
     * adds an original variable to the current variables and to all variables
     * @param id
     * @param name
     * @param datatype
     * @param description
     * @param range
     * @param mapper
     * @param display
     */
    addOriginalVariable(id, name, datatype, description, range, mapper, display) {
        if (!this.isReferenced(id)) {
            this.allVariables[id] = new OriginalVariable(id, name, datatype, description, range, mapper);
        }
        if (display && !this.isDisplayed(id)) {
            this.updateReferences(id);
            this.currentVariables.push(id);
            this.rootStore.undoRedoStore.saveVariableHistory("ADD", name, true);
        }
    }


    addEventVariable(eventType, selectedVariable, mapper, display) {
        const _self = this;
        if (!this.isReferenced(selectedVariable.id)) {
            _self.allVariables[selectedVariable.id] = new EventVariable(selectedVariable.id, selectedVariable.name, "binary", eventType, selectedVariable.eventType, mapper);
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
     * @param mapper
     */
    addDerivedVariable(id, name, datatype, description, originalIds, modificationType, modification, mapper) {
        this.allVariables[id] = new DerivedVariable(id, name, datatype, description, originalIds, modificationType, modification, mapper);
        this.updateReferences(id);
        this.currentVariables.push(id);
        this.rootStore.undoRedoStore.saveVariableHistory("ADD", name, true);

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
     * @param mapper
     */
    modifyVariable(id, name, datatype, description, originalId, modificationType, modification, mapper) {
        let oldName = this.allVariables[originalId].name;
        this.allVariables[id] = new DerivedVariable(id, name, datatype, description, [originalId], modificationType, modification, mapper);
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
        return this.allVariables[id];
    }

    isReferenced(id) {
        return id in this.allVariables;
    }

    isDisplayed(id) {
        return this.currentVariables.includes(id);
    }

    getIndex(id) {
        return this.currentVariables.indexOf(id);
    }

    getCurrentVariables() {
        return this.currentVariables.map(d => this.allVariables[d]);
    }

    getEventVariables() {
        let eventVar = [];
        for (let variableId in this.allVariables) {
            if (this.allVariables[variableId].type === "event") {
                eventVar.push(this.allVariables[variableId]);
            }
        }
        return eventVar;
    }

    getTotalNumberOfVariables() {
        return (Object.keys(this.allVariables).length);
    }

    getEventRelatedVariables() {
        const _self = this;
        let eventRelatedVariables = [];
        this.currentVariables.forEach(function (d) {
            if (_self.recursiveEventSearch(d)) {
                eventRelatedVariables.push(d);
            }
        });
        return eventRelatedVariables.map(d => this.allVariables[d])
    }

    recursiveEventSearch(id) {
        if (this.allVariables[id].type === "event") {
            return true;
        }
        else if (this.allVariables[id].type === "derived") {
            return this.allVariables[id].originalIds.map(d => this.recursiveEventSearch(d)).includes(true);
        }
        else {
            return false;
        }
    }
}

export default VariableStore;