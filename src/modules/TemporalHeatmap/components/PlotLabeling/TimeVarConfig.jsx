import React from 'react';
import { inject, observer } from 'mobx-react';
import { Radio, InputNumber } from 'antd';

/**
 * Legend Component
 */
const TimeVarConfig = inject('rootStore', 'uiStore')(observer(class TimeVarConfig extends React.Component {
    constructor() {
        super();
        this.handleClick = this.handleClick.bind(this);
        this.handleChangeNumber = this.handleChangeNumber.bind(this);
        
    }

    handleClick(e) {
        console.info(e)
        this.props.rootStore.setTimeData(e.target.value, e.target.label)
    }
    handleChangeNumber(num) {
        // console.info(e)
        this.props.rootStore.setTimeData(num, num+'days')
    }

    render() {
        const radioStyle = {
            display: 'block',
            height: '30px',
            lineHeight: '30px',
          };
        
        return (
            
            <div
            className="menu">
            {/* <Radio name="groupOptions" onClick={e => this.handleClick("1", "Days")}>Days</Radio>
            <Radio name="groupOptions" onClick={e => this.handleClick("7", "Weeks")}>Weeks</Radio>
            <Radio name="groupOptions" onClick={e => this.handleClick("30", "Months")}>Months</Radio>
            <Radio name="groupOptions" onClick={e => this.handleClick("365", "Years")}>Years</Radio> */}

            <Radio.Group onChange={this.handleClick} defaultValue={1}>
                <Radio style={radioStyle} value={1/3600} label="minutes">
                    minute
                </Radio>
                <Radio style={radioStyle} value={1/60} label="hours">
                    hour
                </Radio>
                <Radio style={radioStyle} value={1} label="days">
                    day
                </Radio>
                <Radio style={radioStyle} value={7} label="weeks">
                    week
                </Radio>
                <Radio style={radioStyle} value={30} label="months">
                    months
                </Radio>
                <Radio style={radioStyle} value={365} label="years">
                    years
                </Radio>
            </Radio.Group>
            <br/>
            Customize a time range <br/>
            <InputNumber min={1} max={100} defaultValue={1} onChange={this.handleChangeNumber}  /> days
        </div>
        );
    }
}));

export default TimeVarConfig;
