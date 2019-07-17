import React from 'react';
import { inject, observer } from 'mobx-react';
import TimepointVariableSelector from './TimepointVariableSelector';
import VariableTable from './VariableTable';

/**
 * Component for management of timepoint variables
 */
const AddTimepointVarTab = inject('rootStore')(observer(class AddVarModal extends React.Component {
    render() {
        // set available categories (profiles)
        const availableCategories = [{ id: 'clinPatient', name: 'Clinical patient data' },
            { id: 'clinSample', name: 'Clinical sample data' },
            ...this.props.rootStore.mutationMappingTypes.map(d => ({ id: d, name: `Mutation - ${d}` })),
            ...this.props.rootStore.availableProfiles
                .map(d => ({ id: d.molecularProfileId, name: d.name }))];
        return (
            <div>
                <TimepointVariableSelector />
                <VariableTable availableCategories={availableCategories} />
            </div>

        );
    }
}));

export default AddTimepointVarTab;
