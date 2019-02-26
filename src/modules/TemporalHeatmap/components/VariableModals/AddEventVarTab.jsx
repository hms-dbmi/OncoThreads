import React from 'react';
import {observer,inject} from 'mobx-react';
import EventVariableSelector from "./EventVariableSelector";
import VariableTable from "./VariableTable";

const AddEventVarTab = inject("variableManagerStore")(observer(class AddEventVarTab extends React.Component {
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
                <EventVariableSelector eventCategories={categories}/>
                <VariableTable availableCategories={categories}/>
            </div>

        )
    }
}));
export default AddEventVarTab;
