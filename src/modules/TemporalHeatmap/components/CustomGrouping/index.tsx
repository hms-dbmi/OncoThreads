import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';

/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed as arrows
 */
const CustomGrouping = inject('dataStore', 'uiStore', 'visStore') (observer(class CustomGrouping extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        
        return (
            <div className="customGrouping">
            </div>
        );
    }
})
)
// CustomGrouping.propTypes = {
    
// };

export default CustomGrouping;
