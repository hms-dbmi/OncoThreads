import * as React from "react"
import * as d3 from "d3"
import { observer, inject } from 'mobx-react';
import { IRootStore } from "modules/Type";
import { cropText, getColorByName, getTextWidth } from 'modules/UtilityClasses'
import { Input, Checkbox, Tabs, Tooltip } from 'antd';
import GridLayout from 'react-grid-layout';
import PatternTable from './PatternTable'
import PatientTable from './PatientTable'

import { InfoCircleOutlined } from '@ant-design/icons';

import './index.css'

const { TabPane } = Tabs;
interface Props {
    rootStore?: IRootStore,
    width: number,
    height: number
}

interface State {
    searchedPatternLengths: number[]
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


@inject('rootStore')
@observer
class TransitionOverview extends React.Component<Props, State> {
    timeStepHeight = 65;
    rectHeight = 20;
    padding = 20;
    partitionGap = 15;
    linkMaxWidth = 20;
    paddingW = 5; paddingH = 10; annotationWidth = 40;
    groupLabelHeight = 40;
    groupLabelOffsetX: number[] = [];
    rectWidthScale: d3.ScaleLinear<number, number> = d3.scaleLinear()
    searchInput: Input | null = null;

    fontSize = 14;

    constructor(props: Props) {
        super(props)
        this.state = {
            searchedPatternLengths: [2, 3]
        }
    }

    stateOverview() {
        let timepoints: Array<JSX.Element> = [], transitions: Array<JSX.Element> = [], annotations: Array<JSX.Element> = [];
        let { dataStore, uiStore } = this.props.rootStore!



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

                TP.customGrouped.forEach(d => {
                    let stateKey = d.partition || ''

                    let patients = d.patients.filter(p => patientGroup.includes(p))
                    if (patients.length === 0) return
                    const rectWidth = Math.max(rectWidthScale(patients.length), 5)
                    const stateName = cropText(dataStore.stateLabels[stateKey]||stateKey, this.fontSize, 700, rectWidth)
                    timepoint.push(<g transform={`translate(${offsetX + this.paddingW + this.annotationWidth}, 0)`}  key={`time${timeIdx}_group${groupIdx}_state${stateKey}`}>
                        <rect fill={getColorByName(stateKey)} width={rectWidth} height={this.rectHeight}  />
                        <text fill="white" x={rectWidth/2} y={(this.rectHeight+this.fontSize)/2} textAnchor="middle">
                            {stateName}
                        </text>
                    </g>)

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

        samplePoints.forEach((d, timeIdx) => {
            if (timeIdx !== samplePoints.length - 1) {
                let firstTP = d,
                    secondTP = samplePoints[timeIdx + 1];
                let firstGrouped = firstTP.customGrouped,
                    secondGrouped = secondTP.customGrouped
                firstGrouped.forEach((group1) => {
                    secondGrouped.forEach((group2) => {
                        dataStore.patientGroups.forEach((patientGroup: string[], groupIdx: number) => {
                            let { patients: patients1, partition: partition1 } = group1, { patients: patients2, partition: partition2 } = group2
                            let transPatients = patients1.filter(d => patients2.includes(d)).filter(p => patientGroup.includes(p))
                            if (transPatients.length > 0) {

                                let layoutDict1 = layoutDict[groupIdx][timeIdx][partition1], layoutDict2 = layoutDict[groupIdx][timeIdx + 1][partition2]
                                let sourceX = layoutDict1.x + layoutDict1.width / 2,
                                    sourceY = this.paddingH + this.groupLabelHeight + timeIdx * this.timeStepHeight + this.rectHeight,
                                    targetX = layoutDict2.x + layoutDict2.width / 2,
                                    targetY = this.paddingH + this.groupLabelHeight + (timeIdx + 1) * this.timeStepHeight
                                transitions.push(<path key={`time_${timeIdx}to${timeIdx + 1}_trans_${partition1}_${partition2}_group${groupIdx}`}
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
                    <text x={iconR} y={iconR * 1.4} textAnchor="middle">{i + 1}</text>
                </g>,
            )
        });

        let groupLabelOffsetX: number[] = []

        let groupLables = dataStore.patientGroups.map((group, groupIdx) => {
            let offsetX = 0
            // states at the first timepoint inside this group
            const states = Object.keys(layoutDict[groupIdx][0]).filter(d=>d!=='shiftX')
            if (states.length>0){
                offsetX = layoutDict[groupIdx][0][states[0]].x
            }

            const transform = `translate(${offsetX}, ${this.paddingH})`
            const isSelected = uiStore.selectedPatientGroupIdx.includes(groupIdx)
            let labelWidth = getTextWidth(`group${groupIdx}`, this.fontSize)
            let groupLabel = `group${groupIdx + 1}`
            if (labelWidth > this.partitionGap + layoutDict[groupIdx]['width']!) {
                groupLabel = `..${groupIdx+1}`
                labelWidth = getTextWidth(groupLabel, this.fontSize)
            }

            groupLabelOffsetX.push(offsetX + layoutDict[groupIdx]['width']! / 2)

            return <g key={`group_${groupIdx}`} transform={transform} style={{ fontWeight: isSelected ? 'bold' : 'normal', fill: isSelected ? '#1890ff' : 'black' }} onClick={() => uiStore.selectPatientGroup(groupIdx)}>
                <foreignObject width={this.groupLabelHeight} height={this.groupLabelHeight} x={layoutDict[groupIdx]['width']! / 2 - labelWidth / 2 - this.fontSize - 5} y={this.fontSize}>
                    <Checkbox checked={isSelected} />
                </foreignObject>
                <text
                    x={layoutDict[groupIdx]['width']! / 2}
                    y={(this.groupLabelHeight + this.fontSize) / 2}
                    textAnchor="middle"
                    cursor="pointer" xlinkTitle={`group_${groupIdx}`}>
                    {groupLabel}
                </text>
            </g>
        })

        this.groupLabelOffsetX = groupLabelOffsetX
        this.rectWidthScale = rectWidthScale

        return [
            <g key="groupLabels" className="groupLabels">{groupLables}</g>,
            <g key="timeAnnotation" className="timeAnnotation">{annotations}</g>,
            <g key="transitions" className="transitions">{transitions}</g>,
            <g key="timepoints" className="timepoints">{timepoints}</g>,
        ];
    }



    render() {
        let overviewHeight = this.paddingH + this.groupLabelHeight + this.props.rootStore!.dataStore.timepoints.filter(d => d.type === "sample").length * this.timeStepHeight + this.rectHeight
        const layout = [
            { i: 'overview', x: 0, y: 0, w: 12, h: 3, minW: 12, maxW: 12 },
            { i: 'table', x: 0, y: 3, w: 12, h: 2, minW: 12, maxW: 12 },
        ];
        

        const dataIntro2 = `<h4>Step 2: analyze the state transition among all patients.</h4> 
        The frequent-pattern table summarizes the frequent state transition patterns and the pattern-featuers table summarizes the patient feature at each group.
        You can sort the rows or search frequent patterns by clicking the icons in the table header.`

        const patternHeader = <span>Frequent Patterns {' '}
            <Tooltip title="frequent state transition patterns and their distribution of each patient group" destroyTooltipOnHide>
                <InfoCircleOutlined translate='' />
            </Tooltip>
        </span>

        const patientHeader = <span>Patient Features {' '}
            <Tooltip title="summarize patient attributes of each patient group" destroyTooltipOnHide>
                <InfoCircleOutlined translate='' />
            </Tooltip>
        </span>

        return <GridLayout className="stateTransition overview" rowHeight={this.props.height / 5} layout={layout} width={this.props.width}>
            <div style={{ height: this.props.height * 0.7, overflowY: "auto", width: this.props.width }} key='overview'
                // data-intro={dataIntro1}
                // data-step="4"
            >
                <svg
                    width="100%"
                    className="stateTransition overview"
                    height={overviewHeight}
                >
                    <g className="transitionOverview" key="transitionOverview">
                        {this.stateOverview()}
                    </g>
                </svg>
            </div>
            <div key='table'
                data-intro={dataIntro2}
                data-step='5'>
                <Tabs defaultActiveKey="pattern">
                    <TabPane
                        tab={ patternHeader }
                        key="pattern"
                    >
                        <PatternTable annotationWidth={this.annotationWidth} paddingW={this.paddingW} height={this.props.height * 0.3} />
                    </TabPane>
                    <TabPane
                        tab={ patientHeader }
                        key="patient"
                    >
                        <PatientTable annotationWidth={this.annotationWidth} paddingW={this.paddingW} height={this.props.height * 0.3} groupOffsetX={this.groupLabelOffsetX} xScale={this.rectWidthScale}/>
                    </TabPane>
                </Tabs>,
                
            </div>
        </GridLayout>
    }
}

export default TransitionOverview