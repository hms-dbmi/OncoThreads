import React from 'react';
import { observer, inject, Provider } from 'mobx-react';
import { observable, action, computed } from 'mobx';
import * as d3 from 'd3';
import { message } from 'antd';

import { Point, ReferencedVariables, NormPoint, VariableStore } from 'modules/Type'


import "./CustomGrouping.css"

import { getUniqueKeyName } from 'modules/TemporalHeatmap/UtilityClasses/'
import StageInfo from './StageInfo'
import { Switch } from 'antd';
import StageBlock from './StageBlock';
import Scatter from './Scatter'

/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed as arrows
 */

type TimeStage = {
    timeIdx: number,
    partitions: Partition[]
}
type EventStage = TimeStage
type Partition = {
    partition: string, //stage name
    patients: string[],
    points: number[], // point ids
    rows: Row[]
}
type Row = {
    variable: string, //attribute name
    counts: Count[]
}
type Count = {
    key: string | number | boolean, // attribute value
    patients: string[]
}

export type TStage = {
    domains:{
        [attrName:string]:string[]|number[]|boolean[]
    },
    points: number[],
    stageKey:string
}


export type TSelected = { stageKey: string, pointIdx: number[] }[]


interface Props {
    points: Point[],
    currentVariables: string[],
    referencedVariables: ReferencedVariables,
    dataStore: VariableStore,
    stageLabels: { [stageKey: string]: string },
    colorScales: Array<(value: string|number|boolean)=>string>,
}

@inject('dataStore')
@observer
class CustomGrouping extends React.Component<Props> {
    @observable width: number = window.innerWidth / 2
    @observable height: number = window.innerHeight - 140
    @observable selected: TSelected = []
    @observable hasLink: boolean = false
    @observable hoverPointID:number = -1
    private ref = React.createRef<HTMLDivElement>();

    constructor(props: Props) {
        super(props);
        this.ref = React.createRef()

        this.resetGroup = this.resetGroup.bind(this)
        this.deleteGroup = this.deleteGroup.bind(this)
        this.applyCustomGroups = this.applyCustomGroups.bind(this)
        this.setHoverID = this.setHoverID.bind(this)
        this.resetHoverID = this.resetHoverID.bind(this)
        this.updateSize = this.updateSize.bind(this)
        this.updateSelected = this.updateSelected.bind(this)

    }

    /**
     * computed based on selected, points, currentVariables
     * return the attribute domain of each stages
     */
    @computed
    get stages():TStage[] {
        let { selected } = this
        let { currentVariables, points } = this.props

        let selectedPoints: Point[][] = selected
            .map(s => {
                return points
                    .filter((_, i) => s.pointIdx.includes(i))
            })

        const summarizeDomain = (values: string[] | number[] | boolean[]) => {
            if (typeof (values[0]) == "number") {
                let v = values as number[] // stupid typescropt
                let range = [Math.min(...v).toPrecision(4), Math.max(...v).toPrecision(4)]
                return range
            } else if (typeof (values[0]) == "string") {
                let v = values as string[]
                return [...new Set(v)]
            } else if (typeof (values[0]) == "boolean") {
                let v = values as boolean[]
                return [...new Set(v)]
            } else return []
        }

        let stages = selectedPoints.map((p, stageIdx) => {
            let stage: TStage = {
                stageKey: selected[stageIdx].stageKey,
                domains: {},
                points: p.map(p=>p.idx)
            }
            currentVariables.forEach((name, valueIdx) => {
                stage.domains[name] = summarizeDomain(
                    p.map(p => p.value[valueIdx]) as number[] | string[] | boolean[]
                    )
            })

            return stage
        })



        return stages
    }

    

    /**
     * summarize the selected group of points
     * @param {patient:string, value:number[], timeIdx: number}[] points 
     * @param string[] selected: ids of points
     * @param string[] currentVariables
     * @return {variableName: domain} group
     */

    @action
    resetGroup() {
        this.selected = []
        this.props.dataStore.resetStageLabel()


        d3.selectAll('circle.point')
            .attr('fill', 'white')
            .attr('r', 5)
            .attr('class', 'point')
    }

    @action
    deleteGroup(i: number) {
        this.selected.splice(i, 1)

        d3.selectAll(`circle.group_${i}`)
            .attr('fill', 'white')
            .attr('r', 5)
            .attr('class', 'point')

    }

    @action
    applyCustomGroups() {
        let { selected } = this
        let { points } = this.props

        // check whether has unselected nodes
        let allSelected = selected.map(d => d.pointIdx).flat()
        if (allSelected.length < points.length) {
            let leftNodes = points.map((_, i) => i)
                .filter(i => !allSelected.includes(i))

            this.selected.push({
                stageKey: getUniqueKeyName(this.selected.length, this.selected.map(d => d.stageKey)),
                pointIdx: leftNodes
            })
            message.info('All unselected nodes are grouped as one stage')
        }



        let timeStages: TimeStage[] = []
        let uniqueTimeIds = [...new Set(points.map(p => p.timeIdx))]

        uniqueTimeIds.forEach(timeIdx => {
            timeStages.push({
                timeIdx,
                partitions: []
            })
        })

        // push points to corresponding time stage
        this.selected.forEach((stage) => {

            let stageKey = stage.stageKey

            stage.pointIdx.forEach(id => {
                let { patient, timeIdx } = points[id]
                // get the timestage is stored
                let timeStage = timeStages[timeIdx]

                // check whether the partition in the timestage
                let partitionIdx = timeStage.partitions.map(d => d.partition).indexOf(stageKey)
                if (partitionIdx > -1) {

                    let partition = timeStage.partitions[partitionIdx],
                        { points, patients } = partition
                    points.push(id)
                    patients.push(patient)
                } else {
                    timeStage.partitions.push({
                        partition: stageKey,
                        points: [id],
                        rows: [],
                        patients: [patient]
                    })
                }
            })
        })

        // creat event stages
        let eventStages: EventStage[] = [timeStages[0]]
        for (let i = 0; i < timeStages.length - 1; i++) {
            let eventStage: EventStage = { timeIdx: i + 1, partitions: [] }
            let curr = timeStages[i], next = timeStages[i + 1]


            next.partitions.forEach(nextPartition => {
                let {
                    partition: nextName,
                    patients: nextPatients,
                } = nextPartition
                
                curr.partitions.forEach((currPartition: Partition) => {
                    let {
                        partition: currName,
                        patients: currPatients,
                        points: currPoints
                    } = currPartition
                    
                    let intersection = currPatients.filter(d => nextPatients.includes(d))
                    if (intersection.length > 0) {
                        eventStage.partitions.push({
                            partition: `${currName}-${nextName}`,
                            patients: intersection,
                            points: currPoints.map(id => points[id])
                                .filter(p => intersection.includes(p.patient))
                                .map(p => p.idx),
                            rows: []
                        }
                        )
                    }
                })
            })
            eventStages.push(eventStage)

        }
        eventStages.push(
            {
                ...timeStages[timeStages.length - 1],
                timeIdx: timeStages.length
            }
        )

        this.props.dataStore.applyCustomStages(timeStages, eventStages)

    }

    @action
    setHoverID(id:number){
        this.hoverPointID = id
    }

    @action
    resetHoverID(){
        this.hoverPointID = -1
    }

    @action
    updateSelected(i:number, group:TSelected[number]|undefined){
        if (group==undefined){
            this.selected.splice(i,1)
        }else if(i<this.selected.length){
            this.selected[i] = group
        }else {
            this.selected.push(group)
        }
        
    }

    componentDidMount() {
        this.updateSize()
        window.addEventListener('resize', this.updateSize);
    }
    componentWillUnmount(){
        window.removeEventListener('resize', this.updateSize);
    }
    updateSize(){
        if (this.ref.current) {
            this.width = this.ref.current.getBoundingClientRect().width
        }
    }


    render() {

        let { points, currentVariables, referencedVariables, colorScales } = this.props
        let { width, height, selected, hasLink } = this
        let pcpMargin = 25
        let scatterHeight = height * 0.35, pcpHeight = height * 0.45, infoHeight = height * 0.2


        // used stroe actions
        let toggleHasEvent = this.props.dataStore.toggleHasEvent

        return (
            <div className="container" style={{ width: "100%" }}>
                <div
                    className="customGrouping"
                    style={{ height: `${this.height}px`, width: "100%", marginTop: "5px" }}
                    ref={this.ref}
                >
                    <Switch size="small"
                        checkedChildren="links" unCheckedChildren="links"
                        onChange={() => {
                            this.hasLink = !this.hasLink
                        }} />
                    <Switch size="small"
                        style={{ marginLeft: '5px' }}
                        checkedChildren="events" unCheckedChildren="events"
                        onChange={toggleHasEvent} />

                    <svg className='customGrouping' width="100%" height="80%">
                        <Scatter
                        points={points}
                        currentVariables={currentVariables}
                        referencedVariables= {referencedVariables} 
                        selected={selected}
                        width={width}
                        height={scatterHeight}
                        hasLink={hasLink}
                        colorScales={colorScales}
                        hoverPointID={this.hoverPointID}
                        setHoverID={this.setHoverID}
                        resetHoverID={this.resetHoverID}
                        updateSelected = {this.updateSelected}
                        />
                        <g className='stageBlock' transform={`translate(${pcpMargin}, ${pcpMargin + scatterHeight})`}>
                            <StageBlock 
                                stageLabels={this.props.stageLabels}
                                width={width - 2 * pcpMargin}
                                height={pcpHeight - 2 * pcpMargin}
                                points={points}
                                selected={this.selected}
                                colorScales={this.props.colorScales}
                                hoverPointID={this.hoverPointID}
                                setHoverID={this.setHoverID}
                                resetHoverID={this.resetHoverID}
                            />
                        </g>

                        {/* <g className='PCP' transform={`translate(${pcpMargin}, ${pcpMargin + scatterHeight})`}>
                            <Parset parsetData={this.parsetData}
                                width={width - 2 * pcpMargin}
                                height={pcpHeight - 2 * pcpMargin}
                                points={points}
                            /> 
                            <ParallelSet points={points}
                                currentVariables={this.props.currentVariables}
                                referencedVariables={this.props.referencedVariables}
                                width={width - 2 * pcpMargin}
                                height={pcpHeight - 2 * pcpMargin}
                                selected={this.selected}
                            />
                        </g> */}
                    </svg>
                    <StageInfo
                        stages={this.stages} height={infoHeight}
                        stageLabels={this.props.stageLabels}
                        resetGroup={this.resetGroup}
                        deleteGroup={this.deleteGroup}
                        applyCustomGroups={this.applyCustomGroups}
                    />
                </div>
            </div>
        );
    }
}

export default CustomGrouping
