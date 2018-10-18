import {extendObservable} from "mobx";
import OriginalVariable from "./OriginalVariable";
import DerivedVariable from "./DerivedVariable";
import EventVariable from "./EventVariable";

/*
Store containing information about variables
 */
class VariableStore {
    constructor() {
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
     * @param description
     * @param domain
     * @param range
     */
    addOriginalVariable(id, name, datatype, description, range, mapper, display) {
        const newVariable = new OriginalVariable(id, name, datatype, description, range, mapper);
        if (display) {
            this.currentVariables.push(newVariable);
        }
        this.allVariables.push(newVariable);
    }

    /**
     * adds a derived variable consisting of a combination of event variables
     * @param newId
     * @param name
     * @param eventType
     * @param selectedVariables
     * @param logicalOperator
     * @param mapper
     * @param singleMappers
     */
    addCombinedEventVariable(newId, name, eventType, selectedVariables, logicalOperator, mapper, singleMappers) {
        const _self = this;
        let description = "";
        selectedVariables.forEach(function (f, i) {
            if (description !== "") {
                description += " -" + logicalOperator + "- ";
            }
            description += f.name;
            if (!_self.allVariables.map(function (d) {
                return d.id;
            }).includes(f.id)) {
                const newVariable = new EventVariable(f.id, f.name, "binary", eventType, f.eventType, singleMappers[i]);
                _self.allVariables.push(newVariable);
            }
        });
        let combinedEvent = new DerivedVariable(newId, name, "binary", description, selectedVariables.map(function (d, i) {
            return d.id;
        }), logicalOperator, null, mapper);
        this.allVariables.push(combinedEvent);
        this.currentVariables.push(combinedEvent);
    }


    addEventVariable(eventType, selectedVariable, mapper, display) {
        const _self = this;
        if (!_self.allVariables.map(function (d) {
            return d.id;
        }).includes(selectedVariable.id)) {
            const newVariable = new EventVariable(selectedVariable.id, selectedVariable.name, "binary", eventType, selectedVariable.eventType, mapper);
            _self.allVariables.push(newVariable);
            if (display) {
                _self.currentVariables.push(newVariable);
            }
        }
        else if (!_self.hasVariable(selectedVariable.id && display)) {
            _self.currentVariables.push(_self.getByIdAllVariables(selectedVariable.id));

        }
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
    addDerivedVariable(id, name, datatype, description, originalIds, modificationType, modification, mapper) {
        const newVariable = new DerivedVariable(id, name, datatype, description, originalIds, modificationType, modification, mapper);
        this.currentVariables.push(newVariable);
        this.allVariables.push(newVariable);
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
     * @param domain
     */
    modifyVariable(id, name, datatype, description, originalId, modificationType, modification, domain, mapper) {
        const newVariable = new DerivedVariable(id, name, datatype, description, [originalId], modificationType, modification, domain, [], mapper);
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

    hadVariableAll(id) {
        return this.allVariables.map(function (d) {
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