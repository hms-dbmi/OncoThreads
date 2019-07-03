import React from 'react';
import { observer, inject } from 'mobx-react';
import EventVariableSelector from './EventVariableSelector';
import VariableTable from './VariableTable';
import UtilityFunctions from '../../UtilityClasses/UtilityFunctions';

/**
 * Component for managing event variables
 */
const AddEventVarTab = inject('variableManagerStore', 'rootStore')(observer(class AddEventVarTab extends React.Component {
    render() {
        // set available categories (event eventType)
        const categories = [...this.props.rootStore.eventCategories.filter(d => d !== 'SPECIMEN').map(d => ({ id: d, name: UtilityFunctions.toTitleCase(d) })), { id: 'Computed', name: 'Computed' }];
        return (
            <div>
                <EventVariableSelector eventCategories={categories} />
                <VariableTable availableCategories={categories} />
            </div>

        );
    }
}));
export default AddEventVarTab;
