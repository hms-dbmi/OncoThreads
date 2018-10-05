import React from "react";
import {observer} from "mobx-react";


/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed al
 */
const BlockTextField = observer(class BlockTextField extends React.Component {


    setName(event) {
        this.props.timepoint.setName(event.target.value)
    }

    render() {
        let label = this.props.timepoint.name;
        const _self = this;
        if (this.props.timepoint.type !== "sample") {
            if (this.props.name !== this.props.timepoint.localIndex) {
                label = '↓';
            }
        }
        return (
            <foreignObject><input
                style={{textAlign: 'center', width: this.props.width, height: 30}} value={label}
                onChange={(e) => _self.setName(e)} type="text"/>
            </foreignObject>
        );
    }
});
export default BlockTextField;
