import React from "react"
import { observer, inject } from 'mobx-react';
import { IRootStore } from "modules/Type";
import { ColumnsType } from 'antd/lib/table'
import { Table } from 'antd';
import {summarizeDomain} from 'modules/UtilityClasses'

interface Props {
    rootStore?: IRootStore,
    annotationWidth: number,
    paddingW: number,
    height: number
}

type RowRecordType = { key:string, attr: string, [key: string]: any }

@inject('rootStore')
@observer
class PatientTable extends React.Component<Props, {}> {
    getPatientTable(){
        const {patientMappers} = this.props.rootStore!
        const {patientGroups} = this.props.rootStore!.dataStore
        const {currentVariables} = this.props.rootStore!.dataStore.variableStores.sample
        const patientVars = Object.keys(patientMappers).filter(id=>currentVariables.includes(id))

        let columns : ColumnsType<RowRecordType> = patientGroups.map((_, groupIdx)=>{
            return {
                title: `group_${groupIdx}`,
                dataIndex: `group_${groupIdx}`,
                key: `group_${groupIdx}`,
                align: 'center',
                render: values=>{
                    let text='', domains = summarizeDomain(values)
                    if (typeof values[0] === 'number'){
                        text = domains.join('~')
                    }else{
                        text = domains.join(',')
                    }
                    return <span>{text}</span>
                }
                // width: groupIdx>0?this.groupLabelOffsetX[groupIdx] - this.groupLabelOffsetX[groupIdx-1] : this.groupLabelOffsetX[groupIdx]
            }
        })

        columns.unshift({
            title: '',
            dataIndex: 'attr',
            key: 'attr'
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