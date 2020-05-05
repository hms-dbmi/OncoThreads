import React from 'react';
import { observer , PropTypes as MobxPropTypes } from 'mobx-react';
import PropTypes from 'prop-types';
import {Button, Table} from 'antd';
import * as d3 from 'd3';
import ColorScales from 'modules/TemporalHeatmap/UtilityClasses/ColorScales'
const colors = ColorScales.defaultCategoricalRange

const GroupInfo = observer(class GroupInfo extends React.Component {
    constructor(props){
        super(props)
    }
    render(){
        let {groups} = this.props
        // const col = [{
        //     title: 'group',
        //     dataIndex: 'group',
        //     key: 'group',
        //     render: text => <span style={{color: colors[2]}}>{text}</span>,
        //   }].concat(
        //       Object.keys(groups[0]).map(name=>{
        //           return {
        //               title: name,
        //               dataIndex: name,
        //               key: name,
        //               render: domain=>{return domain.length==0?'':`[${domain.join()}]`}
        //           }
        //       })

        //   )

        // const data = groups.map((g,i)=>{
        //     return {
        //         ...g,
        //         key: i
        //     }
        // })
        let content = groups.map((g,i)=>{
            let values = Object.keys(g).map(key=>{
                let domain = g[key]
                return <span style={{marginRight:'2px'}} >{
                    domain.length==0?'':`[${domain.join()}]`
                    }</span>
                })
            // if(Object.values(g)){
                values.unshift(<span>Group_{i}</span>)
            // }
            return <p key={`group_${i}`} style={{color: colors[i]}}>{values }</p>
        })
        
        return <div className="GroupInfo"  style={{height:this.props.height, padding:"5px"}}>
            {/* <Table columns={col} dataSource={data} pagination={false} size="small"/> */}
            <div className="groups" style={{height:this.props.height-35, overflow:"auto"}}>
                {content}
            </div>
            <div className='button group' style={{float:'right'}}>
                <Button size="small" onClick={this.props.resetGroup}>Reset</Button>
                <Button size="small">Apply</Button>
            </div>
            </div>
    }}
    )

GroupInfo.PropTypes={
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
    height: PropTypes.number.isRequired,
    resetGroup: PropTypes.func.isRequired,
}

export default GroupInfo