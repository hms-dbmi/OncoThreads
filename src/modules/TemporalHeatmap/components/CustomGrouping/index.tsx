import React from 'react';
import { observer, inject } from 'mobx-react';
import { observable, action, computed } from 'mobx';
import * as d3 from 'd3';
import { message } from 'antd';
import { PCA } from 'ml-pca';


import { Point, ReferencedVariables, VariableStore, NormPoint } from 'modules/Type'


import "./CustomGrouping.css"

import { getUniqueKeyName } from 'modules/TemporalHeatmap/UtilityClasses/'
import StageInfo from './StageInfo'
import { Switch } from 'antd';
import StageBlock from './StageBlock';
import Scatter from './Scatter'

import {clusterfck} from "../../UtilityClasses/clusterfck.js";

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


export type TSelected ={ [stageKey:string]: { stageKey: string, pointIdx: number[] }}


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
    @observable selected: TSelected = {}
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
        this.autoGroup = this.autoGroup.bind(this)

    }

    /**
     * computed based on selected, points, currentVariables
     * return the attribute domain of each stages
     */
    @computed
    get stages():TStage[] {
        let { selected } = this
        let { currentVariables, points } = this.props

        let selectedPoints: Point[][] = Object.values(selected)
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
                stageKey: Object.keys(selected)[stageIdx],
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

    @computed
    get normPoints(): NormPoint[] {
        let { points, currentVariables, referencedVariables } = this.props
        if (points.length === 0) return []
        let normValues = points.map(point => {
            let normValue = point.value.map((value, i) => {
                let ref = referencedVariables[currentVariables[i]]
                if (value === undefined) {
                    return 0
                } else if (typeof (value) == "number") {
                    let domain = ref.domain as number[]
                    return (value - domain[0]) / (domain[1] - domain[0])
                } else if (ref.domain.length === 1) {
                    return 0
                } else {
                    let domain: number[] | boolean[] = ref.domain as number[] | boolean[]
                    return domain.findIndex((d: number | boolean) => d === value) / (domain.length - 1)
                }
            })
            return normValue
        })

        var pca = new PCA(normValues)
        let norm2dValues:any = []

        if (normValues[0].length > 2) {
            console.info(pca.getEigenvectors().getColumn(0), pca.getEigenvectors().getColumn(1))
            // only calculate pca when dimension is larger than 2
            norm2dValues = pca.predict(normValues, { nComponents: 2 }).to2DArray()
            // console.info('pca points', newPoints)            
        } else{
            norm2dValues = normValues
        }


        var normPoints: NormPoint[] = normValues.map((d, i) => {
            return {
                ...points[i],
                normValue: d,
                pos: norm2dValues[i]
            }
        })
        


        return normPoints

    }

    @action
    autoGroup(){
        let normPoints = this.normPoints
        if (normPoints.length==0) return 
        var clusters = clusterfck.hcluster(normPoints.map(d=>d.pos), "euclidean", "single", 0.15);
        // console.info(tree)

        this.updateSelected(
            clusters.map((_:any,i:number)=>getUniqueKeyName(i, [])), 
            clusters.map((d:any)=>d.itemIdx)
        )
        // this.selected = clusters.map((cluster:any,i:number)=>{
        //     return {
        //         stageKey: getUniqueKeyName(i, []),
        //         pointIdx: cluster.itemIdx
        //     }
        // })

        // this.applyCustomGroups()
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
        this.selected = {}
        this.props.dataStore.resetStageLabel()


        d3.selectAll('circle.point')
            .attr('fill', 'white')
            .attr('r', 5)
            .attr('class', 'point')
    }

    @action
    deleteGroup(stageKey: string) {
        delete this.selected[stageKey]

        d3.selectAll(`circle.group_${stageKey}`)
            .attr('fill', 'white')
            .attr('r', 5)
            .attr('class', 'point')

    }

    @action
    applyCustomGroups() {
        let { selected } = this
        let { points } = this.props

        // check whether has unselected nodes
        let allSelected = Object.values(selected).map(d => d.pointIdx).flat()
        if (allSelected.length < points.length) {
            let leftNodes = points.map((_, i) => i)
                .filter(i => !allSelected.includes(i))

            let newStageKey = getUniqueKeyName(Object.keys(this.selected).length, Object.keys(this.selected))

            this.selected[newStageKey] ={
                stageKey: newStageKey,
                pointIdx: leftNodes
            }
            // message.info('All unselected nodes are grouped as one stage')
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
        Object.values(this.selected).forEach((stage) => {

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
                    points: nextPoints,
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
                            points: nextPoints.map(id => points[id])
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
    updateSelected(stageKeys:string[], groups:number[][]){
        
        for (let i=0;i<groups.length;i++){
            let stageKey = stageKeys[i], group = groups[i]
           
                if (group.length===0){
                    delete this.selected[stageKey]
                }else {
                    this.selected[stageKey] = {
                        stageKey,
                        pointIdx: group
                    }
                }
            
        }
        console.info(this.selected)
        this.applyCustomGroups()
        
    }

    componentDidMount() {
        this.updateSize()
        this.autoGroup()
        window.addEventListener('resize', this.updateSize);
    }
    // componentDidUpdate(){
    //     this.autoGroup()
    // }
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
                    style={{ height: `${height}px`, width: "100%", marginTop: "5px" }}
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

                    <svg className='customGrouping' width="100%" height={`${scatterHeight+pcpHeight-35}px`}>
                        <Scatter
                        points={points}
                        normPoints={this.normPoints}
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
