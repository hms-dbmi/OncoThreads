import React from 'react';
import { inject, observer } from 'mobx-react';
import { extendObservable } from 'mobx';
import { Button, Glyphicon } from 'react-bootstrap';
import VariableTable from './VariableTable';
import VariableExplorer from '../Modals/VariableExplorer';

/**
 * Component for management of timepoint variables
 */
const AddTimepointVarTab = inject('rootStore')(observer(class AddVarModal extends React.Component {
    constructor() {
        super();
        extendObservable(this, {
            variableExplorerIsOpen: false,
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
                    Current Variables
                    <Button
                        style={{ marginLeft: 10 }}
                        bsStyle="primary"
                        onClick={() => {
                            this.variableExplorerIsOpen = true;
                        }}
                    >
                        <Glyphicon glyph="plus" />
                        Add Variables
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
