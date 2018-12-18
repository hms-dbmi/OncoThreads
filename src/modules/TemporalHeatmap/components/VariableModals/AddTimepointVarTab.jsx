import React from 'react';
import {observer} from 'mobx-react';
import TimepointVariableSelector from "./TimepointVariableSelector";
import VariableTable from "./VariableTable";
import UndoRedoStore from "../../UndoRedoStore";
import VariableManagerStore from "./VariableManagerStore";
import OriginalVariable from "../../OriginalVariable";
import {toJS} from "mobx";


const AddTimepointVarTab = observer(class AddVarModal extends React.Component {
    constructor(props) {
        super();
        this.state = {
            addOrder: props.currentVariables.slice()
        };
        this.variableManagerStore = new VariableManagerStore(UndoRedoStore.serializeVariables(props.referencedVariables), props.currentVariables.slice());
        this.handleVariableAdd = this.handleVariableAdd.bind(this);
        this.handleGeneSelect = this.handleGeneSelect.bind(this);
        this.removeVariable = this.removeVariable.bind(this);
    }

    /**
     * adds predefined variable
     * @param variable
     * @param category
     * @param select
     */
    handleVariableAdd(variable, category, select) {
        if (select) {
            if (!(this.variableManagerStore.currentVariables.includes(variable.id))) {
                this.variableManagerStore.addVariableToBeDisplayed(new OriginalVariable(variable.id, variable.variable, variable.datatype, variable.description, [], [], this.props.staticMappers[variable.id], category));
                this.setState({addOrder: [...this.state.addOrder, variable.id]})
            }
        }
        this.props.setData(toJS(this.variableManagerStore.currentVariables), this.variableManagerStore.referencedVariables);
    }

    /**
     * removes variable
     * @param variableId
     */
    removeVariable(variableId) {
        this.variableManagerStore.removeVariable(variableId);
        if (this.state.addOrder.includes(variableId)) {
            let addOrder = this.state.addOrder.slice();
            addOrder.splice(this.addOrder.indexOf(variableId), 1);
            this.setState({addOrder: addOrder})
        }
        this.props.setData(toJS(this.variableManagerStore.currentVariables), this.variableManagerStore.referencedVariables);
    }

    /**
     * handles adding the selected genes
     * @param variable
     */
    handleGeneSelect(variable) {
        this.variableManagerStore.addVariableToBeDisplayed(variable);
        this.setState({addOrder: [...this.state.addOrder, variable.id]});
        this.props.setData(toJS(this.variableManagerStore.currentVariables), this.variableManagerStore.referencedVariables);
    }

    render() {
        let availableCategories=[...this.props.availableProfiles,...this.props.mutationMappingTypes.map(d=>{return{id:d,name:"Mutation - "+d}}),{id:"clinSample",name:"Clinical sample data"},{id:"clinPatient",name:"Clinical patient data"}];
        return (
            <div>
                <TimepointVariableSelector {...this.props}
                                           handleVariableAdd={this.handleVariableAdd}
                                           removeVariable={this.removeVariable}
                                           handleGeneSelect={this.handleGeneSelect}
                                           currentVariables={this.variableManagerStore.currentVariables}/>
                <VariableTable {...this.props} variableManagerStore={this.variableManagerStore}
                               addOrder={this.state.addOrder} availableCategories={availableCategories}/>
            </div>

        )
    }
});
export default AddTimepointVarTab;
