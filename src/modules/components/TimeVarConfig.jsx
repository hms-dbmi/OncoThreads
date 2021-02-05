import React from 'react';
import { inject, observer } from 'mobx-react';
import { Radio } from 'react-bootstrap';

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
            <Radio name="groupOptions" onClick={e => this.handleClick("1", "Days")}>Days</Radio>
            <Radio name="groupOptions" onClick={e => this.handleClick("7", "Weeks")}>Weeks</Radio>
            <Radio name="groupOptions" onClick={e => this.handleClick("30", "Months")}>Months</Radio>
            <Radio name="groupOptions" onClick={e => this.handleClick("365", "Years")}>Years</Radio>
        </div>
        );
    }
}));

export default TimeVarConfig;
