import * as React from "react"
import * as d3 from "d3"
import { observer, inject } from 'mobx-react';
import { IRootStore } from "modules/Type";
import { getColorByName, getTextWidth } from 'modules/TemporalHeatmap/UtilityClasses/'

interface Props {
    rootStore?: IRootStore,
    width: number,
}

type TypeLayoutDict = {
    [key: string]: {
        width: number,
        x: number,
    }
}[][]

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

    stateOverview() {
        let timepoints: Array<JSX.Element> = [], transitions: Array<JSX.Element> = [], annotations: Array<JSX.Element> = [];
        let { dataStore, uiStore } = this.props.rootStore!
        let rectWidthScale = d3.scaleLinear()
            .domain([0, dataStore.numberOfPatients])
            .range([0, this.props.width - (dataStore.maxTPPartitionWithGroup ) * this.partitionGap - 2 * this.paddingW - this.annotationWidth]);

        let layoutDict: TypeLayoutDict = []
        let samplePoints = dataStore.timepoints
            .filter(d => d.type === "sample")

        // draw timepoints
        samplePoints.forEach((d, timeIdx) => {

            const transformTP = `translate(
                    ${0},
                    ${this.paddingH + this.groupLabelHeight + timeIdx * this.timeStepHeight}
                    )`;
            let offsetX = this.paddingW + this.annotationWidth, gap = this.partitionGap;
            let timepoint: Array<JSX.Element> = []
            layoutDict.push([])

            dataStore.patientGroups.forEach((patientGroup:string[], groupIdx:number)=>{
                layoutDict[timeIdx].push({})
                if (timeIdx>=1){
                    offsetX = Math.max(offsetX, Math.min(...Object.values(layoutDict[timeIdx-1][groupIdx]).map(d=>d.x)))
                }

                d.customGrouped.forEach(d => {
                    let stateKey = d.partition || ''
                    
                    let patients = d.patients.filter(p=>patientGroup.includes(p))
                    if (patients.length==0) return
                    let rectWidth = rectWidthScale(patients.length)
                    timepoint.push(<rect fill={getColorByName(stateKey)} width={rectWidth} height={this.rectHeight} x={offsetX} key={`time${timeIdx}_group${groupIdx}_state${stateKey}`} />)
    
                    layoutDict[timeIdx][groupIdx][stateKey] = {
                        width: rectWidth,
                        x: offsetX
                    }
    
                    offsetX += rectWidth + gap
                })
            })

            

            timepoints.push(
                <g key={d.globalIndex} transform={transformTP}>
                    {timepoint}
                </g>,
            )
        });



        // draw transitions
        let linkGene = d3.linkVertical().x(d => d[0]).y(d => d[1])
        let linkWidthScale = d3.scaleLinear().domain([0, dataStore.numberOfPatients]).range([1, this.linkMaxWidth])

        samplePoints.forEach((d, i) => {
            if (i !== samplePoints.length - 1) {
                let firstTP = d,
                    secondTP = samplePoints[i + 1];
                let firstGrouped = firstTP.customGrouped,
                    secondGrouped = secondTP.customGrouped
                firstGrouped.forEach((group1) => {
                    secondGrouped.forEach((group2) => {
                        dataStore.patientGroups.forEach((patientGroup:string[], groupIdx:number)=>{
                        let { patients: patients1, partition: partition1 } = group1, { patients: patients2, partition: partition2 } = group2
                        let transPatients = patients1.filter(d => patients2.includes(d)).filter(p=>patientGroup.includes(p))
                        if (transPatients.length > 0) {

                            let layoutDict1 = layoutDict[i][groupIdx][partition1], layoutDict2 = layoutDict[i + 1][groupIdx][partition2]
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

        let groupLables = dataStore.patientGroups.map((group, groupIdx)=>{
            let offsetX = Object.values(layoutDict[0][groupIdx])[0].x
            let transform = `translate(${offsetX}, ${this.paddingH})`
            let isSelected = uiStore.selectedPatientGroupIdx.includes(groupIdx)
            return <g key={`group_${groupIdx}`} transform={transform} style={{fontWeight: isSelected?'bold':'normal', fill:isSelected?'#1890ff':'black'}} >
                    <text y={this.groupLabelHeight/2} cursor="pointer" onClick={()=>uiStore.selectPatientGroup(groupIdx)}>{`group_${groupIdx}`}</text>
                    {/* <rect width={getTextWidth(`group_${groupIdx}`, 14)} height={this.groupLabelHeight/2 + this.paddingH} fill='none' stroke='gray'/> */}
                </g>
            })


        return [
            <g key="groupLabels" className="groupLabels">{groupLables}</g>,
            <g key="timeAnnotation" className="timeAnnotation">{annotations}</g>, 
            <g key="transitions" className="transitions">{transitions}</g>, 
            <g key="timepoints" className="timepoints">{timepoints}</g>,          
        ];
    }


    getFrequentPatterns() {
        let { dataStore } = this.props.rootStore!
        let { frequentPatterns, patientGroups } = dataStore

        let offsetX = 0, gapX = 17
        let patterns = patientGroups.map((patientGroup, groupIdx)=>{
            offsetX += groupIdx==0?0:gapX
            return frequentPatterns.map((pattern, patternIdx) => {
                let [supportIdxs, subseq] = pattern
                supportIdxs = supportIdxs.filter(p=>patientGroup.includes(p))
                if (supportIdxs.length==0) return <g key={`group_${groupIdx}_pattern_${patternIdx}`} />
                offsetX += patternIdx==0?0:gapX
                return <g key={`group_${groupIdx}_pattern_${patternIdx}`}>
                    <text x = {offsetX }>{supportIdxs.length}</text>
                    {subseq.map((stateKey, i) => {
                        return <rect key={i} 
                            fill={getColorByName(stateKey)} 
                            width={10} height={10} 
                            x={offsetX}
                            y={7+i*12}
                        />
                    })}
                </g>
            })
        })
        

        return <g className="pattern" transform={`translate(${this.paddingW + this.annotationWidth}, ${this.paddingH + this.groupLabelHeight + this.timeStepHeight*dataStore.maxTime})`}>
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