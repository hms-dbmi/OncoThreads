import React from 'react';
import {observer} from 'mobx-react';
import TimepointVariableSelector from "./TimepointVariableSelector";
import VariableTable from "./VariableTable";
import OriginalVariable from "../../OriginalVariable";


const AddTimepointVarTab = observer(class AddVarModal extends React.Component {
    constructor(props) {
        super();
        this.state = {
            addOrder: props.currentVariables.slice()
        };
        this.handleVariableAdd = this.handleVariableAdd.bind(this);
        this.handleSavedVariableAdd = this.handleSavedVariableAdd.bind(this);
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
            if (!(this.props.variableManagerStore.currentVariables.includes(variable.id))) {
                this.props.variableManagerStore.addVariableToBeDisplayed(new OriginalVariable(variable.id, variable.variable, variable.datatype, variable.description, [], [], this.props.staticMappers[variable.id], category));
                this.setState({addOrder: [...this.state.addOrder, variable.id]})
            }
        }
    }

    handleSavedVariableAdd(variable) {
        if (!(this.props.variableManagerStore.currentVariables.includes(variable))) {
            this.props.variableManagerStore.addVariableToBeDisplayed(this.props.variableManagerStore.getById(variable));
            this.setState({addOrder: [...this.state.addOrder, variable]})
        }
    }

    /**
     * removes variable
     * @param variableId
     */
    removeVariable(variableId) {
        this.props.variableManagerStore.removeVariable(variableId);
        if (this.state.addOrder.includes(variableId)) {
            let addOrder = this.state.addOrder.slice();
            addOrder.splice(addOrder.indexOf(variableId), 1);
            this.setState({addOrder: addOrder})
        }
    }

    /**
     * handles adding the selected genes
     * @param variable
     */
    handleGeneSelect(variable) {
        this.props.variableManagerStore.addVariableToBeDisplayed(variable);
        this.setState({addOrder: [...this.state.addOrder, variable.id]});
    }

    render() {
        let availableCategories = [...this.props.availableProfiles, ...this.props.mutationMappingTypes.map(d => {
            return {id: d, name: "Mutation - " + d}
        }), {id: "clinSample", name: "Clinical sample data"}, {id: "clinPatient", name: "Clinical patient data"}];
        return (
            <div>
                <TimepointVariableSelector {...this.props}
                                           variableStore={this.props.variableManagerStore}
                                           handleVariableAdd={this.handleVariableAdd}
                                           handleSavedVariableAdd={this.handleSavedVariableAdd}
                                           removeVariable={this.removeVariable}
                                           handleGeneSelect={this.handleGeneSelect}
                                           currentVariables={this.props.variableManagerStore.currentVariables}
                                            savedReferences={this.props.variableManagerStore.savedReferences}/>
                <VariableTable {...this.props} variableManagerStore={this.props.variableManagerStore}
                               addOrder={this.state.addOrder} availableCategories={availableCategories}
                               removeVariable={this.removeVariable}/>
            </div>

        )
    }
});
export default AddTimepointVarTab;
