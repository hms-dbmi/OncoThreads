import { NormPoint, Point, ReferencedVariables } from 'modules/Type'
import React from 'react';
import { observer } from 'mobx-react';
import { computed } from 'mobx';
import { PCA } from 'ml-pca';
import * as d3 from 'd3';
import { TSelected } from '.';
import lasso from './lasso.js'

import { getColorByName, getUniqueKeyName, ColorScales } from 'modules/TemporalHeatmap/UtilityClasses/'
import { updateData } from 'lineupjs/src/ui/EngineRanking';
import { selection } from 'd3';

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
    hoverPointID: number,
    hasLink: boolean,
    colorScales: Array<(value: string | number | boolean) => string>,
    setHoverID: (id: number) => void,
    resetHoverID: () => void,
    updateSelected: (i:number, group:TSelected[number]|undefined)=>void
}


@observer
class Scatter extends React.Component<Props> {
    constructor(props: Props) {
        super(props)
    }

    // normalize points to [0,1] range.
    // @param: points: string||number[][], 
    // @param: currentVariable: [variableName:string][]
    // @param: referencedVariables: {[variableName:string]: {range:[], datatype:"NUMBER"|"STRING"}}
    // return: points: number[][]
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
        let { points } = this.props

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


    d3Draw(margin: number = 20) {
        let { width, height } = this.props
        this.addLasso(width, height)

        let normPoints = this.normPoints

        if (normPoints.length === 0) {
            return <g className='points' />
        }
        var xScale = d3.scaleLinear()
            .domain(d3.extent(normPoints.map(d => d.pos[0])) as [number, number])
            .range([margin, width - margin])

        var yScale = d3.scaleLinear()
            .domain(d3.extent(normPoints.map(d => d.pos[1])) as [number, number])
            .range([margin, height - margin])

        this.d3Links(xScale, yScale, d3.select('g.glyphs'))
        this.d3Glyphs(xScale, yScale, d3.select('g.glyphs'))
        
    }

    d3Glyphs(
        xScale: d3.ScaleLinear<number, number>,
        yScale: d3.ScaleLinear<number, number>,
        selection: d3.Selection<d3.BaseType, {}, HTMLElement, {}>
    ) {
        let normPoints = this.normPoints
        let { selected, colorScales, hoverPointID, hasLink, setHoverID, resetHoverID } = this.props
        let cellWidth = 10, cellHeight = 8, strokeW = 3

        const maxTimeIdx = Math.max(...normPoints.map(p => p.timeIdx))

        let glyphs = selection.selectAll('g.glyph')
            .data(normPoints)
            .join(
                enter => enter.append('g')
                    .attr('class', 'glyph')
                    .style('opacity', d => {
                        if (hasLink) {
                            return 0.1 + d.timeIdx * 0.6 / maxTimeIdx
                        } else {
                            return (hoverPointID === d.idx ? 1 : 0.5)
                        }
                    })
                    .attr('transform', d => `translate(
                    ${xScale(d.pos[0]) - cellWidth / 2}, 
                    ${yScale(d.pos[1]) - cellHeight * d.value.length / 2}
                    )`)
                    .attr('cursor', 'point')
                    .on('mouseover', (d) => setHoverID(d.idx))
                    .on('mouseout', ()=>resetHoverID()),

                update => update
                    .style('opacity', d => {
                        if (hasLink) {
                            return 0.1 + d.timeIdx * 0.6 / maxTimeIdx
                        } else {
                            return (hoverPointID === d.idx ? 1 : 0.5)
                        }
                    })
                    .attr('transform', d => `translate(
                    ${xScale(d.pos[0]) - cellWidth / 2}, 
                    ${yScale(d.pos[1]) - cellHeight * d.value.length / 2}
                    )`),

                exit => exit.remove()
            )

        // add the outlines to indicate stages
        glyphs
            .join(
                enter => enter.append('rect')
                    .attr('class', 'outline')
                    .attr('width', cellWidth)
                    .attr('height', d => cellHeight * d.value.length)
                    .attr('fill', 'none')
                    .style('stroke', d => {
                        let stageKey = selected.find(p=>p.pointIdx.includes(d.idx))?.stageKey
                        return stageKey ? getColorByName(stageKey) : 'none'
                    })
                    .style('stroke-width', strokeW),

                update => update.select('rect.outline')
                    .attr('height', d => cellHeight * d.value.length)
                    .style('stroke', d => {
                        let stageKey = selected.find(p=>p.pointIdx.includes(d.idx))?.stageKey
                        return stageKey ? getColorByName(stageKey) : 'none'
                    }),

                exit => exit.remove()
            )


        // draw glyp
        glyphs.selectAll('rect.val')
            .data(d => d.value)
            .join(
                enter => enter.append('rect')
                    .attr('class', 'val')
                    .attr('width', cellWidth)
                    .attr('height', cellHeight)
                    .attr('y', (_, i) => cellHeight * i)
                    .attr('fill', (v, i) => colorScales[i](v)),

                update => update.attr('y', (_, i) => cellHeight * i)
                    .attr('fill', (v, i) => colorScales[i](v)),

                exit => exit.remove()
            )

    }

    d3Links(
        xScale: d3.ScaleLinear<number, number>,
        yScale: d3.ScaleLinear<number, number>,
        selection: d3.Selection<d3.BaseType, {}, HTMLElement, {}>
    ) {
        let { hasLink } = this.props

        let curveGenerator = d3.line()
            .x((p: NormPoint | any) => xScale(p.pos[0]))
            .y((p: NormPoint | any) => yScale(p.pos[1]))
            .curve(d3.curveMonotoneX)


        selection.selectAll('path.link')
        .data(Object.values(this.patientDict))
        .join(
            enter=>enter.append('path')
            .attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke','gray')
            .attr('d', p=>{
                let pointIds = p.points
                let path= curveGenerator(pointIds.map(id => this.normPoints[id]) as any[])
                return hasLink? path:''
            }),

            update=>update
            .attr('d', p=>{
                let pointIds = p.points
                let path= curveGenerator(pointIds.map(id => this.normPoints[id]) as any[])
                return hasLink? path:''
            }),

            exit=>exit.remove()

        )
    }
    

    addLasso(width: number, height: number) {
        let { selected, updateSelected } = this.props
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

            let thisSelected:number[] = (mylasso.selectedItems() as any).data().map((d:NormPoint) =>d.idx )
            if (thisSelected.length > 0) {
                // if selected nodes are in previous stages

                selected.forEach((g, i) => {
                    g.pointIdx = g.pointIdx.filter(point => !thisSelected.includes(point))
                    if (g.pointIdx.length > 0) {
                        // selected[i] = g // update the group by removing overlapping points
                        updateSelected(i,g)
                    } else {
                        // selected.splice(i, 1) // delete the whole group if all points overlap
                        updateSelected(i, undefined)
                    }
                })



                let stageKey = getUniqueKeyName(selected.length, selected.map(d => d.stageKey))
                let newGroup={
                    stageKey,
                    pointIdx: thisSelected
                }
                updateSelected(selected.length, newGroup)
            }
            // this.d3Draw()

        };


        var mylasso = lasso()
        mylasso.items(d3.selectAll('g.glyph'))
        mylasso.targetArea(lasso_area) // area where the lasso can be started
            .on("start", lasso_start) // lasso start function
            .on("draw", lasso_draw) // lasso draw function
            .on("end", lasso_end); // lasso end function


        svg.call(mylasso)


    }

    componentDidMount() {
        this.d3Draw()
    }

    componentDidUpdate() {
        this.d3Draw()
    }


    render() {
        let { width, height } = this.props
        return <g className='scatter'>
            <rect className='lasso area' width={width} height={height} opacity={0} />
            <g className='glyphs' />
            <g className='links' />
            {/* {this.drawVIS()} */}
        </g>
    }
}




export default Scatter;