import { INormPoint, IRootStore, IPoint } from 'modules/Type'
import React from 'react';
import { observer, inject } from 'mobx-react';
import { computed, action } from 'mobx';

import * as d3 from 'd3';
import lasso from './lasso.js'

import { getColorByName, getUniqueKeyName } from 'modules/UtilityClasses'
import { Tooltip } from 'antd';

type TPatientDict = {
    [patient: string]: {
        patient: string, points: number[]
    }
}// the point id of each patient {paitent:{patient:string, points:id[]}}


interface Props {
    rootStore?: IRootStore,
    width: number,
    height: number,
    hoverPointID: number,
    hasLink: boolean,
    showGlyph: boolean,
    setHoverID: (id: number) => void,
    resetHoverID: () => void,
    updateSelected: (stateKeys: string[], groups: number[][]) => void,
}

// @inject((allStore:any)=>({
//     dataStore: allStore.rootStore.dataStore as IDataStore
// }))
@inject('rootStore')
@observer
class Scatter extends React.Component<Props> {
    public cellWidth = 10;
    
    @computed
    get patientDict() {
        const { points } = this.props.rootStore!.dataStore

        const patientDict: TPatientDict = {}
        // get points,each points is one patient at one timepoint
        points.forEach((point, pointIdx) => {
            const { patient } = point
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
    get maxTimeIdx(): number {
        const { normPoints } = this.props.rootStore!.dataStore
        const maxTimeIdx = Math.max(...normPoints.map(p => p.timeIdx))
        return maxTimeIdx
    }
    @computed
    get cellHeight(): number {
        const { normPoints } = this.props.rootStore!.dataStore
        const cellHeight = Math.min(7, 40 / normPoints[0].value.length)
        return cellHeight
    }

    @action
    toggleSelectID(id: number) {
        const { resetHoverID, setHoverID, hoverPointID } = this.props
        if (id === hoverPointID) resetHoverID()
        else setHoverID(id)
    }

    generateGradients() {
        const maxTimeIdx = this.maxTimeIdx

        const graySclae = d3.interpolate('#eee', '#333')

        const gradients: JSX.Element[] = []
        for (let i = 0; i < maxTimeIdx; i++) {
            const grad = <linearGradient id={`grad${i + 1}`} key={`grad${i + 1}`}>
                <stop offset="0%" style={{ stopColor: "#eee" }} />
                <stop offset="100%" style={{ stopColor: graySclae((i + 1) / maxTimeIdx) }} />
            </linearGradient>
            gradients.push(grad)
        }

        return gradients
    }

    drawScatterPlot(margin: number = 20) {
        const { width, height } = this.props
        const { normPoints } = this.props.rootStore!.dataStore
        this.addLasso(width, height)


        if (normPoints.length === 0) {
            return <g className='points' />
        }
        var xScale = d3.scaleLinear()
            .domain(d3.extent(normPoints.map(d => d.pos[0])) as [number, number])
            .range([margin, width - margin])

        var yScale = d3.scaleLinear()
            .domain(d3.extent(normPoints.map(d => d.pos[1])) as [number, number])
            .range([margin, height - margin])

        const circles = this.drawPoints(xScale, yScale),
            links = this.drawLinks(xScale, yScale)

        return [links, circles]
    }

    drawPoints(xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) {
        const { showGlyph } = this.props
        const { normPoints, pointGroups } = this.props.rootStore!.dataStore
        const { hasLink, resetHoverID, setHoverID, hoverPointID } = this.props
        const r = 5


        const maxTimeIdx = this.maxTimeIdx

        var circles = normPoints.map((normPoint) => {
            const id = normPoint.idx
            const groupIdx = Object.values(pointGroups).findIndex(p => p.pointIdx.includes(id))
            const stateColor = groupIdx > -1 ? getColorByName(Object.keys(pointGroups)[groupIdx]) : 'none'
            // let opacity = hasLink ? 0.1 + normPoint.timeIdx * 0.6 / maxTimeIdx : (hoverPointID==-1?1: (hoverPointID===normPoint.idx?1:0.5))
            const opacity = hasLink ? 0.1 + normPoint.timeIdx * 0.6 / maxTimeIdx : 0.5
            const glyph = this.drawGlyph(normPoint, stateColor, opacity)

            const circle = <circle
                cx={this.cellWidth / 2}
                cy={this.cellHeight * normPoint.value.length / 2}
                fill={stateColor} r={r} stroke="white" strokeWidth="1" opacity={opacity}
            />

            const tooltipTitle = <div>
                <span>patient: <b>{normPoint.patient}</b></span>
                <br />
                <span>state: <b>{Object.keys(pointGroups)[groupIdx]}</b></span>
                <br />
                <span>timepoint: {normPoint.timeIdx}</span>
                <br />
                {normPoint.value.map((v, i) => {
                    const variableID = this.props.rootStore!.dataStore.currentNonPatientVariables[i]
                    const {name} = this.props.rootStore!.dataStore.referencedVariables[variableID]
                    return <span key={i}>
                        {name}: <b>{v}</b>
                        <br />
                    </span>
                })}
            </div>

            return <Tooltip title={tooltipTitle} trigger='click' destroyOnHidden key={id} style={{zIndex: 100000000001}}>
                <g
                    transform={`translate(
                        ${xScale(normPoint.pos[0]) - this.cellWidth / 2}, 
                        ${yScale(normPoint.pos[1]) - this.cellHeight * normPoint.value.length / 2}
                    )`}
                    className='glyph'
                    id={id.toString()}
                    key={id}
                    onClick={() => this.toggleSelectID(id)}
                    cursor='pointer'
                >
                    {showGlyph ? glyph : circle}
                </g>
            </Tooltip>

        })

        return <g className='circles' key="circles">{circles}</g>
    }

    drawGlyph(normPoint: INormPoint, stateColor: string, opacity: number) {
        const strokeW = 2
        const { cellWidth, cellHeight } = this
        const pointCol = normPoint.value.map((v, rowIdx) => {
            const fill = this.props.rootStore!.dataStore.colorScales[rowIdx](v) || 'gray'
            return <rect key={rowIdx}
                width={cellWidth} height={cellHeight}
                y={rowIdx * cellHeight}
                fill={fill}
                stroke='gray'
                opacity={opacity}
                strokeOpacity={1}
            />
        })
        const outline = <rect fill='none'
            key={'stateOutline'}
            stroke={stateColor} strokeWidth={3}
            x={-strokeW / 2} y={-strokeW / 2}
            width={cellWidth + strokeW} height={normPoint.value.length * cellHeight + strokeW}
        />
        return [...pointCol, outline]
    }


    drawLinks(xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>) {

        const { hasLink } = this.props
        const { normPoints } = this.props.rootStore!.dataStore
        if (!hasLink) return <g className="nolines" key='links' />

        const curveGenerator = d3.line()
            .x((p: INormPoint | any) => xScale(p.pos[0]))
            .y((p: INormPoint | any) => yScale(p.pos[1]))
            .curve(d3.curveMonotoneX)



        const curves = Object.keys(this.patientDict).map(patient => {
            const pointIds = this.patientDict[patient].points
            const pathPoints = pointIds
                .map(id => normPoints[id])
                .sort((a, b) => a.timeIdx - b.timeIdx)


            const path: string = curveGenerator(pathPoints as any[]) || ''
            return <path
                key={patient}
                d={path}
                fill='none'
                stroke='gray'
                // stroke={`url(#grad${pathPoints.length-1})`}
                strokeWidth='1'
                className='curve'
            />
        })

        return <g className="lines" key='links' opacity={0.4}>
            {curves}
        </g>


    }

    addLasso(width: number, height: number) {
        const { updateSelected } = this.props
        const { pointGroups } = this.props.rootStore!.dataStore
        // lasso draw
        d3.selectAll('g.lasso').remove()
        var svg = d3.select('svg.scatter')
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

            const currentSelected = (mylasso.selectedItems() as any)._groups[0].map((d: any): number => parseInt(d.attributes.id.value))


            if (currentSelected.length > 0) {
                const stateKeys: string[] = [], groups = [] // groups that need  to be updated
                // if selected nodes are in previous states

                Object.keys(pointGroups).forEach((stateKey, i) => {
                    const g = pointGroups[stateKey]
                    const remainPoints = g.pointIdx.filter((point: number) => !currentSelected.includes(point))
                    stateKeys.push(stateKey)
                    if (remainPoints.length > 0) {

                        groups.push(remainPoints)
                    } else {
                        // selected.splice(i, 1) // delete the whole group if all points overlap
                        groups.push([])
                    }
                })



                const newStateKey = getUniqueKeyName(Object.keys(pointGroups).length, Object.keys(pointGroups))

                stateKeys.push(newStateKey)
                groups.push(currentSelected)

                updateSelected(stateKeys, groups)
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

        const { width, height } = this.props
        return <svg className='scatter' width="100%" height={`${height }px`}>
            <g className='scatter'>
            <defs>
                {this.generateGradients()}
            </defs>
            <rect className='lasso area' width={width} height={height} opacity={0} />
            {this.drawScatterPlot()}
        </g>
        </svg>
    }
}




export default Scatter;