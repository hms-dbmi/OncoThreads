import React from 'react';
import {observer} from 'mobx-react';
import FontAwesome from 'react-fontawesome';


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
            return(<label key={d.variable} className="currentVariable">{d.variable} <FontAwesome name="times" onClick={()=>_self.removeVariable(d.variable,type)}/></label>)
        })
    }
    render() {
        return (<div>
            <b>Current sample variables:</b>
            {this.getTextFields("sample")}
            <br/>
            <b>Current transition variables:</b>
            {this.getTextFields("between")}</div>)
    }
});
export default CurrentVariables;