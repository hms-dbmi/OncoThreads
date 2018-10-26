import React from "react";
import {observer} from "mobx-react";


/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed as arrows
 */
const BlockTextField = observer(class BlockTextField extends React.Component {


    setName(event) {
        this.props.timepoint.setName(event.target.value);
    }

    render() {
        return (
            <foreignObject><input
                style={{textAlign: 'center', width: this.props.width, height: 30}} value={this.props.timepoint.name}
                onChange={(e) => this.setName(e)} type="text"/>
            </foreignObject>
        );
    }
});
export default BlockTextField;
