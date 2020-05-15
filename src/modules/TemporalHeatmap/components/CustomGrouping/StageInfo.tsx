import React from 'react';
import { observer  } from 'mobx-react';
import {Button, Table} from 'antd';
import {CloseSquareOutlined} from '@ant-design/icons';
import ColorScales from 'modules/TemporalHeatmap/UtilityClasses/ColorScales'
const colors = ColorScales.defaultCategoricalRange


export type TStage = {
    domains:{[domain:string]:string[]|number[]},
    stageName:string
}

interface Props {
    stages: TStage[],
    height: number,
    resetGroup: ()=>void,
    deleteGroup: (groupIdx:number)=>void,
    applyCustomGroups:()=>void,
}

const num2letter = (num:number):string=>{
    var mod = num % 26
    
    return String.fromCharCode(65 + mod)
}


const StageInfo = observer(class StageInfo extends React.Component<Props, {}> {
    constructor(props:Props){
        super(props)
    }
    render(){
        let {stages} = this.props

        let content = stages.map((stage,i)=>{
            let values = Object.keys(stage.domains).map(key=>{
                let domain = stage.domains[key]
                return <span style={{marginRight:'2px'}} key={key}>{
                    domain.length===0?'':`[${domain.join()}]`
                    }</span>
                })
            // if(Object.values(g)){
                values.unshift(<span key='stageName'>{stage.stageName}</span>)
            // }
            return <p key={`stage_${i}`} style={{color: colors[i]}}>
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