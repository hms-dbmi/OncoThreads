import React from 'react';
import { inject, observer } from 'mobx-react';
import EventVariableSelector from './EventVariableSelector';
import VariableTable from './VariableTable';
import UtilityFunctions from '../../UtilityClasses/UtilityFunctions';

/**
 * Component for managing event variables
 */
const AddEventVarTab = inject('rootStore')(observer(class AddEventVarTab extends React.Component {
    render() {
        // set available categories (event eventType)
        const categories = [...Object.keys(this.props.rootStore.eventAttributes).filter(d => d !== 'SPECIMEN').map(d => ({
            id: d,
            name: UtilityFunctions.toTitleCase(d),
        })), { id: 'Computed', name: 'Computed' }];
        return (
            <div>
                <EventVariableSelector eventCategories={categories} />
                <h4>Current Features</h4>
                <VariableTable
                    availableCategories={categories}
                    openSaveVarModal={this.props.openSaveVarModal}
                />
            </div>

        );
    }
}));
export default AddEventVarTab;
