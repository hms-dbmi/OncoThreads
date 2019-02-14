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
     */
    handleVariableAdd(variable, category) {
        this.props.variableManagerStore.addVariableToBeDisplayed(new OriginalVariable(variable.id, variable.variable, variable.datatype, variable.description, [], [], this.props.staticMappers[variable.id], category, category));
        this.setState({addOrder: [...this.state.addOrder, variable.id]})
    }

    handleSavedVariableAdd(variableId) {
        this.props.variableManagerStore.addVariableToBeDisplayed(this.props.variableManagerStore.getById(variableId));
        this.setState({addOrder: [...this.state.addOrder, variableId]})
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
     * @param variables
     */
    handleGeneSelect(variables) {
        variables.forEach(variable => {
            this.props.variableManagerStore.addVariableToBeDisplayed(variable);
            this.props.variableManagerStore.toggleSelected(variable.id);
            this.setState({addOrder: [...this.state.addOrder, variable.id]});
        })

    }

    render() {
        let availableCategories = [{id: "clinPatient", name: "Clinical patient data"}
            , {id: "clinSample", name: "Clinical sample data"}
            , ...this.props.mutationMappingTypes.map(d => {
                return {id: d, name: "Mutation - " + d}
            })
            , ...this.props.availableProfiles.map(d => {
                return {id: d.molecularProfileId, name: d.name}
            })];
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
