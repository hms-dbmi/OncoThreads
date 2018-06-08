import {extendObservable} from "mobx";
import OriginalVariable from "./OriginalVariable";
import DerivedVariable from "./DerivedVariable";

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
        let isIncluded=false;
        this.currentVariables.forEach(function (d) {
            if(d.derived){
                if(d.originalIds.includes(variableId)){
                    isIncluded=true;
                }
            }
        });
        if(!isIncluded){
            this.allVariables.splice(this.allVariables.map(function (d) {
                return d.id;
            }).indexOf(variableId),1);
        }
    }

    /**
     * adds an original variable to the current variables and to all variables
     * @param id
     * @param name
     * @param datatype
     */
    addOriginalVariable(id, name, datatype) {
        const newVariable = new OriginalVariable(id, name, datatype);
        this.currentVariables.push(newVariable);
        this.allVariables.push(newVariable);
    }

    /**
     * adds a variable to all variables (usually used when a derived variable is added)
     * @param id
     * @param name
     * @param datatype
     */
    addToAllVariables(id, name, datatype){
        if(!this.allVariables.map(function (d) {
                return d.id;
            }).includes(id)) {
            const newVariable = new OriginalVariable(id, name, datatype);
            this.allVariables.push(newVariable);
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
     */
    modifyVariable(id, name, datatype, originalId, modificationType, modification) {
        const newVariable = new DerivedVariable(id, name, datatype, [originalId], modificationType, modification);
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
    hasVariable(id){
        return this.currentVariables.map(function (d) {
            return d.id
        }).includes(id)
    }

    /**
     * gets a variable by id
     * @param id
     */
    getById(id){
        return this.currentVariables.filter(function (d) {
            return d.id===id
        })[0];
    }

    getByOriginalId(id){

        return this.allVariables.filter(d=>!d.derived).filter(function (d) {
            return d.id===id
        })[0];

        //_self.props.store.variableStore[timepoint.type].allVariables
        //.filter(d=>!d.derived).filter(function(k){return k.id == element})[0];

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