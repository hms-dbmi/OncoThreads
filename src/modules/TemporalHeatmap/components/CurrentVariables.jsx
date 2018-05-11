import React from 'react';
import {observer} from 'mobx-react';

/*
Creates the list of current variables
 */
const CurrentVariables = observer(class CurrentVariables extends React.Component {
    constructor(){
        super();
        this.removeVariable=this.removeVariable.bind(this);
    }

    /**
     * removes a variable from the view
     * @param variable
     * @param type
     */
    removeVariable(variable,type) {
        this.props.store.removeVariable(variable,type);
    }
    getTextFields(type){
        const _self=this;
        return this.props.currentVariables[type].map(function(d){
            return(<label key={d.variable} className="currentVariable">{d.variable}<button onClick={()=>_self.removeVariable(d.variable,type)} className="noStyle">X</button></label>)
        })
    }
    render() {
        return (<div>
            <label>Current sample variables:</label>
            {this.getTextFields("sample")}
            <br/>
            <label>Current transition variables:</label>
            {this.getTextFields("between")}</div>)
    }
});
export default CurrentVariables;