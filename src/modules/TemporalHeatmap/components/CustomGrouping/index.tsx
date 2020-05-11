import React from 'react';
import { inject, observer} from 'mobx-react';
import { extendObservable, observable, computed } from 'mobx';
import { PCA } from 'ml-pca';
import * as d3 from 'd3';
import lasso from './lasso.js'
import { message} from 'antd';

import {Point, ReferencedVariables, TimePoint, NormPoint} from 'modules/Type'

import "./CustomGrouping.css"

import PCP from './pcp'
import ColorScales from 'modules/TemporalHeatmap/UtilityClasses/ColorScales'
import StageInfo from './StageInfo'
import { Switch } from 'antd';
import Variable from 'modules/TemporalHeatmap/stores/Variable.jsx';

const colors = ColorScales.defaultCategoricalRange
/*
 * BlockViewTimepoint Labels on the left side of the main view
 * Sample Timepoints are displayed as numbers, Between Timepoints are displayed as arrows
 */
interface Props {
    timepoints: TimePoint[],
    currentVariables: string[],
    referencedVariables: ReferencedVariables,
}

type TPatientDict = {
    [p:string]:{
        patient:string, points:number[]
    }
}// the point id of each patient {paitent:{patient:string, points:id[]}}

type TGroup = {
    [domain:string]:string[]|number[]
}

class CustomGrouping extends React.Component <Props> {
    @observable width:number=window.innerWidth / 2 
    @observable height:number=window.innerHeight-140 
    @observable selected:number[][]=[]
    @observable hasLink:boolean = false
    private ref =  React.createRef<HTMLDivElement>(); 

    constructor(props:Props) {
        super(props);
        // this.getPoints = this.getPoints.bind(this)
        this.addLasso = this.addLasso.bind(this)
        this.ref = React.createRef()

        this.resetGroup = this.resetGroup.bind(this)
        this.deleteGroup = this.deleteGroup.bind(this)
        this.applyCustomGroups = this.applyCustomGroups.bind(this)

    }
    @computed
    get pointsAndPatientDict() {

        var points:Point[] = []
        
        var patientDict:TPatientDict = {} 
        // get points,each points is one patient at one timepoint
        this.props.timepoints.forEach((timepoint, timeIdx) => {
            var heatmap = timepoint.heatmap

            if (heatmap[0]) {
                heatmap[0].data.forEach((_, i) => {
                    let patient = timepoint.heatmapOrder[i]
                    var point = {
                        patient,
                        value: heatmap.map(d => d.data[i].value),
                        timeIdx 
                    }
                    if ( patientDict[patient] === undefined){
                        patientDict[patient]={
                            patient,
                            points:[points.length]
                        }
                    }else{
                        patientDict[patient].points.push(points.length)
                    }
                    points.push(point)
                })
            }
        })

        // console.info('old points', points)

        
        return {points, patientDict}
    }

    @computed
    get groups(){
        let {selected} = this
        let {currentVariables} = this.props
        let {points} = this.pointsAndPatientDict
        let selectedPoints = selected
            .map(s=>{
                return points
                .filter((_,i)=>s.includes(i))
            })

        const summarizeDomain = (values:string[]|number[]|boolean[])=>{
            if (typeof(values[0])=="number"){
                let v = values as number[] // stupid typescropt
                return [Math.min(...v).toPrecision(4), Math.max(...v).toPrecision(4)]
            }else if (typeof(values[0])=="string"){
                let v = values as string[]
                return [...new Set(v)]
            } else return []
        }

        let groups = selectedPoints.map(p=>{
            let group:TGroup = {}
            currentVariables.forEach((name,i)=>{
                group[name] = summarizeDomain( p.map(p=>p.value[i])  as number[]|string[]|boolean[])
            })
            
            return group
        })
        
        

        return groups
    }

    // convert points to [0,1] range.
    // @param: points: string||number[][], 
    // @param: currentVariable: [variableName:string][]
    // @param: referencedVariables: {[variableName:string]: {range:[], datatype:"NUMBER"|"STRING"}}
    // return: points: number[][]
    @computed
    get normalizePoints():NormPoint[] {
        let {points} = this.pointsAndPatientDict
        let {currentVariables, referencedVariables} = this.props
        if (points.length === 0) return []
        let normValues = points.map(point => {
            let normValue = point.value.map((value, i) => {
                let ref = referencedVariables[currentVariables[i]]
                if (value === undefined) {
                    return 0
                } else if (typeof(value) == "number") {
                    let domain = ref.domain as number[]
                    return (value - domain[0]) / (domain[1] - domain[0])
                } else if (ref.domain.length === 1){
                    return 0
                }else{
                    let domain: number[]|boolean[] = ref.domain as number[]|boolean[]
                    return domain.findIndex((d:number|boolean)=>d===value) / (domain.length-1)
                } 
            })
            return normValue
        })

        var pca = new PCA(normValues)
        // console.info(newPoints)
        if (normValues[0].length > 2) {
            // only calculate pca when dimension is larger than 2
            normValues = pca.predict(normValues, { nComponents: 2 }).to2DArray()
            // console.info('pca points', newPoints)
        }
        

        var normPoints:NormPoint[] = normValues.map((d, i) => {
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
    drawVIS( width:number, height:number, r:number = 5, margin:number = 20) {
        

        let {patientDict} = this.pointsAndPatientDict
        let {selected} = this
        let points = this.normalizePoints

        if (points.length === 0) {
            return <g className='points' />
        }
        var xScale = d3.scaleLinear()
            .domain(d3.extent(points.map(d => d.value[0])) as [number,number])
            .range([margin, width - margin])

        var yScale = d3.scaleLinear()
            .domain(d3.extent(points.map(d => d.value[1])) as [number, number])
            .range([margin, height - margin])

        
        const maxTimeIdx = Math.max(...points.map(p=>p.timeIdx))
        var circles = points.map((point,i) => {
            let id = i
            let groupIdx = selected.findIndex(p=>p.includes(id))
            let opacity = this.hasLink? 0.1+ point.timeIdx*0.6/maxTimeIdx : 0.5
            return <circle
                key={id}
                id = {id.toString()}
                cx={xScale(point.value[0])}
                cy={yScale(point.value[1])}
                r={r}
                fill={groupIdx>-1?colors[groupIdx]:(this.hasLink?"black":"white")}
                stroke='black'
                strokeWidth='1'
                opacity={opacity}
                className='point'
            />
        })

        var lines = Object.keys(patientDict).map(patient=>{
            let pointIds = patientDict[patient].points 
            let path = pointIds.map((id, i)=>{
                let x = xScale( points[id].value[0] )
                let y = yScale( points[id].value[1] )
                return `${i===0?'M':'L'} ${x} ${y}`
            })

            return <path 
            key={patient} 
            d={path.join(' ')} 
            fill='none'
            stroke='gray'
            strokeWidth='1'
            />
        })

        let curveGenerator = d3.line()
            .x((p: NormPoint|any)=> xScale(p.value[0]) )
            .y((p: NormPoint|any)=>yScale(p.value[1]))
            .curve(d3.curveMonotoneX)

        let curves=Object.keys(patientDict).map(patient=>{
            let pointIds = patientDict[patient].points 
            let path = curveGenerator(pointIds.map(id=>points[id]) as any[])
            return <path 
            key={patient} 
            d={path as string} 
            fill='none'
            stroke='gray'
            strokeWidth='1'
            />
        })

        this.addLasso(width, height)

        if (this.hasLink){
            return <g className='patientTrajectory'>
            <g className="points">
                {circles}
            </g>
            <g className="lines">
                {curves}
            </g>
        </g>
        }
        else {
            return <g className='patientTrajectory'>
            <g className="points">
                {circles}
            </g>
            </g>
        }
        

    }

    addLasso(width:number, height:number) {
        // lasso draw
        d3.selectAll('.lasso').remove()
        var svg = d3.select('svg.customGrouping')
        var lasso_area = svg.append("rect")
            .attr('class','lasso area')
            .attr("width", width)
            .attr("height", height)
            .style("opacity", 0);
        // console.info(
        //     lasso(),
        //     lasso()()
        //     )
        // Lasso functions to execute while lassoing
        var lasso_start =  () =>{
            (mylasso.items() as any)
                .attr("r", 5) // reset size
                // .attr('fill', 'white')
        };

        var lasso_draw = ()=> {
            // Style the possible dots
            // mylasso
            // .possibleItems()
            // .classed("possible", true)
        };

        var lasso_end = ()=>{
        
            // mylasso.selectedItems()
            //     .attr('fill', colors[this.selected.length])
            //     .attr('r', '7')
            //     .classed(`group_${this.selected.length}`, true)
            // mylasso
            // .items()
            // .classed("possible", false)

             
            let selected = (mylasso.selectedItems() as any)._groups[0].map((d:any):number=>parseInt(d.attributes.id.value))
            if (selected.length>0){
                // if selected nodes are in previous groups
                this.selected.forEach((g,i)=>{
                    g = g.filter(point=>!selected.includes(point))
                    if(g.length>0) {
                        this.selected[i]=g
                    }else{
                        this.selected.splice(i, 1)
                    }
                })
                this.selected.push(selected)        
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
   
    resetGroup(){
        this.selected = []


        d3.selectAll('circle.point')
        .attr('fill','white')
        .attr('r',5)
        .attr('class', 'point')
    }
    deleteGroup(i:number){
        this.selected.splice(i,1)

        d3.selectAll(`circle.group_${i}`)
        .attr('fill','white')
        .attr('r',5)
        .attr('class', 'point')

    }

    applyCustomGroups(){
        let {selected} = this
        let {points} = this.pointsAndPatientDict

        // check whether has unselected nodes
        let allSelected = selected.flat()
        if (allSelected.length<points.length){
            let leftNodes = points.map((_,i)=>i)
                .filter(i=>!allSelected.includes(i))
            this.selected.push(leftNodes)
            message.info('All unselected nodes are grouped as one stage')
        }
        
        type TimeStage = {
            timeIdx: number,
            partitions: Partition[]
        }
        type Partition = {
            partition: string, //stage name
            patients: string[],
            points:number[], // point ids
            rows:Row[]
        }
        type Row ={
            variable:string, //attribute name
            counts: Count[]
        }
        type Count = {
            key:string|number|boolean, // attribute value
            patients:string[]
        }

        let timeStages:TimeStage[] = []
        this.props.timepoints.forEach((_, timeIdx)=>{
            timeStages.push({
                timeIdx,
                partitions:[]
            })
        })

        // push points to corresponding time stage
        this.selected.forEach((pointIds,stageId)=>{
            pointIds.forEach(id=>{
                
                let stageName = String.fromCharCode(65 + stageId)
                let {patient, timeIdx} = points[id]
                let timeStage = timeStages[timeIdx]
                let partitionId = timeStage.partitions.map(d=>d.partition).indexOf(stageName)
                if (partitionId>-1){
                    
                    let partition = timeStage.partitions[partitionId],
                    {points, patients} = partition
                    points.push(id)
                    if (! patients.includes(patient)){
                        patients.push(patient)
                    }
                }else{
                    timeStage.partitions.push({
                        partition:stageName,
                        points:[id],
                        rows:[],
                        patients:[patient]
                    })
                }
            })
        })

        // summarize rows
        timeStages.forEach(timeStage=>{
            timeStage.partitions.forEach(partition=>{
                let partitionPoints:Point[] = partition.points.map(id=>points[id])

                partition.rows = this.props.currentVariables.map((variable, variableId)=>{
                    let counts:Count[] = []
                    partitionPoints.forEach(point=>{
                        let key = point.value[variableId]
                        let keyIdx = counts.map(d=>d.key).indexOf(key)
                        if (keyIdx===-1){
                            counts.push({
                                key,
                                patients:[point.patient]
                            })
                        }else{
                            if (!(counts[keyIdx].patients.includes(point.patient))){
                                counts[keyIdx].patients.push(point.patient)
                            }         
                        }
                    })
                    return {
                        variable,
                        counts
                    }
                })
            })
        })
        console.info(timeStages)

        this.props.timepoints.forEach((TP,i)=>{
            TP.applyCustomStage(timeStages[i].partitions)
        })

    }

    componentDidMount() {
        if (this.ref.current){
            this.width = this.ref.current.getBoundingClientRect().width
        }
        
    }


    render() {
        
        let {points} = this.pointsAndPatientDict
        let { width, height } = this
        let pcpMargin = 25
        let scatterHeight = height*0.35, pcpHeight = height*0.45, infoHeight=height*0.2

        let groups = this.groups
        return (
            <div className="container" style={{ width: "100%" }}>
                <div 
                    className="customGrouping" 
                    style={{ height:`${this.height}px`, width: "100%",marginTop: "5px"}} 
                    ref={this.ref}
                >
                    <Switch size="small" 
                    style={{position:"absolute"}}
                    defaultChecked 
                    onChange={()=>{
                        this.hasLink = !this.hasLink
                    }}/>

                    <svg className='customGrouping' width="100%" height="80%">
                        {this.drawVIS(width, scatterHeight)}

                        <g className='PCP' transform={`translate(${pcpMargin}, ${pcpMargin+scatterHeight})`}>
                            <PCP points={points} 
                            currentVariables={this.props.currentVariables}
                            referencedVariables={this.props.referencedVariables}
                            width={width-2*pcpMargin}
                            height={pcpHeight-2*pcpMargin}
                            selected = {this.selected}
                            />
                        </g>
                    </svg>
                    <StageInfo 
                    groups={groups} height={infoHeight} 
                    resetGroup={this.resetGroup}
                    deleteGroup={this.deleteGroup}
                    applyCustomGroups={this.applyCustomGroups}
                    />
                </div>
            </div>
        );
    }
}

export default  observer(CustomGrouping)
