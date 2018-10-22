import {extendObservable, observe} from "mobx";
import OriginalVariable from "./OriginalVariable";
import DerivedVariable from "./DerivedVariable";
import EventVariable from "./EventVariable";
import MapperCombine from "./MapperCombineFunctions";

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
                    this.parent.addHeatmapRows(change.added[0], this.getById(change.added[0]).mapper)
                }
                if (change.removed.length > 0) {
                    this.parent.removeHeatmapRows(change.removed[0]);
                }
            }
            else if (change.type === "update") {
                this.parent.updateHeatmapRows(change.newValue, this.getById(change.newValue).mapper, change.index)
            }
            this.rootStore.timepointStore.regroupTimepoints();

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
            if(this.allVariables[currentId].type==="event"){
                delete this.rootStore.eventTimelineMap[currentId];
            }
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
    addOriginalVariable(id, name, datatype, description, range, display) {
        if (!this.isReferenced(id)) {
            this.allVariables[id] = new OriginalVariable(id, name, datatype, description, range, this.rootStore.staticMappers[id]);
        }
        if (display && !this.isDisplayed(id)) {
            this.updateReferences(id);
            this.currentVariables.push(id);
            this.rootStore.undoRedoStore.saveVariableHistory("ADD", name, true);
        }
    }


    addEventVariable(eventType, selectedVariable, display) {
        const _self = this;
        if (!this.isReferenced(selectedVariable.id)) {
            _self.allVariables[selectedVariable.id] = new EventVariable(selectedVariable.id, selectedVariable.name, "binary", eventType, selectedVariable.eventType, this.rootStore.getSampleEventMapping(eventType,selectedVariable));
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
     */
    addDerivedVariable(id, name, datatype, description, originalIds, modificationType, modification) {
        this.allVariables[id] = new DerivedVariable(id, name, datatype, description, originalIds, modificationType, modification, MapperCombine.getModificationMapper(modificationType, modification, originalIds.map(d => this.allVariables[d].mapper)));
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
     */
    modifyVariable(id, name, datatype, description, originalId, modificationType, modification) {
        let oldName = this.allVariables[originalId].name;
        this.allVariables[id] = new DerivedVariable(id, name, datatype, description, [originalId], modificationType, modification, MapperCombine.getModificationMapper(modificationType, modification, [this.allVariables[originalId].mapper]));
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

    getVariablesOfType(type) {
        let typeVar = [];
        for (let variableId in this.allVariables) {
            if (this.allVariables[variableId].type === type) {
                typeVar.push(this.allVariables[variableId]);
            }
        }
        return typeVar;
    }

    getTotalNumberOfVariables() {
        return (Object.keys(this.allVariables).length);
    }

    getRelatedVariables(variableType) {
        const _self = this;
        let relatedVariables = [];
        this.currentVariables.forEach(function (d) {
            if (_self.recursiveSearch(d, variableType)) {
                relatedVariables.push(d);
            }
        });
        return relatedVariables.map(d => this.allVariables[d])
    }

    recursiveSearch(id, variableType) {
        if (this.allVariables[id].type === variableType) {
            return true;
        }
        else if (this.allVariables[id].type === "derived") {
            return this.allVariables[id].originalIds.map(d => this.recursiveSearch(d, variableType)).includes(true);
        }
        else {
            return false;
        }
    }
}

export default VariableStore;