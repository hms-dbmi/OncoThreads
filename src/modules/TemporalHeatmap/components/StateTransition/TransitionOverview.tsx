import * as React from "react"
import * as d3 from "d3"
import { observer, inject } from 'mobx-react';
import { IRootStore } from "modules/Type";
import { getColorByName, getTextWidth } from 'modules/TemporalHeatmap/UtilityClasses/'
import { Table, Input, Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { ColumnsType } from 'antd/lib/table'
import { TPattern } from "modules/TemporalHeatmap/UtilityClasses/prefixSpan";

import GridLayout from 'react-grid-layout';

interface Props {
    rootStore?: IRootStore,
    width: number,
    height: number
}

type TypeLayoutDict = {
    width?: number,
    [timeID: number]: TypeTimeLayout

}[]

type TypeTimeLayout = { shiftX: number }
    &
    {
        [key in Exclude<string, "shiftX">]: {
            width: number,
            x: number,
        }
    }

type RowRecordType = { key: string, pattern: TPattern, [key: string]: any }


@inject('rootStore')
@observer
class TransitionOverview extends React.Component<Props> {
    timeStepHeight = 65;
    rectHeight = 20;
    padding = 20;
    partitionGap = 15;
    linkMaxWidth = 20;
    paddingW = 5; paddingH = 10; annotationWidth = 40;
    groupLabelHeight = 40;
    groupLabelOffsetX: number[] = [];
    searchInput: Input | null = null;

    stateOverview() {
        let timepoints: Array<JSX.Element> = [], transitions: Array<JSX.Element> = [], annotations: Array<JSX.Element> = [];
        let { dataStore, uiStore, visStore } = this.props.rootStore!



        let samplePoints = dataStore.timepoints
            .filter(d => d.type === "sample")
        let layoutDict: TypeLayoutDict = [...Array(dataStore.patientGroupNum)]
            .map(_ => { return {} })

        let partitionGap = 0
        dataStore.patientGroups.forEach(patientGroup => {
            let groupMaxGap = Math.max(...samplePoints.map(TP => {
                let gap = 0
                TP.customGrouped.forEach(d => {
                    let patients = d.patients.filter(p => patientGroup.includes(p))
                    if (patients.length > 0) {
                        gap += this.partitionGap
                    }
                })
                return gap
            }))

            partitionGap += groupMaxGap + this.partitionGap
        })

        let rectWidthScale = d3.scaleLinear()
            .domain([0, dataStore.numberOfPatients])
            .range([0, this.props.width - partitionGap - 2 * this.paddingW - this.annotationWidth]);

        let groupOffset = 0

        // draw timepoints
        dataStore.patientGroups.forEach((patientGroup: string[], groupIdx: number) => {

            //calculate groupwidth 
            let groupTimeWidths: number[] = []
            samplePoints.forEach((TP, timeIdx) => {
                let groupTimeWidth = 0
                TP.customGrouped.forEach(d => {
                    let patients = d.patients.filter(p => patientGroup.includes(p))
                    if (patients.length > 0) {
                        groupTimeWidth += rectWidthScale(patients.length) + this.partitionGap
                    }
                })
                groupTimeWidth -= this.partitionGap

                groupTimeWidths.push(groupTimeWidth)

            })
            let groupWidth = Math.max(...groupTimeWidths)

            layoutDict[groupIdx]['width'] = groupWidth
            groupTimeWidths.forEach((groupTimeWidth, timeIdx) => {
                layoutDict[groupIdx][timeIdx] = {
                    shiftX: (groupWidth - groupTimeWidth) / 2
                } as TypeTimeLayout
            })

            samplePoints.forEach((TP, timeIdx) => {



                let offsetX = 0
                let timepoint: Array<JSX.Element> = []

                // if (timeIdx >= 1) {
                //     offsetX = Math.max(offsetX, Math.min(...Object.values(layoutDict[timeIdx - 1][groupIdx]).map(d => d.x)))
                // }

                TP.customGrouped.forEach(d => {
                    let stateKey = d.partition || ''

                    let patients = d.patients.filter(p => patientGroup.includes(p))
                    if (patients.length == 0) return
                    let rectWidth = Math.max(rectWidthScale(patients.length), 5)
                    timepoint.push(<rect fill={getColorByName(stateKey)} width={rectWidth} height={this.rectHeight} x={offsetX + this.paddingW + this.annotationWidth} key={`time${timeIdx}_group${groupIdx}_state${stateKey}`} />)

                    layoutDict[groupIdx][timeIdx][stateKey] = {
                        width: rectWidth,
                        x: offsetX + this.paddingW + this.annotationWidth + groupOffset + layoutDict[groupIdx][timeIdx]['shiftX']
                    }

                    offsetX += rectWidth + this.partitionGap;
                })




                const transformTP = `translate(
                    ${groupOffset + layoutDict[groupIdx][timeIdx]['shiftX']},
                    ${this.paddingH + this.groupLabelHeight + timeIdx * this.timeStepHeight}
                    )`;

                timepoints.push(
                    <g key={`group${groupIdx}_time${timeIdx}`} transform={transformTP}>
                        {timepoint}
                    </g>,
                )
            })



            groupOffset += groupWidth + 2 * this.partitionGap;

        });


        // draw transitions
        let linkGene = d3.linkVertical().x(d => d[0]).y(d => d[1])
        let linkWidthScale = d3.scaleLinear().domain([0, dataStore.numberOfPatients]).range([2, this.linkMaxWidth])

        samplePoints.forEach((d, i) => {
            if (i !== samplePoints.length - 1) {
                let firstTP = d,
                    secondTP = samplePoints[i + 1];
                let firstGrouped = firstTP.customGrouped,
                    secondGrouped = secondTP.customGrouped
                firstGrouped.forEach((group1) => {
                    secondGrouped.forEach((group2) => {
                        dataStore.patientGroups.forEach((patientGroup: string[], groupIdx: number) => {
                            let { patients: patients1, partition: partition1 } = group1, { patients: patients2, partition: partition2 } = group2
                            let transPatients = patients1.filter(d => patients2.includes(d)).filter(p => patientGroup.includes(p))
                            if (transPatients.length > 0) {

                                let layoutDict1 = layoutDict[groupIdx][i][partition1], layoutDict2 = layoutDict[groupIdx][i + 1][partition2]
                                let sourceX = layoutDict1.x + layoutDict1.width / 2,
                                    sourceY = this.paddingH + this.groupLabelHeight + i * this.timeStepHeight + this.rectHeight,
                                    targetX = layoutDict2.x + layoutDict2.width / 2,
                                    targetY = this.paddingH + this.groupLabelHeight + (i + 1) * this.timeStepHeight
                                transitions.push(<path key={`time_${i}to${i + 1}_trans_${partition1}_${partition2}_group${groupIdx}`}
                                    d={linkGene({
                                        source: [sourceX, sourceY], target: [targetX, targetY]
                                    })!}
                                    fill="none"
                                    stroke="lightgray"
                                    strokeWidth={linkWidthScale(transPatients.length)}
                                />)
                            }
                        })

                    })
                })
            }
        })

        // draw timepoint icon
        const iconR = 10

        annotations.push(
            <line key="timeline"
                x1={this.paddingW + iconR} x2={this.paddingW + iconR}
                y1={this.paddingH + this.groupLabelHeight} y2={this.paddingH + this.groupLabelHeight + this.timeStepHeight * (samplePoints.length - 1)}
                stroke="gray"
            />)

        samplePoints.forEach((d, i) => {

            const transformTP = `translate(
                    ${this.paddingW},
                    ${this.paddingH + this.groupLabelHeight + i * this.timeStepHeight}
                    )`;

            annotations.push(
                <g key={d.globalIndex} transform={transformTP}>
                    <circle cx={iconR} cy={iconR} r={iconR} fill="white" stroke="gray" />
                    <text x={iconR} y={iconR * 1.4} textAnchor="middle">{i}</text>
                </g>,
            )
        });

        let groupLabelOffsetX: number[] = []

        let groupLables = dataStore.patientGroups.map((group, groupIdx) => {
            let offsetX = Object.values(layoutDict[groupIdx][0])[1].x
            let transform = `translate(${offsetX}, ${this.paddingH})`
            let isSelected = uiStore.selectedPatientGroupIdx.includes(groupIdx)
            let groupLabel = getTextWidth(`group${groupIdx}`, 14) > this.partitionGap + layoutDict[groupIdx]['width']! ?
                `..${groupIdx}` : `group${groupIdx}`

            groupLabelOffsetX.push(offsetX + layoutDict[groupIdx]['width']! / 2)

            return <g key={`group_${groupIdx}`} transform={transform} style={{ fontWeight: isSelected ? 'bold' : 'normal', fill: isSelected ? '#1890ff' : 'black' }} >
                <text
                    x={layoutDict[groupIdx]['width']! / 2}
                    textAnchor="middle"
                    y={this.groupLabelHeight / 2}
                    cursor="pointer" onClick={() => uiStore.selectPatientGroup(groupIdx)} xlinkTitle={`group_${groupIdx}`}>
                    {groupLabel}
                </text>
                {/* <rect width={getTextWidth(`group_${groupIdx}`, 14)} height={this.groupLabelHeight/2 + this.paddingH} fill='none' stroke='gray'/> */}
            </g>
        })

        this.groupLabelOffsetX = groupLabelOffsetX

        return [
            <g key="groupLabels" className="groupLabels">{groupLables}</g>,
            <g key="timeAnnotation" className="timeAnnotation">{annotations}</g>,
            <g key="transitions" className="transitions">{transitions}</g>,
            <g key="timepoints" className="timepoints">{timepoints}</g>,
        ];
    }



    frequentPatternTable() {
        let { dataStore } = this.props.rootStore!

        let { ngramResults, frequentPatterns, patientGroups } = dataStore
        if (dataStore.encodingMetric === "ngram") {
            frequentPatterns = ngramResults
        }
        let rectW = 10

        const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: string) => {
            confirm();
            this.setState({
                searchText: selectedKeys[0],
                searchedColumn: dataIndex,
            });
        };

        const handleReset = (clearFilters: () => void) => {
            clearFilters()
            this.setState({ searchText: '' });
        };

        const getColumnSearchProps = (dataIndex: string) => ({
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: { setSelectedKeys: any, selectedKeys: string[], confirm: () => void, clearFilters: () => void }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        ref={node => {
                            this.searchInput = node;
                        }}
                        placeholder={`Search ${dataIndex}`}
                        value={selectedKeys[0]}
                        onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                            icon={<SearchOutlined translate />}
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
            filterIcon: (filtered: boolean) => <SearchOutlined translate style={{ color: filtered ? '#1890ff' : undefined }} />,
            onFilter: (value: string | number | boolean, record: RowRecordType): boolean =>
                record[dataIndex]
                    ? record[dataIndex].toString().toLowerCase().includes(value.toString().toLowerCase())
                    : false,
            onFilterDropdownVisibleChange: (visible: boolean) => {
                if (visible) {
                    setTimeout(() => this.searchInput!.select(), 100);
                }
            },
            // render: text =>(
            //     <Highlighter
            //       highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
            //       searchWords={[this.state.searchText]}
            //       autoEscape
            //       textToHighlight={text ? text.toString() : ''}
            //     />
            //   ) 
        });


        let data = frequentPatterns.map((pattern, patternIdx) => {
            let [supportIdxs, subseq] = pattern

            let rowData: RowRecordType = {
                key: `${patternIdx + 1}`,
                pattern: subseq,
            }

            patientGroups.forEach((patientGroup, groupIdx) => {
                let groupSupportIdxs = supportIdxs.filter(p => patientGroup.includes(p))
                let percentage = groupSupportIdxs.length == 0 ? 0 : (groupSupportIdxs.length / patientGroup.length).toFixed(2)
                rowData[`group_${groupIdx}`] = percentage
            })

            return rowData
        })

        let columns: ColumnsType<RowRecordType> = patientGroups.map((_, groupIdx) => {
            return {
                title: `group_${groupIdx}`,
                dataIndex: `group_${groupIdx}`,
                key: `group_${groupIdx}`,
                sorter: (a, b) => a[`group_${groupIdx}`] - b[`group_${groupIdx}`],
                align: 'center',
                // width: groupIdx>0?this.groupLabelOffsetX[groupIdx] - this.groupLabelOffsetX[groupIdx-1] : this.groupLabelOffsetX[groupIdx]
            }
        })

        columns.unshift({
            title: '',
            dataIndex: 'pattern',
            key: 'pattern',
            render: (states: string[]) => {
                return states.map(state => {
                    return <div key={state} style={{ width: rectW, height: rectW, margin: 2, backgroundColor: getColorByName(state) }} />
                })
            },
            ...getColumnSearchProps('pattern'),
            align: 'center',
            width: this.annotationWidth + this.paddingW
        })


        return <Table columns={columns} dataSource={data} pagination={false} scroll={{ y: this.props.height * 0.3 }} />
    }

    render() {
        let overviewHeight = this.paddingH + this.groupLabelHeight + this.props.rootStore!.dataStore.timepoints.filter(d => d.type === "sample").length * this.timeStepHeight + this.rectHeight
        const layout = [
            { i: 'overview', x: 0, y: 0, w: 12, h: 3, minW:12, maxW:12 },
            { i: 'table', x: 0, y: 3, w: 12, h: 2, minW:12, maxW:12 },
        ];

        return <GridLayout className="stateTransition overview" rowHeight={this.props.height/5} layout={layout} width={this.props.width}>
            <div style={{ height: this.props.height * 0.7, overflowY: "auto", width:this.props.width }} key='overview'>
                <svg
                    width="100%"
                    className="stateTransition overview"
                    // height="100%"
                    // width={this.props.rootStore.visStore.svgWidth}
                    height={overviewHeight}
                >
                    <g className="transitionOverview" key="transitionOverview">
                        {this.stateOverview()}
                    </g>
                </svg>
            </div>
            <div key='table'>
            {this.frequentPatternTable()}
            </div> 
        </GridLayout>

        // return <div className="stateTransition overview" style={{ height: this.props.height, overflowY: "auto" }}>
        //     <div style={{ height: this.props.height*0.7, overflowY: "auto" }}>
        //         <svg
        //             width="100%"
        //             className="stateTransition overview"
        //             // height="100%"
        //             // width={this.props.rootStore.visStore.svgWidth}
        //             height={overviewHeight}
        //         >
        //             <g className="transitionOverview" key="transitionOverview">
        //                 {this.stateOverview()}
        //             </g>
        //         </svg>
        //     </div>
        //     {this.frequentPatternTable()}
        // </div>
    }
}

export default TransitionOverview