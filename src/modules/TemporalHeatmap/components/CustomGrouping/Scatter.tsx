import {NormPoint, Point, ReferencedVariables} from 'modules/Type'
import React from 'react';
import { observer } from 'mobx-react';
import {computed, has} from 'mobx';
import { PCA } from 'ml-pca';
import * as d3 from 'd3';
import {Tooltip} from 'antd';
import {TSelected} from '.';
import lasso from './lasso.js'

import {getColorByName, getUniqueKeyName} from 'modules/TemporalHeatmap/UtilityClasses/'

type TPatientDict = {
    [patient: string]: {
        patient: string, points: number[]
    }
}// the point id of each patient {paitent:{patient:string, points:id[]}}


interface Props {
    points: Point[],
    currentVariables: string[],
    referencedVariables: ReferencedVariables, 
    selected: TSelected,
    width: number,
    height: number,
    hasLink: boolean,
    colorScales: Array<(value: string | number | boolean) => string>,
    setHoverID: (id:number)=>void;
    resetHoverID:()=>void
}


@observer
class Scatter extends React.Component<Props> {
    constructor(props: Props){
        super(props)
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
                pos: d
            }
        })

        return normPoints

    }

    @computed
    get patientDict() {
        let {points} = this.props

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

    drawScatterPlot( r: number = 5, margin: number = 20) {
        let {width, height, selected, hasLink, resetHoverID, setHoverID} = this.props
        this.addLasso(width, height)

        let patientDict = this.patientDict

        let normPoints = this.normalizePoints

        if (normPoints.length === 0) {
            return <g className='points' />
        }
        var xScale = d3.scaleLinear()
            .domain(d3.extent(normPoints.map(d => d.pos[0])) as [number, number])
            .range([margin, width - margin])

        var yScale = d3.scaleLinear()
            .domain(d3.extent(normPoints.map(d => d.pos[1])) as [number, number])
            .range([margin, height - margin])


        const maxTimeIdx = Math.max(...normPoints.map(p => p.timeIdx))
        var circles = normPoints.map((normPoint) => {
            let id = normPoint.idx
            let groupIdx = selected.findIndex(p => p.pointIdx.includes(id))
            let opacity = hasLink ? 0.1 + normPoint.timeIdx * 0.6 / maxTimeIdx : 1
            return <circle
                key={id}
                id={id.toString()}
                cx={xScale(normPoint.pos[0])}
                cy={yScale(normPoint.pos[1])}
                r={r}
                fill={hasLink ? "black" : (
                    groupIdx > -1 ? getColorByName(selected[groupIdx].stageKey) : "white"
                )}
                stroke='black'
                strokeWidth='1'
                opacity={opacity}
                className='point'
                onMouseEnter={()=>setHoverID(id)}
                onMouseLeave={()=>resetHoverID()}
                cursor='pointer'
            />
        })

        let links = this.drawLinks(xScale, yScale)

        return [circles, links]



    }

    drawLinks(xScale:d3.ScaleLinear<number,number>, yScale:d3.ScaleLinear<number,number>){

        let {hasLink} = this.props
        if (!hasLink) return <g className="lines" key='links'/>

        let curveGenerator = d3.line()
        .x((p: NormPoint | any) => xScale(p.value[0]))
        .y((p: NormPoint | any) => yScale(p.value[1]))
        .curve(d3.curveMonotoneX)

        

    let curves = Object.keys(this.patientDict).map(patient => {
        let pointIds = this.patientDict[patient].points
        let path = curveGenerator(pointIds.map(id => this.normalizePoints[id]) as any[])
        return <path
            key={patient}
            d={path as string}
            fill='none'
            stroke='gray'
            strokeWidth='1'
            className='curve'
        />
    })

    return <g className="lines" key='links'>
                    {curves}
            </g>


    }

    addLasso(width: number, height: number) {
        let {selected} = this.props
        // lasso draw
        d3.selectAll('g.lasso').remove()
        var svg = d3.select('svg.customGrouping')
        // var lasso_area = svg.append("rect")
        //     .attr('class', 'lasso area')
        //     .attr("width", width)
        //     .attr("height", height)
        //     .style("opacity", 0);
        
        var lasso_area = d3.select("rect.lasso")
        
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


            let thisSelected = (mylasso.selectedItems() as any)._groups[0].map((d: any): number => parseInt(d.attributes.id.value))
            if (thisSelected.length > 0) {
                // if selected nodes are in previous stages

                selected.forEach((g, i) => {
                    g.pointIdx = g.pointIdx.filter(point => !thisSelected.includes(point))
                    if (g.pointIdx.length > 0) {
                        selected[i] = g // update the group by removing overlapping points
                    } else {
                        selected.splice(i, 1) // delete the whole group if all points overlap
                    }
                })



                let stageKey = getUniqueKeyName(selected.length, selected.map(d => d.stageKey))
                selected.push({
                    stageKey,
                    pointIdx: thisSelected
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



    render() {
        let {width, height} = this.props
        return <g className='scatter'>
            <rect className='lasso area' width={width} height={height} opacity={0}/>
            {this.drawScatterPlot()}
            </g>
    }
}




export default Scatter;