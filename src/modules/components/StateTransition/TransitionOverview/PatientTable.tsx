import React from "react"
import { observer, inject } from 'mobx-react';
import { IRootStore } from "modules/Type";
import { ColumnsType } from 'antd/lib/table'
import { Table } from 'antd';
import {getTextWidth, summarizeDomain} from 'modules/UtilityClasses'
import CellGlyph, {GlyphProps} from 'modules/components/CellGlyph'
import { keys, toJS } from "mobx";
import RootStore from "modules/stores/RootStore";

interface Props {
    rootStore?: IRootStore,
    annotationWidth: number,
    paddingW: number,
    height: number,
    groupOffsetX: number[],
    xScale: d3.ScaleLinear<number, number>
}

type RowRecordType = { key:string, attr: string, [key: string]: any }


@inject('rootStore')
@observer
class PatientTable extends React.Component<Props, {}> {
    
    getPatientTable(){
        const cellHeight =  45, textHeight = 14
        const {groupOffsetX, xScale} = this.props
        const {dataStore} = this.props.rootStore!
        const {patientGroups} = dataStore
        const {currentVariables, referencedVariables} = dataStore.variableStores.sample
        const patientVars = this.props.rootStore!.clinicalPatientCategories.map((d:any)=>d.id)
        const patientRelatedVars = currentVariables.filter(
            (id:string)=> ( patientVars.includes(id) || referencedVariables[id].originalIds.every((d:string)=>patientVars.includes(d)) )
        )

        let columns : ColumnsType<RowRecordType> = patientGroups.map((patients, groupIdx)=>{
            // const cellWidth = groupIdx>0?groupOffsetX[groupIdx] - groupOffsetX[groupIdx-1] : groupOffsetX[groupIdx]
            const cellWidth = xScale(patients.length)
            const title = getTextWidth(`group_${groupIdx+1}`, 12) > cellWidth ? groupIdx+1:`group_${groupIdx+1}`
            
            return {
                title,
                dataIndex: `group_${groupIdx}`,
                key: `group_${groupIdx}`,
                align: 'center',
                width: cellWidth,
                render: (values, fulldata)=>{
                    if (!values) return ''
                    if (values.length==0) return ''

                    const {key} = fulldata
                    const {domain, name} = this.props.rootStore!.dataStore.variableStores.sample.referencedVariables[key]
                    if (typeof values[0]=='number'){
                        values.sort((a:number,b:number)=>a-b)
                    } else values.sort()
                    

                    let text='', domains = summarizeDomain(values)
                    if (typeof values[0] === 'number'){
                        text = domains.join('~')
                    }else{
                        text = domains.join(',')
                    }
                    
                    let valueGroup: {value:string|number|boolean, counts: number}[] = []
                    values.forEach((v:any)=>{
                        const idx = valueGroup.map(v=>v.value).indexOf(v)
                        if (idx>-1) valueGroup[idx]['counts'] +=1;
                        else valueGroup.push({value:v, counts: 1})
                    })
                    return <svg width={cellWidth} height={cellHeight + textHeight}>
                        <g transform={`translate(${ (cellWidth - xScale(values.length))/2}, 0)`}>
                            <CellGlyph xScale={xScale} cellHeight={cellHeight} type={typeof values[0]} values={valueGroup} featureDomain={domain} showLabel={true}/>
                        </g>
                        {typeof values[0] === "number"? <text x={cellWidth/2} y={ (cellHeight+textHeight)/2} textAnchor="middle" >{text}</text>:<></>}
                        {getTextWidth(name, 12)<=cellWidth?
                            <text x={cellWidth/2} y={ cellHeight+textHeight} textAnchor="middle" >{name}</text>
                            :<></>
                        }
                    </svg>
                },
            }
        })
        const tableData = patientRelatedVars.map((attr:string)=>{
            let row:any = {}
            const attrMapper = referencedVariables[attr].mapper // attrMapper: sample id => attribute value
            const {sampleStructure} = this.props.rootStore! //sample structure maps patient id to patient samples
            patientGroups.forEach((patients, groupIdx)=>{
                row[`group_${groupIdx}`] = patients.map(p=>{
                    return attrMapper[sampleStructure[p][0]]
                })
            })
            return {
                key: attr,
                ...row
            }
        })

        return <Table bordered columns={columns} dataSource={tableData} pagination={false} 
        className="patientTable"/>
        
    }
    render(){
        return this.getPatientTable()
    }
}

export default PatientTable