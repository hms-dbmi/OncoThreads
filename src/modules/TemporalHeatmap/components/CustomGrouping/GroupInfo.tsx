import React from 'react';
import { observer  } from 'mobx-react';
import {Button, Table} from 'antd';
import {CloseSquareOutlined} from '@ant-design/icons';
import ColorScales from 'modules/TemporalHeatmap/UtilityClasses/ColorScales'
const colors = ColorScales.defaultCategoricalRange

interface Props {
    groups: any[],
    height: number,
    resetGroup: ()=>void,
    deleteGroup: (groupIdx:number)=>void,
}


const GroupInfo = observer(class GroupInfo extends React.Component<Props, {}> {
    constructor(props:Props){
        super(props)
    }
    render(){
        let {groups} = this.props

        let content = groups.map((g,i)=>{
            let values = Object.keys(g).map(key=>{
                let domain = g[key]
                return <span style={{marginRight:'2px'}} key={key}>{
                    domain.length==0?'':`[${domain.join()}]`
                    }</span>
                })
            // if(Object.values(g)){
                values.unshift(<span>Group_{i}</span>)
            // }
            return <p key={`group_${i}`} style={{color: colors[i]}}>
                {values} 
                <CloseSquareOutlined onClick={()=>this.props.deleteGroup(i)}/> 
                </p>
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


export default GroupInfo