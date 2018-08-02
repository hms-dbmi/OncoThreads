import {extendObservable} from "mobx";
import OriginalVariable from "./OriginalVariable";
import DerivedVariable from "./DerivedVariable";
import EventVariable from "./EventVariable";

/*
Store containing information about variables
 */
class VariableStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.allVariables = [];
        extendObservable(this, {
            currentVariables: [],
        });
    }

    /**
     * removes a variable from current variables
     * @param variableId
     */
    removeVariable(variableId) {
        this.currentVariables.splice(this.currentVariables.map(function (d) {
            return d.id
        }).indexOf(variableId), 1);
        let isIncluded = false;
        this.currentVariables.forEach(function (d) {
            if (d.derived) {
                if (d.originalIds.includes(variableId)) {
                    isIncluded = true;
                }
            }
        });
        if (!isIncluded) {
            this.allVariables.splice(this.allVariables.map(function (d) {
                return d.id;
            }).indexOf(variableId), 1);
        }
    }

    /**
     * adds an original variable to the current variables and to all variables
     * @param id
     * @param name
     * @param datatype
     * @param domain
     * @param range
     */
    addOriginalVariable(id, name, datatype, domain, range) {
        const newVariable = new OriginalVariable(id, name, datatype, domain, range);
        this.currentVariables.push(newVariable);
        this.allVariables.push(newVariable);
    }

    /**
     * adds a derived variable consisting of a combination of event variables
     * @param newId
     * @param name
     * @param eventType
     * @param selectedVariables
     * @param eventSubtype
     * @param logicalOperator
     * @param domain
     * @param range
     */
    addCombinedEventVariable(newId, name, eventType, selectedVariables, eventSubtype, logicalOperator, domain, range) {
        const _self = this;
        selectedVariables.forEach(function (f) {
            if (!_self.allVariables.map(function (d) {
                return d.id;
            }).includes(f.id)) {
                const newVariable = new EventVariable(f.id, f.name, "binary", eventType, eventSubtype);
                _self.allVariables.push(newVariable);
            }
        });
        let combinedEvent = new DerivedVariable(newId, name, "binary", selectedVariables.map(function (d, i) {
            return d.id;
        }), logicalOperator, null, domain);
        this.allVariables.push(combinedEvent);
        this.currentVariables.push(combinedEvent);
    }

    /**
     * adds multiple single events at once (w/o combining)
     * @param eventType
     * @param selectedVariables
     * @param eventSubtype
     */
    addSeperateEventVariables(eventType, selectedVariables, eventSubtype){
        const _self=this;
        selectedVariables.forEach(function (f) {
            if (!_self.allVariables.map(function (d) {
                return d.id;
            }).includes(f.id)) {
                const newVariable = new EventVariable(f.id, f.name, "binary", eventType, eventSubtype);
                _self.allVariables.push(newVariable);
                _self.currentVariables.push(newVariable);
            }
            else{
                _self.currentVariables.push(_self.getByIdAllVariables(f.id));

            }
        });
    }

    /**
     * adds a derived variable to current and all variables
     * @param id
     * @param name
     * @param datatype
     * @param originalIds
     * @param modificationType
     * @param modification
     */
    addDerivedVariable(id, name, datatype, originalIds, modificationType, modification) {
        const newVariable = new DerivedVariable(id, name, datatype, originalIds, modificationType, modification);
        this.currentVariables.push(newVariable);
        this.allVariables.push(newVariable);
    }

    /**
     * replaces a variable with a variable derived from it
     * @param id
     * @param name
     * @param datatype
     * @param originalId
     * @param modificationType
     * @param modification
     * @param domain
     */
    modifyVariable(id, name, datatype, originalId, modificationType, modification, domain) {
        const newVariable = new DerivedVariable(id, name, datatype, [originalId], modificationType, modification, domain);
        const oldIndex = this.currentVariables.map(function (d) {
            return d.id;
        }).indexOf(originalId);
        this.currentVariables[oldIndex] = newVariable;
        this.allVariables.push(newVariable);
    }

    /**
     * checks if a variable exists in current variables
     * @param id
     * @returns {boolean}
     */
    hasVariable(id) {
        return this.currentVariables.map(function (d) {
            return d.id
        }).includes(id)
    }

    getVariableIndex(id) {
        return this.currentVariables.map(function (d) {
            return d.id;
        }).indexOf(id)
    }

    /**
     * gets a variable by id
     * @param id
     */
    getById(id) {
        return this.currentVariables.filter(function (d) {
            return d.id === id
        })[0];
    }

    getByIdAllVariables(id) {
        return this.allVariables.filter(function (d) {
            return d.id === id
        })[0];
    }

    getByOriginalId(id) {
        return this.allVariables.filter(d => !d.derived).filter(function (d) {
            return d.id === id
        })[0];

    }

    /**
     * checks if a variable is continuous
     * @param variableId
     * @returns {boolean}
     */
    isContinuous(variableId) {
        return this.currentVariables.filter(function (d) {
            return d.id === variableId;
        })[0].datatype === "NUMBER";
    }
}

export default VariableStore;