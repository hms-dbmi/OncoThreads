import React from 'react';
import {observer} from 'mobx-react';

const BinNames = observer(class BinNames extends React.Component {
    render() {
        let binNameFields = [];
        for (let i = 0; i < this.props.binNames.length; i++) {
            binNameFields.push(<label key={"Bin" + (i + 1)}>Bin {i + 1}: <input
                onChange={(e) => this.props.handleBinNameChange(e, i)} type="text"
                defaultValue={this.props.binNames[i]}/></label>);
            binNameFields.push(<br key={"br" + (i + 1)}/>)
        }
        return (
            <div>
                {binNameFields}
            </div>
        )
    }
});
export default BinNames;