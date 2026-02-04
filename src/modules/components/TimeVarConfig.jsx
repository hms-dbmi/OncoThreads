import React from 'react';
import { inject, observer } from 'mobx-react';
import { Form } from 'react-bootstrap';

/**
 * Legend Component
 */
const TimeVarConfig = inject('rootStore', 'uiStore')(observer(class TimeVarConfig extends React.Component {
    constructor() {
        super();
        this.handleClick = this.handleClick.bind(this);
        
    }

    handleClick(id, value) {
        console.info(id, value)
        this.props.rootStore.setTimeData(id,value)
    }

    render() {
        
        
        return (
            
            <div
            className="menu">
            <Form.Check type="radio" name="groupOptions" onClick={e => this.handleClick("1", "Days")} label="Days" />
            <Form.Check type="radio" name="groupOptions" onClick={e => this.handleClick("7", "Weeks")} label="Weeks" />
            <Form.Check type="radio" name="groupOptions" onClick={e => this.handleClick("30", "Months")} label="Months" />
            <Form.Check type="radio" name="groupOptions" onClick={e => this.handleClick("365", "Years")} label="Years" />
        </div>
        );
    }
}));

export default TimeVarConfig;
