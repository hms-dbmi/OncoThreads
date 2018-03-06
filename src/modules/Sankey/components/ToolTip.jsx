import React from 'react';
import {observer} from 'mobx-react';


const ToolTip = observer(class ToolTip extends React.Component {
    render() {
        let style = {};
        let text = "";
        if (this.props.tooltip.display) {
            text = this.props.tooltip.data.source + " -> " + this.props.tooltip.data.target + ": \n" + this.props.tooltip.data.value;
            style = {
                left: this.props.tooltip.pos.x,
                top: this.props.tooltip.pos.y,
            };
        }
        else {
            style["display"] = "none";
        }
        return (
            <div className="customToolTip" style={style}>
                {text}
            </div>
        );
    }
});
export default ToolTip;