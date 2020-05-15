import React from 'react';
import { observer  } from 'mobx-react';
import {Button, Table} from 'antd';
import {CloseSquareOutlined} from '@ant-design/icons';
import ColorScales, { getColorByName } from 'modules/TemporalHeatmap/UtilityClasses/ColorScales'
const colors = ColorScales.defaultCategoricalRange


export type TStage = {
    domains:{[domain:string]:string[]|number[]},
    stageKey:string
}

interface Props {
    stages: TStage[],
    height: number,
    stageLabels: {[key:string]:string}
    resetGroup: ()=>void,
    deleteGroup: (groupIdx:number)=>void,
    applyCustomGroups:()=>void,
}




const StageInfo = observer(class StageInfo extends React.Component<Props, {}> {
    constructor(props:Props){
        super(props)
    }
    render(){
        let {stages} = this.props

        let content = stages.map((stage,i)=>{
            let {domains, stageKey} = stage
            let values = Object.keys(domains).map(key=>{
                let domain = domains[key]
                return <span style={{marginRight:'2px'}} key={key}>{
                    domain.length===0?'':`[${domain.join()}]`
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
                <CloseSquareOutlined onClick={()=>this.props.deleteGroup(i)}/> 
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