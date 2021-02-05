import React from 'react';
import { observer  } from 'mobx-react';
import {Button, Table, Space} from 'antd';
import { getColorByName, getTextWidth } from 'modules/UtilityClasses'
import {TState} from './index'
import { ColumnsType } from 'antd/lib/table'


interface Props {
    states: TState[],
    height: number,
    width: number,
    stateLabels: {[key:string]:string}
    resetGroup: ()=>void,
    deleteGroup: (stateKey:string)=>void,
    // applyCustomGroups:()=>void,
}

type IDataRow = {
    state: string| string[] | number[] | boolean[]
}




const StateInfo = observer(class StateInfo extends React.Component<Props, {}> {
   
    render(){
        let {states} = this.props

        let content = states.map((state,i)=>{
            let {domains, stateKey} = state
            let values = Object.keys(domains).map(key=>{
                let range = domains[key]
                return <span style={{marginRight:'2px'}} key={key}>{
                    range.length===0?'':`[${range.join()}]`
                    }</span>
                })

            let stateName:string;
            if (this.props.stateLabels[stateKey]===undefined){
                stateName=stateKey
            }else stateName = this.props.stateLabels[stateKey]
            // if(Object.values(g)){
                values.unshift(<span key='stateKey'>{stateName}</span>)
            // }
            return <p key={`state_${i}`} style={{color: getColorByName(stateKey)}}>
                {values} 
                <Button size='small' onClick={()=>this.props.deleteGroup(stateKey)} style={{borderRadius:'3px'}}> delete </Button> 
                </p>
        })
        
        return <div className="StateInfo"  style={{height:this.props.height, paddingTop:"5px", borderTop:"#ccc solid 1px"}} 
            // data-intro="text summary of each state and their temporal distribution"
            >
            {/* <Table columns={col} dataSource={data} pagination={false} size="small"/> */}
            <h4 style={{
                    border: "solid #bbb 1px",
                    borderRadius:"5px",
                    width: "auto",
                    display: "inline-block",
                    padding: "3px 15px"
            }}>State Summary</h4>
            <div className="state" style={{height:this.props.height-35, overflow:"auto"}}>
                {content}
            </div>
            <div className='button group' style={{float:'right'}}>
                <Button size="small" onClick={this.props.resetGroup}>Reset</Button>
                {/* <Button size="small" onClick={this.props.applyCustomGroups}>Apply</Button> */}
            </div>
            </div>
    }

    // render(){
    //     let {states, stateLabels} = this.props
    //     let data = states.map(state=>{
    //         let datarow: IDataRow= {
    //             state: stateLabels[state.stateKey] || state.stateKey,
    //             ...state.domains,
    //         }
    //         return datarow
    //     })

    //     let columns: ColumnsType<IDataRow> = Object.keys(states[0].domains).map((attr)=>{
    //         return {
    //             title: attr,
    //             dataIndex: attr,
    //             // ellipsis: true,
    //             width: 150,
    //             // width: getTextWidth(attr, 12),
    //             render: (text)=>{
    //                 return <span >{text.join('~')}</span>
    //             }
    //         }
    //     })

    //     columns.unshift({
    //         title: ' ',
    //         dataIndex:'state',
    //         ellipsis: true,
    //         width: 50,
    //         fixed:'left',
    //         // render: (text)=>{
    //         //     return <span style={{color: getColorByName(text)}}>{text}</span>
    //         // }
    //     })

    //     columns.push({
    //         title: ' ',
    //         dataIndex:'action',
    //         width: 80,
    //         fixed: 'right',
    //         render: (text:string, datarow)=>(
    //             <Button size='small' onClick={()=>this.props.deleteGroup(datarow.state as string)} style={{borderRadius:'3px'}}> delete </Button> 
    //           )
    //     })

    //     return <Table columns={columns} dataSource={data} pagination={false} scroll={{ y: this.props.height, x: 'max-content' }} bordered title={()=>'State Summary'}/>
    // }
})


export default StateInfo