import React from "react"
import { observer, inject } from 'mobx-react';
import { IRootStore } from "modules/Type";
import { ColumnsType } from 'antd/lib/table'
import { Table } from 'antd';
import {summarizeDomain} from 'modules/UtilityClasses'
import CellGlyph, {GlyphProps} from 'modules/components/CellGlyph'

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
        const {groupOffsetX, xScale} = this.props
        const {patientMappers} = this.props.rootStore!
        const {patientGroups} = this.props.rootStore!.dataStore
        const {currentVariables} = this.props.rootStore!.dataStore.variableStores.sample
        const patientVars = Object.keys(patientMappers).filter(id=>currentVariables.includes(id))

        let columns : ColumnsType<RowRecordType> = patientGroups.map((_, groupIdx)=>{
            const cellWidth = groupIdx>0?groupOffsetX[groupIdx] - groupOffsetX[groupIdx-1] : groupOffsetX[groupIdx]
            return {
                title: `group_${groupIdx+1}`,
                dataIndex: `group_${groupIdx}`,
                key: `group_${groupIdx}`,
                align: 'center',
                render: (values, fulldata)=>{
                    if (!values) return ''
                    if (values.length==0) return ''

                    const {key} = fulldata
                    const {domain} = this.props.rootStore!.dataStore.variableStores.sample.referencedVariables[key]
                    values = values.sort()

                    let text='', domains = summarizeDomain(values)
                    if (typeof values[0] === 'number'){
                        text = domains.join('~')
                    }else{
                        text = domains.join(',')
                    }
                    const cellHeight =  15
                    let valueGroup: {value:string|number|boolean, counts: number}[] = []
                    values.forEach((v:any)=>{
                        const idx = valueGroup.map(v=>v.value).indexOf(v)
                        if (idx>-1) valueGroup[idx]['counts'] +=1;
                        else valueGroup.push({value:v, counts: 1})
                    })
                    return <svg width={cellWidth} height={cellHeight}>
                        <CellGlyph xScale={xScale} cellHeight={cellHeight} type={typeof values[0]} values={valueGroup} featureDomain={domain}/>
                        <text x={cellWidth/2} y={12} textAnchor="middle" >{text}</text>
                    </svg>
                },
                width: cellWidth
            }
        })

        columns.unshift({
            title: '',
            dataIndex: 'attr',
            key: 'attr',
            width: this.props.annotationWidth + this.props.paddingW
        })

        let tableData = patientVars.map((attr)=>{
            let row:any = {}
            patientGroups.forEach((patients, groupIdx)=>{
                row[`group_${groupIdx}`] = patients.map(p=>patientMappers[attr][p])
            })
            return {
                key: attr,
                attr: attr,
                ...row
            }
        })

        return <Table columns={columns} dataSource={tableData} pagination={false} scroll={{ y: this.props.height }} />
        
    }
    render(){
        return this.getPatientTable()
    }
}

export default PatientTable