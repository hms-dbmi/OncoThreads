import React from 'react';
import {inject, observer} from 'mobx-react';
import TimepointVariableSelector from "./TimepointVariableSelector";
import VariableTable from "./VariableTable";


const AddTimepointVarTab = inject("variableManagerStore", "rootStore")(observer(class AddVarModal extends React.Component {
    render() {
        let availableCategories = [{id: "clinPatient", name: "Clinical patient data"}
            , {id: "clinSample", name: "Clinical sample data"}
            , ...this.props.rootStore.mutationMappingTypes.map(d => {
                return {id: d, name: "Mutation - " + d}
            })
            , ...this.props.rootStore.availableProfiles.map(d => {
                return {id: d.molecularProfileId, name: d.name}
            })];
        return (
            <div>
                <TimepointVariableSelector/>
                <VariableTable availableCategories={availableCategories}/>
            </div>

        )
    }
}));
export default AddTimepointVarTab;
