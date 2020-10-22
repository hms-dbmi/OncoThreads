import React from "react"
import { observer, inject, Provider } from 'mobx-react';
import { observable } from 'mobx';
import { IRootStore } from "modules/Type";
import GroupPartition from '../Timepoints/GroupTimepointCustom/GroupPartition';
import SankeyTransition from '../Transitions/SankeyTransition/SankeyTransition';

interface Props {
    rootStore?: IRootStore,
    width: number,
    tooltipFunctions: {
        showTooltip: (event: any, line1: string, line2: string) => void,
        hideTooltip: () => void
    }
}

@inject('rootStore')
@observer
class TransitionComparison extends React.Component<Props> {
    @observable hasBackground: boolean = false
    plotRatio: number = 0.9
    paddingH:number =6
    paddingW:number = 6
    groupLabelHeight:number = 40

    updateDimension() {
        let { visStore } = this.props.rootStore!
        visStore.setPlotWidth(this.props.width * this.plotRatio - 10)

    }

    componentDidMount() {
        this.updateDimension()
    }

    getGroupedPartition(group: any, patientGroup: string[]) {
        // filter the partition at each timepoint with the user selected groups
        let { dataStore } = this.props.rootStore!
        if (group.points) return {
            ...group,
            patients: group.patients.filter((p: string) => patientGroup.includes(p)),
            points: group.points.filter((id: number) => patientGroup.includes(dataStore.points[id].patient)),
            rows: group.rows.map((row: any) => {
                return {
                    ...row,
                    counts: row.counts.map((count: any) => {
                        return { ...count, patients: count.patients.filter((p: string) => patientGroup.includes(p)) }
                    })
                        .filter((count: any) => count.patients.length > 0)
                }
            })
        }
        else return {
            ...group,
            patients: group.patients.filter((p: string) => patientGroup.includes(p)),
            rows: group.rows.map((row: any) => {
                return {
                    ...row,
                    counts: row.counts.map((count: any) => {
                        return { ...count, patients: count.patients.filter((p: string) => patientGroup.includes(p)) }
                    })
                        .filter((count: any) => count.patients.length > 0)
                }
            })
        }
    }


    getTransitionComparison() {

        let timepoints: Array<JSX.Element> = [], transitions: Array<JSX.Element> = [], annotations: Array<JSX.Element> = [], groupLabels: Array<JSX.Element> = []
        let { dataStore, uiStore, visStore } = this.props.rootStore!

        let { selectedPatientGroupIdx } = uiStore

        selectedPatientGroupIdx = selectedPatientGroupIdx.sort()

        dataStore.timepoints.forEach((d, timeIdx) => {

            const transformTP = `translate(
                    ${visStore.strokeW},
                    ${visStore.newTimepointPositions.timepoint[timeIdx] + visStore.strokeW + this.groupLabelHeight}
                    )`;

            let offsetX = 0;
            let timepoint: Array<JSX.Element> = []

            selectedPatientGroupIdx.forEach((groupIdx: number) => {
                if (groupIdx === -1) return
                let patientGroup = dataStore.patientGroups[groupIdx]
                if (patientGroup===undefined) return
                if(timeIdx ===0) groupLabels.push(<text key={`label_group${groupIdx}`} y={this.groupLabelHeight-12} x={offsetX + this.props.width * (1-this.plotRatio)}> group_{groupIdx} </text>)
                

                // draw transitions
                if (timeIdx !== dataStore.timepoints.length - 1) {
                    const transformTR = `translate(${visStore.strokeW + offsetX},${visStore.newTimepointPositions.connection[timeIdx] + visStore.strokeW + this.groupLabelHeight})`


                    const firstTP = d
                    const firstGrouped = firstTP.customGrouped.map(g => this.getGroupedPartition(g, patientGroup)).filter(g=>g.patients.length>0);
                    const secondTP = dataStore.timepoints[timeIdx + 1];
                    const secondGrouped = secondTP.customGrouped.map(g => this.getGroupedPartition(g, patientGroup)).filter(g=>g.patients.length>0);
                    // if (secondTP.type=='between' & i<this.props.rootStore.dataStore.timepoints.length - 2){
                    //     secondTP = this.props.rootStore.dataStore.timepoints[i + 2];
                    // }
                    if (firstTP.customPartitions.length > 0) {
                        if (secondTP.customPartitions.length > 0) {
                            transitions.push(
                                <g className={`time${timeIdx}_group${groupIdx}`} key={`time${timeIdx}_group${groupIdx}`} transform={transformTR}>
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
                    let stateKey = d.partition || ''

                    let patients = d.patients.filter((p: string) => patientGroup.includes(p))
                    if (patients.length == 0) return
                    // timepoint.push(<rect fill={getColorByName(stateKey)} width={rectWidth} height={this.rectHeight} x={offsetX} key={`time${timeIdx}_group${groupIdx}_state${stateKey}`} />)

                    let transform = `translate(${offsetX}, ${0})`
                    let heatmap = d.heatmap.map(v => {
                        return { ...v, data: v.data.filter(p => patientGroup.includes(p.patient)) }
                    })

                    let partition = this.getGroupedPartition(group, patientGroup)

                    if (partition.patients.length === 0) return

                    timepoint.push(<g
                        key={`group${groupIdx}_state${group.partition}`}
                        className={`group${groupIdx}_state${group.partition}`}
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
                                hasBackground={this.hasBackground}
                                tooltipFunctions={this.props.tooltipFunctions}
                            />
                        </Provider>
                    </g>)



                    offsetX += visStore.groupScale(partition.patients.length) + visStore.partitionGap;
                })
            })



            timepoints.push(
                <g key={d.globalIndex} transform={transformTP} className={`time_${timeIdx}`}>
                    {timepoint}
                </g>,
            )


        });

        



        // draw timepoint icon
        const iconR = 10

        annotations.push(
            <line key="timeline"
                x1={this.paddingW + iconR} x2={this.paddingW + iconR}
                y1={this.paddingH + this.groupLabelHeight} y2={this.paddingH + this.groupLabelHeight + visStore.newTimepointPositions.connection[dataStore.timepoints.length-1]}
                stroke="gray"
            />)

        dataStore.timepoints.forEach((d, i) => {
            if (d.type==='between') return

            const transformTP = `translate(
                    ${this.paddingW},
                    ${this.paddingH + this.groupLabelHeight + visStore.newTimepointPositions.connection[i] - visStore.secondaryHeight * dataStore.variableStores['sample'].fullCurrentVariables.length} 
                    )`;

            annotations.push(
                <g key={d.globalIndex} transform={transformTP}>
                    <circle cx={iconR} cy={iconR} r={iconR} fill="white" stroke="gray" />
                    <text x={iconR} y={iconR * 1.4} textAnchor="middle">{annotations.length - 1}</text>
                </g>,
            )
        });

        // let groupLables = dataStore.patientGroups.map((group, groupIdx)=>{
        //     let offsetX = Object.values(layoutDict[0][groupIdx])[0].x
        //     let transform = `translate(${offsetX}, ${this.paddingH})`
        //     let isSelected = uiStore.selectedPatientGroupIdx.includes(groupIdx)
        //     return <g key={`group_${groupIdx}`} transform={transform} style={{fontWeight: isSelected?'bold':'normal', fill:isSelected?'#1890ff':'black'}} onClick={uiStore.selectPatientGroup(groupIdx)}>
        //             <text y={this.groupLabelHeight/2}>{`group_${groupIdx}`}</text>
        //             {/* <rect width={getTextWidth(`group_${groupIdx}`, 14)} height={this.groupLabelHeight/2 + this.paddingH} fill='none' stroke='gray'/> */}
        //         </g>
        //     })


        return [
            <g key="groupLabels" className="groupLabels">{groupLabels}</g>,
            <g key="timeAnnotation" className="timeAnnotation">{annotations}</g>, 
            <g key="transitions" className="transitions" transform={`translate(${this.props.width * (1 - this.plotRatio)}, 0)`}>
                {transitions}
            </g>,
            <g key="timepoints" className="timepoints" transform={`translate(${this.props.width * (1 - this.plotRatio)}, 0)`}>
                {timepoints}
            </g>,
        ];
    }
    render() {
        return <g className="transitionComparison">
            {this.getTransitionComparison()}
        </g>
    }
}

export default TransitionComparison