import React from 'react';
import { observer  } from 'mobx-react';
import {Button} from 'antd';
import { getColorByName } from 'modules/TemporalHeatmap/UtilityClasses/'
import {TStage} from './index'


interface Props {
    stages: TStage[],
    height: number,
    stageLabels: {[key:string]:string}
    resetGroup: ()=>void,
    deleteGroup: (stageKey:string)=>void,
    applyCustomGroups:()=>void,
}




const StageInfo = observer(class StageInfo extends React.Component<Props, {}> {
   
    render(){
        let {stages} = this.props

        let content = stages.map((stage,i)=>{
            let {domains, stageKey} = stage
            let values = Object.keys(domains).map(key=>{
                let range = domains[key]
                return <span style={{marginRight:'2px'}} key={key}>{
                    range.length===0?'':`[${range.join()}]`
                    }</span>
                })

            let stageName:string;
            if (this.props.stageLabels[stageKey]===undefined){
                stageName=stageKey
            }else stageName = this.props.stageLabels[stageKey]
            // if(Object.values(g)){
                values.unshift(<span key='stageKey'>{stageName}</span>)
            // }
            return <p key={`stage_${i}`} style={{color: getColorByName(stageKey)}}>
                {values} 
                <Button size='small' onClick={()=>this.props.deleteGroup(stageKey)}> x </Button> 
                </p>
        })
        
        return <div className="StageInfo"  style={{height:this.props.height, padding:"5px"}}>
            {/* <Table columns={col} dataSource={data} pagination={false} size="small"/> */}
            <div className="stage" style={{height:this.props.height-35, overflow:"auto"}}>
                {content}
            </div>
            <div className='button group' style={{float:'right'}}>
                <Button size="small" onClick={this.props.resetGroup}>Reset</Button>
                <Button size="small" onClick={this.props.applyCustomGroups}>Apply</Button>
            </div>
            </div>
    }}
    )


export default StageInfo