import { NormPoint, Point, ReferencedVariables } from 'modules/Type'
import React from 'react';
import { observer } from 'mobx-react';
import { computed } from 'mobx';
import { PCA } from 'ml-pca';
import * as d3 from 'd3';
import { TSelected } from '.';
import lasso from './lasso.js'

import { getColorByName, getUniqueKeyName } from 'modules/TemporalHeatmap/UtilityClasses/'

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
    hoverPointID:number,
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

    @computed
    get maxTimeIdx():number{
        let normPoints = this.normalizePoints
        const maxTimeIdx = Math.max(...normPoints.map(p => p.timeIdx))
        return maxTimeIdx
    }

    generateGradients(){
       let maxTimeIdx = this.maxTimeIdx

       let graySclae = d3.interpolate('#eee','#333')

       let gradients:JSX.Element[] = []
       for(let i =0;i<maxTimeIdx;i++){
           let grad = <linearGradient id={`grad${i}`}>
           <stop offset="0%" style={{stopColor:"#eee"} }/>
           <stop offset="100%" style={{stopColor:graySclae(i/maxTimeIdx)} }/>
           </linearGradient>
           gradients.push(grad)
       }
        
       return gradients
    }

    drawScatterPlot(margin: number = 20) {
        let { width, height } = this.props
        this.addLasso(width, height)

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

        let circles = this.drawPoints(xScale, yScale),
            links = this.drawLinks(xScale, yScale)

        return [links, circles]
    }

    drawPoints(xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) {
        let normPoints = this.normalizePoints
        let { selected, hasLink, resetHoverID, setHoverID, hoverPointID } = this.props
        const r = 5
        const cellWidth =10, cellHeight = 7

        const maxTimeIdx = this.maxTimeIdx

        var circles = normPoints.map((normPoint) => {
            let id = normPoint.idx
            let groupIdx = selected.findIndex(p => p.pointIdx.includes(id))
            let stageColor = groupIdx>-1? getColorByName(selected[groupIdx].stageKey): 'gray'
            let opacity = hasLink ? 0.1 + normPoint.timeIdx * 0.6 / maxTimeIdx : (hoverPointID===normPoint.idx?1:0.5)
            return <g transform={`translate(
                    ${xScale(normPoint.pos[0]) - cellWidth / 2}, 
                    ${yScale(normPoint.pos[1]) - cellHeight * normPoint.value.length / 2}
                    )`}
                    className='glyph'
                    id={normPoint.idx.toString()}
                onMouseEnter={() => setHoverID(id)}
                onMouseLeave={() => resetHoverID()}
                cursor='pointer'
            >
                {this.glyph(normPoint, stageColor, cellWidth, cellHeight, opacity)}
            </g>
        })

        return <g className='circles'>{circles}</g>
    }

    glyph(normPoint: NormPoint, stageColor: string, cellWidth:number, cellHeight:number, opacity:number ) {
        const strokeW = 2
        let pointCol = normPoint.value.map((v, rowIdx) => {
            let fill = this.props.colorScales[rowIdx](v) || 'gray'
            return <rect key={rowIdx}
                width={cellWidth} height={cellHeight}
                y={rowIdx * cellHeight}
                fill={fill}
                stroke='gray'
                opacity={opacity}
                strokeOpacity={1}
            />
        })
        let outline = <rect fill='none'
            key={'stageOutline'}
            stroke={stageColor} strokeWidth={3}
            x={-strokeW/2} y={-strokeW/2} 
            width={cellWidth + strokeW} height={normPoint.value.length * cellHeight + strokeW}
        />
        return [...pointCol, outline]
    }

    drawLinks(xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) {

        let { hasLink } = this.props
        if (!hasLink) return <g className="nolines" key='links' />

        let curveGenerator = d3.line()
            .x((p: NormPoint | any) => xScale(p.pos[0]))
            .y((p: NormPoint | any) => yScale(p.pos[1]))
            .curve(d3.curveMonotoneX)



        let curves = Object.keys(this.patientDict).map(patient => {
            let pointIds = this.patientDict[patient].points
            let pathPoints = pointIds
                .map(id => this.normalizePoints[id])
                .sort((a,b)=>a.timeIdx-b.timeIdx)
            let path:string = curveGenerator(pointIds.map(id => this.normalizePoints[id]) as any[])||''
            return <path
                key={patient}
                d={path}
                fill='none'
                // stroke='gray'
                stroke={`url(#grad${pathPoints.length-1})`}
                strokeWidth='1'
                className='curve'
            />
        })

        return <g className="lines" key='links'>
            {curves}
        </g>


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
            
            let thisSelected = (mylasso.selectedItems() as any)._groups[0].map((d: any): number => parseInt(d.attributes.id.value))
           
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



    render() {
        let { width, height } = this.props
        return <g className='scatter'>
            <defs>
           {this.generateGradients()}
            </defs>
            <rect className='lasso area' width={width} height={height} opacity={0} />
            {this.drawScatterPlot()}
        </g>
    }
}




export default Scatter;