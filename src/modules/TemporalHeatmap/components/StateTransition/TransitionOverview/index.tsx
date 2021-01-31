import * as React from "react"
import * as d3 from "d3"
import { observer, inject } from 'mobx-react';
import { IRootStore } from "modules/Type";
import { getColorByName, getTextWidth } from 'modules/TemporalHeatmap/UtilityClasses/'
import { Input, Checkbox} from 'antd';
import GridLayout from 'react-grid-layout';
import PatternTable from './PatternTable'

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

                // if (timeIdx >= 1) {
                //     offsetX = Math.max(offsetX, Math.min(...Object.values(layoutDict[timeIdx - 1][groupIdx]).map(d => d.x)))
                // }

                TP.customGrouped.forEach(d => {
                    let stateKey = d.partition || ''

                    let patients = d.patients.filter(p => patientGroup.includes(p))
                    if (patients.length === 0) return
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
                    <text x={iconR} y={iconR * 1.4} textAnchor="middle">{i + 1}</text>
                </g>,
            )
        });

        let groupLabelOffsetX: number[] = []

        let groupLables = dataStore.patientGroups.map((group, groupIdx) => {
            let offsetX = Object.values(layoutDict[groupIdx][0])[1].x
            let transform = `translate(${offsetX}, ${this.paddingH})`
            let isSelected = uiStore.selectedPatientGroupIdx.includes(groupIdx)
            let labelWidth = getTextWidth(`group${groupIdx}`, this.fontSize)
            let groupLabel = `group${groupIdx}`
            if (labelWidth > this.partitionGap + layoutDict[groupIdx]['width']!) {
                groupLabel = `..${groupIdx}`
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



    render() {
        let overviewHeight = this.paddingH + this.groupLabelHeight + this.props.rootStore!.dataStore.timepoints.filter(d => d.type === "sample").length * this.timeStepHeight + this.rectHeight
        const layout = [
            { i: 'overview', x: 0, y: 0, w: 12, h: 3, minW: 12, maxW: 12 },
            { i: 'table', x: 0, y: 3, w: 12, h: 2, minW: 12, maxW: 12 },
        ];
        let dataIntro1 = '<h4>Step 2: analyze the state transition among all patients.</h4> \
        The y-axis presents the timeline and the colored rectangle indicates patients of the same state.\
        You can group patients based on their state transitions by changing the number in the top left input box.'

        let dataIntro2 = '<h4>Step 2: analyze the state transition among all patients.</h4> \
        This table summarizes the frequent state transition patterns.\
        You can sort the rows or search frequent patterns by clicking the icons in the table header.'

        return <GridLayout className="stateTransition overview" rowHeight={this.props.height / 5} layout={layout} width={this.props.width}>
            <div style={{ height: this.props.height * 0.7, overflowY: "auto", width: this.props.width }} key='overview'
                data-intro={dataIntro1}
                data-step="3"
            >
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
            <div key='table'
                data-intro={dataIntro2}
                data-step='4'>
                <PatternTable annotationWidth={this.annotationWidth} paddingW={this.paddingW} height={this.props.height*0.3}/>
            </div>
        </GridLayout>
    }
}

export default TransitionOverview