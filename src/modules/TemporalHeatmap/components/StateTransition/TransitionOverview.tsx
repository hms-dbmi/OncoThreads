import * as React from "react"
import * as d3 from "d3"
import { observer, inject } from 'mobx-react';
import { IRootStore } from "modules/Type";
import { cropText, getColorByName, getTextWidth } from 'modules/TemporalHeatmap/UtilityClasses/'

interface Props {
    rootStore?: IRootStore,
    width: number,
}

type TypeLayoutDict = {
    width?: number,
    [timeID:number]: TypeTimeLayout
    
}[]

type TypeTimeLayout = {shiftX:number} 
    &
    {
        [key in Exclude<string, "shiftX">]: {
        width: number,
        x: number,
        }
    }


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
    groupLabelOffsetX: number[] = []

    stateOverview() {
        let timepoints: Array<JSX.Element> = [], transitions: Array<JSX.Element> = [], annotations: Array<JSX.Element> = [];
        let { dataStore, uiStore, visStore } = this.props.rootStore!
        

        
        let samplePoints = dataStore.timepoints
            .filter(d => d.type === "sample")
        let layoutDict: TypeLayoutDict = [...Array(dataStore.patientGroupNum)]
            .map(_=>{return {}})

        let partitionGap = 0
        dataStore.patientGroups.forEach(patientGroup=>{
            let groupMaxGap = Math.max(...samplePoints.map(TP=>{
                let gap = 0
                TP.customGrouped.forEach(d=>{
                    let patients = d.patients.filter(p => patientGroup.includes(p))
                    if (patients.length>0){
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
            let groupTimeWidths:number[] = []
            samplePoints.forEach((TP, timeIdx)=>{
                let groupTimeWidth = 0
                TP.customGrouped.forEach(d => {
                    let patients = d.patients.filter(p => patientGroup.includes(p))
                    if (patients.length>0){
                        groupTimeWidth += rectWidthScale(patients.length) + this.partitionGap
                    }
                })
                groupTimeWidth -= this.partitionGap
                
                groupTimeWidths.push(groupTimeWidth)
                
            })
            let groupWidth = Math.max(...groupTimeWidths)

            layoutDict[groupIdx]['width'] = groupWidth
            groupTimeWidths.forEach((groupTimeWidth, timeIdx)=>{
                layoutDict[groupIdx][timeIdx] ={
                    shiftX:(groupWidth-groupTimeWidth)/2
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
                    timepoint.push(<rect fill={getColorByName(stateKey)} width={rectWidth} height={this.rectHeight} x={offsetX +this.paddingW + this.annotationWidth} key={`time${timeIdx}_group${groupIdx}_state${stateKey}`} />)

                    layoutDict[groupIdx][timeIdx][stateKey] = {
                        width: rectWidth,
                        x: offsetX +this.paddingW + this.annotationWidth + groupOffset + layoutDict[groupIdx][timeIdx]['shiftX']
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

            

            groupOffset += groupWidth + 2*this.partitionGap;
            
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

        let groupLabelOffsetX:number[] = []

        let groupLables = dataStore.patientGroups.map((group, groupIdx) => {
            let offsetX = Object.values(layoutDict[groupIdx][0])[1].x
            let transform = `translate(${offsetX}, ${this.paddingH})`
            let isSelected = uiStore.selectedPatientGroupIdx.includes(groupIdx)
            let groupLabel = getTextWidth(`group${groupIdx}`, 14) > this.partitionGap + layoutDict[groupIdx]['width']!?
                `..${groupIdx}`:`group${groupIdx}`

            groupLabelOffsetX.push(offsetX + layoutDict[groupIdx]['width']!/2)

            return <g key={`group_${groupIdx}`} transform={transform} style={{ fontWeight: isSelected ? 'bold' : 'normal', fill: isSelected ? '#1890ff' : 'black' }} >
                <text 
                    x={layoutDict[groupIdx]['width']!/2}
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


    getFrequentPatterns() {
        let { dataStore } = this.props.rootStore!

        let { ngramResults, frequentPatterns, patientGroups } = dataStore
        if (dataStore.encodingMetric === "ngram"){
            frequentPatterns = ngramResults
        }
        let rectH = 10, rectW=10, gap = 10

        let offsetY=0

        let patterns = frequentPatterns.map((pattern, patternIdx)=>{
            let [supportIdxs, subseq] = pattern
            let patternHeight = (rectH+1) * subseq.length
            offsetY += (patternHeight + gap)

            let patternSeq = subseq.map((stateKey, i) => {
                return <rect key={i}
                    fill={getColorByName(stateKey)}
                    width={rectW} height={rectH}
                    x={0}
                    y={i*(rectH+1)}
                />
            })
            let nums =patientGroups.map((patientGroup, groupIdx)=>{
                let groupSupportIdxs = supportIdxs.filter(p => patientGroup.includes(p))
                let percentage = groupSupportIdxs.length==0?0:(groupSupportIdxs.length/patientGroup.length).toFixed(2)
                return <text 
                textAnchor="middle"
                x={this.groupLabelOffsetX[groupIdx] } 
                y={patternHeight/2+5}
                key={groupIdx}>
                    {percentage}
                </text>
            })

            

            return <g transform={`translate(${0}, ${offsetY - (patternHeight + gap)} )`} key={patternIdx}>
                {patternSeq}
                {nums}
            </g>
        })


        return <g className="pattern" transform={`translate(${this.paddingW}, ${this.paddingH + this.groupLabelHeight + this.timeStepHeight * dataStore.maxTime})`}>
            {patterns}
        </g>
    }

    render() {
        let a = this.props.rootStore!.dataStore.patientSequenceEncoding
        return <g className="transitionOverview" key="transitionOverview">
            {this.stateOverview()}
            {this.getFrequentPatterns()}
        </g>
    }
}

export default TransitionOverview