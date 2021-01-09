import React from 'react';
import { observer } from 'mobx-react';
import * as d3 from "d3"

import { IPoint, TPointGroups } from 'modules/Type'
import { getColorByName, getTextWidth, cropText, summarizeDomain } from 'modules/TemporalHeatmap/UtilityClasses/'
import { computed } from 'mobx';

import { IImportantScore } from './index'

import { Tooltip } from 'antd'


interface Props {
    points: IPoint[],
    importanceScores: IImportantScore[],
    stateLabels: { [key: string]: string },
    width: number,
    height: number,
    hoverPointID: number,
    pointGroups: TPointGroups,
    colorScales: Array<(value: string | number | boolean) => string>,
    featureDomains: (string|number|boolean)[][],
    setHoverID: (id: number) => void,
    resetHoverID: () => void,
    removeVariable: (name: string) => void,
}


@observer
class StateBlock extends React.Component<Props> {
    public horizonGap = 15;
    maxCellHeight = 20;
    verticalGap = 10;
    fontHeight = 15;
    strokeW = 4;
    cellVerticalGap = 25;
    blockHeightRatio = 0.5; // the heigh of block : the height of whole chart 
    // scoreRatio = 0.1 // the width of importance score col : the width of the whole chart
    maxNameColWidth = 40;
    scoreDigits = 2;
    rightMargin = 5;

    constructor(props: Props) {
        super(props)
        this.drawAllStates = this.drawAllStates.bind(this)
        this.drawOneState = this.drawOneState.bind(this)
        this.drawTimeDist = this.drawTimeDist.bind(this)

    }
    @computed
    get nameColWidth(): number {
        let { width } = this.props
        let scoreWidth = getTextWidth((0.000).toFixed(this.scoreDigits) + '  X', this.fontHeight)
        let nameWidth = Math.max(...this.props.importanceScores.map(
            d => getTextWidth(d['name'], this.fontHeight)
        ))
        nameWidth = Math.min(nameWidth, this.maxNameColWidth)
        // console.info('colwidth', scoreWidth, nameWidth)
        // console.info(Object.keys(this.props.importanceScores))
        return scoreWidth + nameWidth + this.cellVerticalGap * 2
    }
    @computed
    get wholeHorizonGap(): number {
        let { pointGroups, points } = this.props
        let allSelected = Object.values(pointGroups).map(d => d.pointIdx).flat()

        let hasLeftPoints = allSelected.length < points.length
        // let wholeHorizonGap = (hasLeftPoints ? Object.keys(pointGroups).length : Object.keys(pointGroups).length - 1) * (this.horizonGap+2*this.cellVerticalGap)  + 2*this.cellVerticalGap
        let wholeHorizonGap = (hasLeftPoints ? Object.keys(pointGroups).length : Object.keys(pointGroups).length - 1) * this.horizonGap + 2 * this.cellVerticalGap
        return wholeHorizonGap
    }
    @computed
    get cellWidth(): number {
        let { width, points } = this.props
        let cellWidth = (width - this.nameColWidth - this.wholeHorizonGap - this.rightMargin) / points.length
        return cellWidth
    }

    @computed
    get attrNum(): number {
        let { points } = this.props
        let attrNum = points[0].value.length
        return attrNum
    }

    @computed
    get cellHeight(): number {
        let { height } = this.props
        let attrNum = this.attrNum
        let cellHeight = (height - this.fontHeight - this.verticalGap) * this.blockHeightRatio / attrNum - this.strokeW - this.cellVerticalGap

        return cellHeight
    }

    @computed
    get maxTimeIdx(): number {
        let { points, height } = this.props
        let maxTimeIdx = Math.max(...points.map(p => p.timeIdx))
        return maxTimeIdx
    }

    @computed
    get timeStepHeight(): number {
        let { points, height } = this.props

        const timeStepHeight = (height - this.fontHeight - this.verticalGap) * (1 - this.blockHeightRatio) / (this.maxTimeIdx + 1)

        return timeStepHeight
    }

    drawAllStates() {
        let { points, pointGroups, stateLabels, height } = this.props
        if (points.length === 0) return <g />

        let offsetX = 0

        let stateBlocks: JSX.Element[] = []
        let allSelected = Object.values(pointGroups).map(d => d.pointIdx).flat()
        let hasLeftPoints = allSelected.length < points.length

        let fontHeight = this.fontHeight

        if (Object.keys(pointGroups).length > 0) {


            Object.values(pointGroups).forEach(g => {
                let { stateKey, pointIdx } = g
                let stateColor = getColorByName(stateKey)
                let stateName = stateLabels[stateKey] || stateKey

                stateBlocks.push(
                    <g key={stateKey} className={`state${stateKey}`} transform={`translate(${offsetX}, 0)`}>

                        <rect fill={stateColor} className='labelBG'
                            width={Math.max(getTextWidth(stateName, 14), 20)} height={fontHeight}
                            opacity={0.5}
                            stroke={stateColor}
                        />
                        <text alignmentBaseline="hanging">{stateName}</text>

                        

                        <g transform={`translate(0, ${fontHeight})`} className='oneState' >
                            {this.drawOneState(pointIdx.map(id => points[id]), stateKey)}
                        </g>

                    </g>)

                offsetX += this.cellWidth * pointIdx.length + this.horizonGap
            })


            if (hasLeftPoints) {
                let leftNodes = points.map((_, i) => i)
                    .filter(i => !allSelected.includes(i))

                stateBlocks.push(
                    <g key={'undefined'} className={`undefined`} transform={`translate(${offsetX}, 0)`}>
                        <text alignmentBaseline="hanging">undefined</text>
                        <g transform={`translate(0, ${fontHeight})`} className='oneState'>
                            {this.drawOneState(leftNodes.map(id => points[id]), 'undefined')}
                        </g>
                    </g>)
            }

        } else {
            //if no pointGroups states, treat all points at one state
            stateBlocks.push(
                <g key='undefined' className={`undefined`} transform={`translate(${offsetX}, 0)`}>
                    <text alignmentBaseline="hanging">undefined</text>
                    <g transform={`translate(0, ${fontHeight})`} className='onsState'>
                        {this.drawOneState(points, 'undefined')}
                    </g>
                </g>
            )
        }

        let allStates = <g className='state' key='allStates' transform={`translate(${this.nameColWidth}, 0)`}>
            {stateBlocks}
        </g>

        let featureNameRows = this.featureNameRows()
        let timeDistLabelWidth = getTextWidth('Distribution', this.fontHeight) + 10

        let timeDistLabel = <g
            className="timeDistLable labelButton"
            key="timeDistLable"
            transform={`translate(${this.nameColWidth / 2}, ${this.attrNum * (this.cellHeight + this.cellVerticalGap) + this.fontHeight + this.verticalGap + this.maxTimeIdx * this.timeStepHeight}) rotate(-90 0 0)`}
        >
            <rect
                width={timeDistLabelWidth} height={this.fontHeight * 2.2}
                rx="3"
                stroke="gray"
                fill="white"
            />
            <text y={this.fontHeight} textAnchor="middle" x={timeDistLabelWidth/2}>
                Temporal 
            </text>
            <text y={2*this.fontHeight} textAnchor="middle" x={timeDistLabelWidth/2}>
                Distribution 
            </text>
        </g>

        return [featureNameRows, timeDistLabel, allStates]
    }

    // draw the block of one state
    drawOneState(points: IPoint[], stateKey: string) {
        if (points.length == 0) {
            return []
        }


        let block = this.drawBlock(points, stateKey)

        let timeDist = this.drawTimeDist(points, stateKey)

        return [block, timeDist]

    }

    drawBlock(points: IPoint[], stateKey: string) {
        let stateColor = getColorByName(stateKey)
        points = this.reorderPoints(points)
        let { setHoverID, resetHoverID, featureDomains } = this.props
        if (points.length==0) return <g key="block" className="block" />
        let rows = featureDomains.map((domain,rowIdx)=>{
            let values = points.map(p=>p.value[rowIdx])
            let getRectHeight : (domain:any[], value:any)=>number, getRectY : (domain:any[], value:any)=>number, 
                domainTextArr = summarizeDomain(values.filter(v=>v!==undefined) as number[]|string[]|boolean[]),
                cellText:string

            //crop domain text
            domainTextArr = domainTextArr.map(d=>cropText(d, this.fontHeight, 700, this.cellWidth*points.length/domainTextArr.length))

            if (typeof (domain[0]) ==='number' ){
                getRectHeight = (domain:any[], value:any):number=>(value-domain[0])/(domain[1]-domain[0])*this.cellHeight 
                getRectY = (domain:any[], value:any):number=>this.cellHeight - (value-domain[0])/(domain[1]-domain[0])*this.cellHeight 
                cellText = domainTextArr.join('~')
                
            }else{
                getRectHeight = (domain:any[], value:any):number=>1/domain.length*this.cellHeight
                getRectY = (domain:any[], value:any):number=>domain.indexOf(value)/domain.length*this.cellHeight
                cellText = domainTextArr.join(', ')
            }

            let row = values.map((v, pointIdx)=>{
                if (v==undefined) return 
                return <rect key={`point_${pointIdx}`} 
                    width={this.cellWidth} 
                    height={getRectHeight(domain, v)}
                    x={this.cellWidth * pointIdx} y={rowIdx* (this.cellHeight+this.cellVerticalGap) + getRectY(domain, v)}
                    fill = {stateColor}
                />
            })

            return <g key={`row_${rowIdx}`} className={`row_${rowIdx}`}>
                 <line className='rowBG'
                            fill='none'
                            stroke='gray'
                            strokeWidth={this.strokeW}
                            y1={ (this.cellHeight + this.cellVerticalGap)* rowIdx + this.cellHeight + this.strokeW/2} 
                            y2={ (this.cellHeight + this.cellVerticalGap) * rowIdx + this.cellHeight + this.strokeW/2} 
                            x1={0}
                            x2={this.cellWidth * points.length + this.horizonGap}
                        />
                {row}
                <text y={(this.cellHeight + this.cellVerticalGap)* rowIdx + this.cellHeight + this.strokeW + this.fontHeight}>
                    {cellText}
                </text>
            </g>
        })

        return <g key="block" className="block"> {rows} </g>

    }

    // draw the time dist of one identified state
    drawTimeDist(points: IPoint[], stateKey: string) {

        let dist = [...Array(this.maxTimeIdx + 1)].map(d => 0)
        points.forEach(point => {
            let timeIdx = point.timeIdx
            dist[timeIdx] += 1
        })

        // let charPoints = dist.map((d,i)=>`L ${d*this.cellWidth} ${i * this.timeStepHeight}`)
        // return <g className='timeDist' key="timeDist" transform={`translate(0, ${this.cellHeight * this.attrNum + this.verticalGap})`}>
        //     <path 
        //         d= {`M 0 0 ${charPoints.join(' ')} L ${0} ${this.maxTimeIdx* this.timeStepHeight} z`}
        //         fill='lightgray'
        //         stroke = 'lightgray'
        //         strokeWidth = '2'
        //     />
        // </g>


        var lineGene = d3.line().curve(d3.curveMonotoneY);
        let pathString = lineGene(
            dist.map(
                (d, i) => [d * this.cellWidth, i * this.timeStepHeight]
            )
        )

        pathString = `${pathString} L ${0} ${this.maxTimeIdx * this.timeStepHeight} L ${0} ${0} z`
        let color = getColorByName(stateKey)
        return <g className='timeDist' key="timeDist" transform={`translate(0, ${ (this.cellHeight + this.cellVerticalGap) * this.attrNum + this.verticalGap})`}>
            <path
                d={pathString as string}
                fill={color}
                stroke={color}
                strokeWidth='2'
            />
        </g>

    }

    featureNameRows() {
        let { importanceScores, width } = this.props
        let rows = importanceScores.map((d, i) => {
            let { score, name } = d
            let cropName = cropText(name, this.fontHeight, 400, this.maxNameColWidth)
            let featureNameComponent = cropName.length === name.length ?
                <text opacity={Math.max(0.3, score)} cursor="pointer">
                    {cropName} {' '} {score.toFixed(this.scoreDigits)}
                </text>
                : <Tooltip title={name}>
                    <text opacity={Math.max(0.3, score)} cursor="pointer">
                        {cropName} {' '} {score.toFixed(this.scoreDigits)}
                    </text>
                </Tooltip>
                
            return <g key={name} transform={`translate(0, ${ (this.cellHeight+this.cellVerticalGap) * (i + 0.8)})`}>
                {featureNameComponent}
                <text
                    x={this.nameColWidth - this.cellVerticalGap * 2} textAnchor="end" cursor="pointer"
                    onClick={() => { this.props.removeVariable(name) }}
                >
                    X
            </text>

            </g>
        })

        let impLable = 'scores', impLableWidth = getTextWidth(impLable, this.fontHeight) + 10
        return <g className='importanceScores labelButton' transform={`translate(${0}, ${this.fontHeight - this.cellVerticalGap})`} key='importanceScores'>

            <rect width={impLableWidth} height={this.fontHeight * 1.2} rx={3}
                x={this.nameColWidth / 2 - impLableWidth / 2}
                y={-this.fontHeight}
                fill="white" stroke="gray"
            />
            <text x={this.nameColWidth / 2} textAnchor="middle">
                {impLable}
            </text>
            {rows}
        </g>
    }

    reorderPoints(points: IPoint[]) {
        return [...points].sort((a, b) => {
            let dif = 0
            for (let i = 0; i < a.value.length; i++) {
                if (a.value[i] !== b.value[i]) {
                    dif = a.value[i] > b.value[i] ? 1 : -1
                    break
                }
            }
            return dif
        })
    }

    render() {
        // let legendLabelTransform = `translate(${this.props.width - this.rightMargin * 0.5}, ${this.cellHeight * this.attrNum / 2 + this.fontHeight}) rotate(-90, 0, 0) `
        // let legendLabelWidth = getTextWidth('legend V', this.fontHeight)+20, legendLabelHeight = this.fontHeight * 1.3
        return <g className='stateSummary' key='stateSummary'>
            {this.drawAllStates()}
        </g>
    }
}



export default StateBlock;