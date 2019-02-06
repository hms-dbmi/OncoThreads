import React from 'react';
import {observer} from 'mobx-react';
import EventVariableSelector from "./EventVariableSelector";
import VariableTable from "./VariableTable";
import UndoRedoStore from "../../UndoRedoStore";
import VariableManagerStore from "./VariableManagerStore";
import OriginalVariable from "../../OriginalVariable";


const AddEventVarTab = observer(class AddEventVarTab extends React.Component {
    constructor(props) {
        super();
        this.state = {
            addOrder: props.currentVariables.slice()

        };
        this.addEventVariable = this.addEventVariable.bind(this);
        this.handleSavedVariableAdd = this.handleSavedVariableAdd.bind(this);
        this.addTimepointDistance = this.addTimepointDistance.bind(this);
        this.removeVariable = this.removeVariable.bind(this);
    }

    /**
     * adds event variable
     * @param event
     * @param eventCategory
     */
    addEventVariable(event, eventCategory) {
        this.props.variableManagerStore.addVariableToBeDisplayed(new OriginalVariable(event.id, event.name, "BINARY", "Indicates if event: \"" + event.name + "\" has happened between two timepoints", [], [], this.props.store.getSampleEventMapping(eventCategory, event), eventCategory, "event"));
        //this.props.variableManagerStore.addVariableToBeDisplayed(new EventVariable(event.id, event.name, eventCategory, event.eventType, [], this.props.store.getSampleEventMapping(eventCategory, event)));
        this.setState({addOrder: [...this.state.addOrder, event.id]})
    }

    handleSavedVariableAdd(variable) {
        if (!(this.props.variableManagerStore.currentVariables.includes(variable))) {
            this.props.variableManagerStore.addVariableToBeDisplayed(this.props.variableManagerStore.getById(variable));
            this.setState({addOrder: [...this.state.addOrder, variable]})
        }
    }

    /**
     * adds timepoint distance
     * @param timepointDistance
     */
    addTimepointDistance(timepointDistance) {
        this.props.variableManagerStore.addVariableToBeDisplayed(new OriginalVariable(timepointDistance.id, timepointDistance.name, timepointDistance.datatype, timepointDistance.description, [], [], this.props.staticMappers[timepointDistance.id], "Computed", false));
        this.setState({addOrder: [...this.state.addOrder, timepointDistance.id]})

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

    static toTitleCase(str) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    render() {
        let categories = [...this.props.eventCategories.filter(d => d !== "SPECIMEN").map(d => {
            return {id: d, name: AddEventVarTab.toTitleCase(d)}
        }), {id: "Computed", name: "Computed"}];
        return (
            <div>
                <EventVariableSelector {...this.props}
                                       eventCategories={categories}
                                       addTimepointDistance={this.addTimepointDistance}
                                       addEventVariable={this.addEventVariable}
                                       handleSavedVariableAdd={this.handleSavedVariableAdd}
                                       removeVariable={this.removeVariable}
                                       currentVariables={this.props.variableManagerStore.currentVariables}
                                       savedReferences={this.props.variableManagerStore.savedReferences}/>
                <VariableTable {...this.props} variableManagerStore={this.props.variableManagerStore}
                               addOrder={this.state.addOrder} availableCategories={categories}
                               removeVariable={this.removeVariable}/>
            </div>

        )
    }
});
export default AddEventVarTab;
