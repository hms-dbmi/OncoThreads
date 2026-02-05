import React from 'react';
import { inject, observer } from 'mobx-react';
import { makeObservable, observable, action } from 'mobx';
import { Button } from 'react-bootstrap';
import { PlusOutlined } from '@ant-design/icons';
import VariableTable from './VariableTable';
import VariableExplorer from '../Modals/VariableExplorer';

/**
 * Component for management of timepoint variables
 */
const AddTimepointVarTab = inject('rootStore')(observer(class AddVarModal extends React.Component {
    variableExplorerIsOpen = false;

    constructor() {
        super();
        makeObservable(this, {
            variableExplorerIsOpen: observable.ref,
        });
    }

    render() {
        // set available categories (profiles)
        const availableCategories = [{ id: 'clinPatient', name: 'Clinical patient data' },
            { id: 'clinSample', name: 'Clinical sample data' },
            ...this.props.rootStore.mutationMappingTypes.map(d => ({ id: d, name: `Mutation - ${d}` })),
            ...this.props.rootStore.availableProfiles
                .map(d => ({ id: d.molecularProfileId, name: d.name }))];
        return (
            <div>
                <h4>
                    Current Features
                    <Button
                        style={{ marginLeft: 10 }}
                        variant="primary"
                        onClick={() => {
                            this.variableExplorerIsOpen = true;
                        }}
                    >
                        <PlusOutlined />
                        Add Features
                    </Button>
                </h4>
                <VariableTable
                    availableCategories={availableCategories}
                    openSaveVarModal={this.props.openSaveVarModal}
                />
                <VariableExplorer
                    close={() => {
                        this.variableExplorerIsOpen = false;
                    }}
                    availableCategories={availableCategories}
                    modalIsOpen={this.variableExplorerIsOpen}
                />
            </div>

        );
    }
}));

export default AddTimepointVarTab;
