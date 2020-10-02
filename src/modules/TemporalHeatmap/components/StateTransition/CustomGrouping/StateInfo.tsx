import React from 'react';
import { observer  } from 'mobx-react';
import {Button} from 'antd';
import { getColorByName } from 'modules/TemporalHeatmap/UtilityClasses/'
import {TState} from './index'


interface Props {
    states: TState[],
    height: number,
    stateLabels: {[key:string]:string}
    resetGroup: ()=>void,
    deleteGroup: (stateKey:string)=>void,
    // applyCustomGroups:()=>void,
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
        
        return <div className="StateInfo"  style={{height:this.props.height, paddingTop:"5px", borderTop:"#ccc solid 1px"}} data-intro="text summary of each state and their temporal distribution">
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
    }}
    )


export default StateInfo