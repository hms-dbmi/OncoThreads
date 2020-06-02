import React from 'react';
import { observer, inject, Provider } from 'mobx-react';
import { observable, action, computed } from 'mobx';
import { PCA } from 'ml-pca';
import * as d3 from 'd3';
import lasso from './lasso.js'
import { message } from 'antd';

import { Point, ReferencedVariables, NormPoint, VariableStore } from 'modules/Type'


import "./CustomGrouping.css"

import { getColorByName } from 'modules/TemporalHeatmap/UtilityClasses/'
import { num2letter } from 'modules/TemporalHeatmap/UtilityClasses/'
import StageInfo from './StageInfo'
import { Switch } from 'antd';
import StageBlock from './StageBlock';

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

type CatePoint = {
    [name: string]: any,
}



type TPatientDict = {
    [patient: string]: {
        patient: string, points: number[]
    }
}// the point id of each patient {paitent:{patient:string, points:id[]}}


export type TStage = {
    domains:{
        [attrName:string]:string[]|number[]|boolean[]
    },
    points: number[],
    stageKey:string
}


const getUniqueName = (num: number, existingNames: string[]): string => {
    let name = num2letter(num)
    if (existingNames.includes(name)) {
        return getUniqueName(num + 1, existingNames)
    } else return name
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
        // this.getPoints = this.getPoints.bind(this)
        this.addLasso = this.addLasso.bind(this)
        this.ref = React.createRef()


        this.resetGroup = this.resetGroup.bind(this)
        this.deleteGroup = this.deleteGroup.bind(this)
        this.applyCustomGroups = this.applyCustomGroups.bind(this)

    }


    getPatientDict() {
        let points = this.props.points

        let patientDict: TPatientDict = {}
        // get points,each points is one patient at one timepoint
        points.forEach((point, pointIdx) => {
            let { patient } = point
            if (patient in patientDict) {
                patientDict[patient].points.push(pointIdx)
            } else {
                patientDict[patient] = {
                    patient,
                    points: [pointIdx]
                }
            }
        })

        return patientDict
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

    // normalize points to [0,1] range.
    // @param: points: string||number[][], 
    // @param: currentVariable: [variableName:string][]
    // @param: referencedVariables: {[variableName:string]: {range:[], datatype:"NUMBER"|"STRING"}}
    // return: points: number[][]
    @computed
    get normalizePoints(): NormPoint[] {
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

        if (normValues[0].length > 2) {
            // only calculate pca when dimension is larger than 2
            normValues = pca.predict(normValues, { nComponents: 2 }).to2DArray()
            // console.info('pca points', newPoints)
        }


        var normPoints: NormPoint[] = normValues.map((d, i) => {
            return {
                ...points[i],
                value: d
            }
        })

        return normPoints

    }


    // @params: points: {patient:string, value:[number, number]}[]
    // @params: width:number, height:number, r:number
    // @return: <g></g>
    drawScatterPlot(width: number, height: number, r: number = 5, margin: number = 20) {
        this.addLasso(width, height)

        let patientDict = this.getPatientDict()
        let { selected } = this
        let normPoints = this.normalizePoints

        if (normPoints.length === 0) {
            return <g className='points' />
        }
        var xScale = d3.scaleLinear()
            .domain(d3.extent(normPoints.map(d => d.value[0])) as [number, number])
            .range([margin, width - margin])

        var yScale = d3.scaleLinear()
            .domain(d3.extent(normPoints.map(d => d.value[1])) as [number, number])
            .range([margin, height - margin])


        const maxTimeIdx = Math.max(...normPoints.map(p => p.timeIdx))
        var circles = normPoints.map((normPoint) => {
            let id = normPoint.idx
            let groupIdx = selected.findIndex(p => p.pointIdx.includes(id))
            let opacity = this.hasLink ? 0.1 + normPoint.timeIdx * 0.6 / maxTimeIdx : 1
            return <circle
                key={id}
                id={id.toString()}
                cx={xScale(normPoint.value[0])}
                cy={yScale(normPoint.value[1])}
                r={r}
                fill={this.hasLink ? "black" : (
                    groupIdx > -1 ? getColorByName(this.selected[groupIdx].stageKey) : "white"
                )}
                stroke='black'
                strokeWidth='1'
                opacity={opacity}
                className='point'
                onMouseEnter={()=>{this.hoverPointID=id}}
                onMouseLeave={()=>{this.hoverPointID=-1}}
                cursor='pointer'
            />
        })


        let curveGenerator = d3.line()
            .x((p: NormPoint | any) => xScale(p.value[0]))
            .y((p: NormPoint | any) => yScale(p.value[1]))
            .curve(d3.curveMonotoneX)

        let curves = Object.keys(patientDict).map(patient => {
            let pointIds = patientDict[patient].points
            let path = curveGenerator(pointIds.map(id => normPoints[id]) as any[])
            return <path
                key={patient}
                d={path as string}
                fill='none'
                stroke='gray'
                strokeWidth='1'
                className='curve'
            />
        })

        

        if (this.hasLink) {
            return <g className='patientScatter'>
                <g className="points">
                    {circles}
                </g>
                <g className="lines">
                    {curves}
                </g>
            </g>
        }
        else {
            return <g className='patientScatter'>
                <g className="points">
                    {circles}
                </g>
            </g>
        }


    }

    addLasso(width: number, height: number) {
        // lasso draw
        d3.selectAll('.lasso').remove()
        var svg = d3.select('svg.customGrouping')
        var lasso_area = svg.append("rect")
            .attr('class', 'lasso area')
            .attr("width", width)
            .attr("height", height)
            .style("opacity", 0);
        
        // Lasso functions to execute while lassoing
        var lasso_start = () => {
            (mylasso.items() as any)
                .attr("r", 5) // reset size
            // .attr('fill', 'white')
        };

        var lasso_draw = () => {
            // Style the possible dots
            // mylasso
            // .possibleItems()
            // .classed("possible", true)
        };

        var lasso_end = () => {

            // mylasso.selectedItems()
            //     .attr('fill', colors[this.selected.length])
            //     .attr('r', '7')
            //     .classed(`group_${this.selected.length}`, true)
            // mylasso
            // .items()
            // .classed("possible", false)


            let selected = (mylasso.selectedItems() as any)._groups[0].map((d: any): number => parseInt(d.attributes.id.value))
            if (selected.length > 0) {
                // if selected nodes are in previous stages

                this.selected.forEach((g, i) => {
                    g.pointIdx = g.pointIdx.filter(point => !selected.includes(point))
                    if (g.pointIdx.length > 0) {
                        this.selected[i] = g // update the group by removing overlapping points
                    } else {
                        this.selected.splice(i, 1) // delete the whole group if all points overlap
                    }
                })



                let stageKey = getUniqueName(this.selected.length, this.selected.map(d => d.stageKey))
                this.selected.push({
                    stageKey,
                    pointIdx: selected
                })
            }

        };


        var mylasso = lasso()
        mylasso.items(d3.selectAll('circle.point'))
        mylasso.targetArea(lasso_area) // area where the lasso can be started
            .on("start", lasso_start) // lasso start function
            .on("draw", lasso_draw) // lasso draw function
            .on("end", lasso_end); // lasso end function


        svg.call(mylasso)


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
                stageKey: getUniqueName(this.selected.length, this.selected.map(d => d.stageKey)),
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

    componentDidMount() {
        if (this.ref.current) {
            this.width = this.ref.current.getBoundingClientRect().width
        }

    }


    render() {

        let { points } = this.props
        let { width, height, } = this
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
                        {this.drawScatterPlot(width, scatterHeight)}

                        <g className='stageBlock' transform={`translate(${pcpMargin}, ${pcpMargin + scatterHeight})`}>
                            <StageBlock 
                                stageLabels={this.props.stageLabels}
                                width={width - 2 * pcpMargin}
                                height={pcpHeight - 2 * pcpMargin}
                                points={points}
                                selected={this.selected}
                                colorScales={this.props.colorScales}
                                hoverPointID={this.hoverPointID}
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
