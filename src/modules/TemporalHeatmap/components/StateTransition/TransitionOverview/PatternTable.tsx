import React from "react"
import { observer, inject } from 'mobx-react';
import { IRootStore } from "modules/Type";
import { Table, Input, Button, Space, Checkbox, Tooltip } from 'antd';
import { getColorByName } from 'modules/TemporalHeatmap/UtilityClasses/'
import { SearchOutlined } from '@ant-design/icons';
import { ColumnsType } from 'antd/lib/table'
import { TPattern } from "modules/TemporalHeatmap/UtilityClasses/prefixSpan";

type RowRecordType = { key: string, pattern: TPattern, [key: string]: any }

interface Props {
    rootStore?: IRootStore,
    height: number,
    annotationWidth:number,
    paddingW:number
}

interface State {
    searchedPatternLengths: number[]
}

@inject('rootStore')
@observer
class PatternTable extends React.Component <Props, State> {
    searchInput: Input | null = null;
    constructor(props: Props) {
        super(props)
        this.state = {
            searchedPatternLengths: [2, 3]
        }
    }
    frequentPatternTable() {
        let { dataStore } = this.props.rootStore!

        let { ngramResults, frequentPatterns, patientGroups, encodingMetric } = dataStore
        if (encodingMetric === "ngram") {
            frequentPatterns = ngramResults
        }
        let rectW = 10

        const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
            confirm();

        };

        const handleReset = (clearFilters: () => void) => {
            clearFilters()
        };

        const changePatternLength = (len: number) => {
            let { searchedPatternLengths } = this.state
            let idx = searchedPatternLengths.indexOf(len)
            if (idx > -1) {
                searchedPatternLengths.splice(idx, 1)
            } else {
                searchedPatternLengths.push(len)
            }

            this.setState({ searchedPatternLengths })
        }

        const getColumnSearchProps = (dataIndex: string) => ({
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: { setSelectedKeys: any, selectedKeys: string[], confirm: () => void, clearFilters: () => void }) => (
                <div style={{ padding: 8 }}>
                    contains: <Input
                        ref={node => {
                            this.searchInput = node;
                        }}
                        placeholder={`Search ${dataIndex}`}
                        value={selectedKeys[0]}
                        onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                    <Checkbox checked={this.state.searchedPatternLengths.includes(2)} onChange={() => changePatternLength(2)} /> two-state pattern
                    <br />
                    <Checkbox checked={this.state.searchedPatternLengths.includes(3)} onChange={() => changePatternLength(3)} /> three-state pattern
                    <br />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                            icon={<SearchOutlined translate='(0,0)' />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Search
                  </Button>
                        <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
                            Reset
                  </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered: boolean) => <SearchOutlined translate='(0,0)' style={{ color: filtered ? '#1890ff' : undefined }} />,
            onFilter: (value: string | number | boolean, record: RowRecordType): boolean =>
                record[dataIndex]
                    ? record[dataIndex].join('').toLowerCase().includes(value.toString().replace(/\s|,/g, '').toLowerCase())
                    &&
                    this.state.searchedPatternLengths.includes(record[dataIndex].length)
                    : false,
            onFilterDropdownVisibleChange: (visible: boolean) => {
                if (visible) {
                    setTimeout(() => this.searchInput!.select(), 100);
                }
            },
        });


        let data = frequentPatterns.map((pattern, patternIdx) => {
            let [supportIdxs, subseq] = pattern

            let rowData: RowRecordType = {
                key: `${patternIdx + 1}`,
                pattern: subseq,
            }

            patientGroups.forEach((patientGroup, groupIdx) => {
                let groupSupportIdxs = supportIdxs.filter(p => patientGroup.includes(p))
                let percentage = groupSupportIdxs.length === 0 ? '0%' : Math.floor(groupSupportIdxs.length / patientGroup.length * 100).toString() + '%'
                rowData[`group_${groupIdx}`] = percentage
            })

            return rowData
        })

        let columns: ColumnsType<RowRecordType> = patientGroups.map((_, groupIdx) => {
            return {
                title: `group_${groupIdx}`,
                dataIndex: `group_${groupIdx}`,
                key: `group_${groupIdx}`,
                sorter: (a, b) => parseInt(a[`group_${groupIdx}`].replace('%', '')) - parseInt(b[`group_${groupIdx}`].replace('%', '')),
                align: 'center',
                // width: groupIdx>0?this.groupLabelOffsetX[groupIdx] - this.groupLabelOffsetX[groupIdx-1] : this.groupLabelOffsetX[groupIdx]
            }
        })

        columns.unshift({
            title: '',
            dataIndex: 'pattern',
            key: 'pattern',
            render: (states: string[]) => {
                return states.map((state, stateIdx) => {
                    return <div key={`${states}+${stateIdx}+${state}`} style={{ width: rectW, margin: 1, backgroundColor: getColorByName(state), fontSize: rectW, color: "white" }} >{state}</div>
                })
            },
            ...getColumnSearchProps('pattern'),
            align: 'center',
            width: this.props.annotationWidth + this.props.paddingW
        })
        return <Table columns={columns} dataSource={data} pagination={false} scroll={{ y: this.props.height }} />
    }
    render(){
        return this.frequentPatternTable()
    }
}

export default PatternTable