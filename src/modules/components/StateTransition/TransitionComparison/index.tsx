import React from "react"
import { observer, inject, Provider } from 'mobx-react';
import { IRootStore } from "modules/Type";
import GroupPartition from '../../Timepoints/GroupTimepointCustom/GroupPartition';
import SankeyTransition from '../../Transitions/SankeyTransition/SankeyTransition';
import Variable from "modules/stores/Variable";
import { getTextWidth } from "modules/UtilityClasses";
import { Resizable} from 're-resizable';
import { observable } from "mobx";


interface Props {
    rootStore?: IRootStore,
    height:number,
    width: number,
    hasBackground:boolean,
    tooltipFunctions: {
        showTooltip: (event: any, line1: string, line2: string) => void,
        hideTooltip: () => void
    }
}

@inject('rootStore')
@observer
class TransitionComparison extends React.Component<Props> {
    @observable annotationWidth = 250
    paddingH: number = 6
    paddingW: number = 10
    groupLabelHeight: number = 40
    constructor(props:Props){
        super(props)
        this.updateAnnotationWidth = this.updateAnnotationWidth.bind(this)
    }
    get plotWidth(){
        return this.props.width - this.annotationWidth
    }
    updateAnnotationWidth(width:number){
        this.annotationWidth = width
        this.updateDimension()
    }

    updateDimension() {
        let { visStore } = this.props.rootStore!
        visStore.setPlotWidth(this.plotWidth)
    }

    componentDidMount() {
        const annotationWidth = Math.max(...this.props.rootStore!.dataStore.currentVariables.map(d=>getTextWidth(d, 14)))
        this.updateAnnotationWidth(annotationWidth)
        this.updateDimension()
    }
    componentDidUpdate(){
        this.updateDimension()
    }

    getGroupedPartition(group: any, patientGroup: string[]) {
        // filter the partition at each timepoint with the user selected groups
        let { dataStore } = this.props.rootStore!

        let filteredPatients = group.patients.filter((p: string) => patientGroup.includes(p))
        group.patients.filter((p: string) => patientGroup.includes(p))

        if (group.points) return {
            ...group,
            patients: filteredPatients,
            points: group.points.filter((id: number) => patientGroup.includes(dataStore.points[id].patient)),
            rows: group.rows
            .map((row: any) => {
                return {
                    ...row,
                    counts: row.counts.map((count: any) => {
                        return { key: count.key, patients: count.patients.filter((p: string) => filteredPatients.includes(p)) }
                    }).filter((count: any) => count.patients.length > 0)
                }
            })
        }
        else return {
            ...group,
            patients: filteredPatients,
            rows: group.rows
            .map((row: any) => {
                return {
                    ...row,
                    counts: row.counts.map((count: any) => {
                        return { key: count.key, patients: count.patients.filter((p: string) => filteredPatients.includes(p)) }
                    }).filter((count: any) => count.patients.length > 0)
                }
            })
        }
    }


    getTransitionComparison() {

        let timepoints: Array<JSX.Element> = [], transitions: Array<JSX.Element> = [], groupLabels: Array<JSX.Element> = [], groups: Array<JSX.Element> = []
        let { dataStore, uiStore, visStore } = this.props.rootStore!

        let { selectedPatientGroupIdx } = uiStore

        selectedPatientGroupIdx = selectedPatientGroupIdx.sort()

        let groupOffsetX = 0

        selectedPatientGroupIdx.forEach((groupIdx: number) => {
            let groupWidth = 0
            let patientGroup = dataStore.patientGroups[groupIdx]

            dataStore.timepoints.forEach((d, timeIdx) => {

                const transformTP = `translate(
                    ${visStore.strokeW},
                    ${visStore.newTimepointPositions.timepoint[timeIdx] + visStore.strokeW + this.groupLabelHeight}
                    )`;

                let offsetX = 0;
                let timepoint: Array<JSX.Element> = []



                // draw transitions
                if (timeIdx !== dataStore.timepoints.length - 1) {
                    const transformTR = `translate(${visStore.strokeW + offsetX},${visStore.newTimepointPositions.connection[timeIdx] + visStore.strokeW + this.groupLabelHeight})`


                    const firstTP = d
                    const firstGrouped = firstTP.customGrouped.map(g => this.getGroupedPartition(g, patientGroup)).filter(g => g.patients.length > 0);
                    const secondTP = dataStore.timepoints[timeIdx + 1];
                    const secondGrouped = secondTP.customGrouped.map(g => this.getGroupedPartition(g, patientGroup)).filter(g => g.patients.length > 0);
                    if (firstTP.customPartitions.length > 0) {
                        if (secondTP.customPartitions.length > 0) {
                            transitions.push(
                                <g className={`time${timeIdx}_group${groupIdx+1} transitions`} key={`time${timeIdx}_group${groupIdx+1}`} transform={transformTR}>
                                    <Provider
                                        dataStore={dataStore}
                                        visStore={visStore}
                                    >
                                        <SankeyTransition
                                            index={timeIdx}
                                            firstGrouped={firstGrouped}
                                            secondGrouped={secondGrouped}
                                            firstPrimary={dataStore
                                                .variableStores[firstTP.type]
                                                .getById(firstTP.primaryVariableId)}
                                            secondPrimary={dataStore
                                                .variableStores[secondTP.type]
                                                .getById(secondTP.primaryVariableId)}
                                            tooltipFunctions={this.props.tooltipFunctions}
                                        />
                                    </Provider>
                                </g>
                            );
                        }
                    }
                }


                // draw time points
                d.customGrouped.forEach((group, partitionIdx) => {

                    let transform = `translate(${offsetX}, ${0})`
                    let heatmap = d.heatmap.map(v => {
                        return { ...v, data: v.data.filter(p => patientGroup.includes(p.patient)) }
                    })

                    let partition = this.getGroupedPartition(group, patientGroup)

                    if (partition.patients.length === 0) return
                   
                    timepoint.push(<g
                        key={`group${groupIdx+1}_state${group.partition}`}
                        className={`group${groupIdx+1}_state${group.partition} timepoint`}
                        style={{ backgroundColor: 'darkgray' }}
                        transform={transform}
                    >
                        <Provider
                            dataStore={dataStore}
                            visStore={visStore}
                        >
                            <GroupPartition
                                type={d.type}
                                heatmap={heatmap}
                                currentVariables={dataStore
                                    .variableStores[d.type].fullCurrentVariables}
                                partition={partition}
                                partitionIndex={partitionIdx}
                                stroke='none'
                                stateLabels={dataStore.stateLabels}
                                hasBackground={this.props.hasBackground}
                                tooltipFunctions={this.props.tooltipFunctions}
                            />
                        </Provider>
                    </g>)



                    offsetX += visStore.groupScale(partition.patients.length) + visStore.partitionGap;
                })

                groupWidth = Math.max(groupWidth, offsetX )

                timepoints.push(
                    <g key={d.globalIndex} transform={transformTP} className={`time_${timeIdx}`}>
                        {timepoint}
                    </g>,
                )
            })

            groups.push(<g className={`group_${groupIdx}`} key={`group_${groupIdx}`} transform={`translate(${groupOffsetX + this.annotationWidth}, ${0})`}>
                <text y={this.groupLabelHeight-12} fontWeight="bold" fill="#1890ff">group{groupIdx+1} </text>
                {transitions}
                {timepoints}
            </g>)
            timepoints = []
            transitions = []

            groupOffsetX += groupWidth + visStore.partitionGap

        });

        const annotations = this.getAnnotations()


        if (groups.length>0){
            return [
                annotations,
                ...groups
            ];
        }else{
            return [
                annotations,
                <text transform={`translate( ${this.props.width/2}, ${this.props.height/2})`} textAnchor="middle" style={{fontSize:'20px', fill:'gray'}}>
                    please select patient groups in the overview panel
                </text>
            ];
        }
        
    }
    getAnnotations(){
        // draw timepoint icon
        const iconR = 10
        let {dataStore, visStore} = this.props.rootStore!
        let annotations: Array<JSX.Element> = []
        const svgHeight = this.props.rootStore!.visStore.svgHeight
        const annotationMaxWidth = Math.max(...dataStore.currentVariables.map(d=>getTextWidth(d, 14)))

        annotations.push(
            <line key="timeline"
                x1={this.paddingW + iconR} x2={this.paddingW + iconR}
                y1={this.paddingH + this.groupLabelHeight} y2={this.paddingH + this.groupLabelHeight + visStore.newTimepointPositions.connection[dataStore.timepoints.length - 1]}
                stroke="gray"
            />)

        dataStore.timepoints.forEach((d, i) => {
            if (d.type === 'between') return

            const transformTP = `translate(
                    ${this.paddingW },
                    ${ this.paddingH + this.groupLabelHeight + visStore.newTimepointPositions.connection[i] 
                        - visStore.secondaryHeight * dataStore.variableStores['sample'].currentNonPatientVariables.length
                    } 
                    )`;

            annotations.push(
                <g key={d.globalIndex} transform={transformTP}>
                    <circle cx={iconR} cy={iconR} r={iconR} fill="white" stroke="gray" />
                    <text x={iconR} y={iconR * 1.4} textAnchor="middle">{annotations.length }</text>
                </g>,
            )
        });

        const featureNames = dataStore.variableStores.sample.fullCurrentVariables.map((v:Variable, i:number)=>{
            return <g key={v.id} transform={`translate(0, ${visStore.secondaryHeight*i+ visStore.secondaryHeight/2 + 7})`}>
                <text >{v.name}</text>
                <text x= {annotationMaxWidth - 14} onClick={()=>dataStore.removeVariable(v.id)} cursor="default">X</text>
                </g>
        })

        const eventNames = dataStore.variableStores.between.fullCurrentVariables.map((v:Variable, i:number)=>{
            return <g key={v.id} transform={`translate(0, ${visStore.secondaryHeight*i+ visStore.secondaryHeight/2 + 7})`}>
                <text y={visStore.secondaryHeight*i+ visStore.secondaryHeight/2 + 7} >{v.name}</text>
                <text x= {annotationMaxWidth - 14} onClick={()=>dataStore.removeVariable(v.id)} cursor="default">X</text>
            </g>
        })
        
        
        const featureNameRows = dataStore.timepoints.map((tp,timeIdx)=>{
            
            const transform = `translate(
                ${visStore.strokeW},
                ${visStore.newTimepointPositions.timepoint[timeIdx] + this.paddingH + this.groupLabelHeight}
                )`;
            return <g key={timeIdx} transform={transform}>{tp.type=='sample'? featureNames: eventNames}</g>

        })
        
        return <>
            <g key="timeAnnotation" className="timeAnnotation">{annotations}</g>
            <foreignObject className="featureNameRows" key="featureNameRows"  width={this.annotationWidth - this.paddingW - 2*iconR} height={svgHeight} x={this.paddingW+2*iconR} y={0} overflow="hidden" >
                <Resizable 
                size={{width: this.annotationWidth - 2* this.paddingW - 2*iconR, height: svgHeight}}
                style={{ overflowX: "scroll", overflowY:"hidden", borderRight: "1px solid lightgray", zIndex:  100}}
                onResizeStop={(e, dir, ref, d)=>this.updateAnnotationWidth(this.annotationWidth+d.width)}
                    >
                    <svg width={annotationMaxWidth} height={svgHeight}>
                        {featureNameRows}
                    </svg>
                </Resizable>
            </foreignObject>
        </>
    }
    render() {
        return <svg
            width="100%"
            className="stateTransition details"
            // height="100%"
            // width={this.props.rootStore.visStore.svgWidth}
            height={this.props.rootStore!.visStore.svgHeight}
        
        > <g className="transitionComparison">
                {this.getTransitionComparison()}
            </g>
        </svg>
    }
}

export default TransitionComparison