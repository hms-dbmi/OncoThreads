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
    sampleFeatureDomains: (string | number | boolean)[][],
    setHoverID: (id: number) => void,
    resetHoverID: () => void,
    removeVariable: (id: string) => void,
}


@observer
class StateBlock extends React.Component<Props> {
    public horizonGap = 15;
    minCellHeight = 35;
    topMargin = 15;
    fontHeight = 15;
    strokeW = 4;
    rowVerticalGap = 35; // 
    blockHeightRatio = 0.5; // the heigh of block : the height of whole chart 
    maxNameColRatio = 0.15; // the max width of feature name col / the width of the state identification panel
    nameChartGap = 20; // the horizontal distance between feature name col and state charts
    axisWidth = 50;      // width of the right-most y axis label 
    scoreDigits = 2;
    rightMargin = 5;

    constructor(props: Props) {
        super(props)
        this.drawAllStates = this.drawAllStates.bind(this)
        this.drawOneState = this.drawOneState.bind(this)
        this.drawTimeDist = this.drawTimeDist.bind(this)
        this.drawYAxis = this.drawYAxis.bind(this)

    }
    @computed
    get maxNameColWidth() {
        return this.props.width * this.maxNameColRatio
    }
    @computed
    get nameColWidth(): number {

        // let scoreWidth = getTextWidth((0.000).toFixed(this.scoreDigits) + '  X', this.fontHeight)
        let scoreWidth = getTextWidth('  X', this.fontHeight)
        let nameWidth = Math.max(...this.props.importanceScores.map(
            d => getTextWidth(d['name'], this.fontHeight)
        ))
        nameWidth = Math.min(nameWidth, this.maxNameColWidth)

        return scoreWidth + nameWidth
    }
    @computed
    get wholeHorizonGap(): number {
        let { pointGroups, points } = this.props
        let allSelected = Object.values(pointGroups).map(d => d.pointIdx).flat()

        let hasLeftPoints = allSelected.length < points.length
        // let wholeHorizonGap = (hasLeftPoints ? Object.keys(pointGroups).length : Object.keys(pointGroups).length - 1) * (this.horizonGap+2*this.rowVerticalGap)  + 2*this.rowVerticalGap
        let wholeHorizonGap = (hasLeftPoints ? Object.keys(pointGroups).length : Object.keys(pointGroups).length - 1) * this.horizonGap
        return wholeHorizonGap
    }
    @computed
    get cellWidth(): number {
        let { width, points } = this.props
        let cellWidth = (width - this.nameColWidth - this.wholeHorizonGap - this.rightMargin - this.nameChartGap - this.axisWidth) / points.length
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
        let cellHeight = Math.max(
            (height - this.fontHeight - this.topMargin) * this.blockHeightRatio / attrNum - this.strokeW - this.rowVerticalGap,
            this.minCellHeight
        )

        return cellHeight
    }

    @computed
    get maxTimeIdx(): number {
        let { points } = this.props
        let maxTimeIdx = Math.max(...points.map(p => p.timeIdx))
        return maxTimeIdx
    }

    @computed
    get timeStepHeight(): number {
        let { height } = this.props

        const timeStepHeight = (height - this.fontHeight - this.topMargin) * (1 - this.blockHeightRatio) / (this.maxTimeIdx + 1)

        return timeStepHeight
    }

    drawAllStates() {
        let { points, pointGroups, stateLabels } = this.props
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
                let stateName = cropText(stateLabels[stateKey] || stateKey, fontHeight, 700, g.pointIdx.length*this.cellWidth)

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

        let allStates = <g className='state' key='allStates' transform={`translate(${this.nameColWidth + this.nameChartGap}, 0)`}>
            {stateBlocks}
        </g>

        let featureNameRows = this.featureNameRows()
        let timeDistLabelWidth = getTextWidth('Distribution', this.fontHeight) + 10

        let timeDistLabel = <g
            className="timeDistLable labelButton"
            key="timeDistLable"
            transform={`translate(${this.nameColWidth / 2}, ${this.attrNum * (this.cellHeight + this.rowVerticalGap) + this.fontHeight + this.topMargin + this.maxTimeIdx * this.timeStepHeight}) rotate(-90 0 0)`}
        >
            <rect
                width={timeDistLabelWidth} height={this.fontHeight * 2.2}
                rx="3"
                stroke="gray"
                fill="white"
            />
            <text y={this.fontHeight} textAnchor="middle" x={timeDistLabelWidth / 2}>
                Temporal
            </text>
            <text y={2 * this.fontHeight} textAnchor="middle" x={timeDistLabelWidth / 2}>
                Distribution
            </text>
        </g>

        return [featureNameRows, timeDistLabel, allStates]
    }

    // draw the block of one state
    drawOneState(points: IPoint[], stateKey: string) {
        if (points.length === 0) {
            return []
        }


        let block = this.drawBlock(points, stateKey)

        let timeDist = this.drawTimeDist(points, stateKey)

        return [block, timeDist]

    }

    drawCellDistContinues(values: (string | boolean | number)[], stateColor: string, rowIdx: number, getRectHeight: (domain: any[], value: any) => number, getRectY: (domain: any[], value: any) => number) {
        let domain = this.props.sampleFeatureDomains[rowIdx]
        let maxHeight = 0

        let keyList: (boolean | string | number)[] = []
        let valueGroups: { key: boolean | string | number, patientNum: number }[] = []
        this.reorderRowValues(values).forEach(value => {
            let idx = keyList.indexOf(value)
            if (idx > -1) {
                valueGroups[idx]['patientNum'] += 1
            } else {
                keyList.push(value)
                valueGroups.push({
                    key: value,
                    patientNum: 1
                })
            }
        })

        let pathString = `M 0, ${this.cellHeight}`, currentPos = [0, 0]

        valueGroups.forEach(d => {
            const { key, patientNum } = d
            const binWidth = this.cellWidth * patientNum, binHeight = getRectHeight(domain, key)
            maxHeight = Math.max(maxHeight, binHeight)
            pathString += `l${0},${-binHeight - currentPos[1]} l ${binWidth}, ${0}`
            currentPos = [binWidth + currentPos[0], -1 * binHeight]
        })
        pathString += `l 0 ${-1 * currentPos[1]} z`

        let row = <path d={pathString} fill='lightgray' />

        return { row, maxHeight }
    }

    drawCellDistCate(values: (string | boolean | number)[], stateColor: string, rowIdx: number, getRectHeight: (domain: any[], value: any) => number, getRectY: (domain: any[], value: any) => number) {
        let domain = this.props.sampleFeatureDomains[rowIdx]
        let maxHeight = 0

        let keyList: (boolean | string | number)[] = []
        let valueGroups: { key: boolean | string | number, patientNum: number }[] = []
        this.reorderRowValues(values).forEach(value => {
            let idx = keyList.indexOf(value)
            if (idx > -1) {
                valueGroups[idx]['patientNum'] += 1
            } else {
                keyList.push(value)
                valueGroups.push({
                    key: value,
                    patientNum: 1
                })
            }
        })

        let rowBars: JSX.Element[] = [], currentX = 0

        valueGroups.forEach(d => {
            const { key, patientNum } = d
            const binWidth = this.cellWidth * patientNum, binHeight = getRectHeight(domain, key), offsetY = getRectY(domain, key)
            maxHeight = Math.max(maxHeight, binHeight)

            const oneCate = <rect className={`${key}`} key={`${key}`} x={currentX} width={binWidth} height={binHeight} y={offsetY} fill="lightgray" />
            rowBars.push(oneCate)
            currentX += binWidth
        })

        const row = <g className="rowBars">{rowBars}</g>

        return { row, maxHeight }
    }



    drawBlock(points: IPoint[], stateKey: string) {
        let stateColor = getColorByName(stateKey)
        // points = this.reorderPoints(points)
        let { setHoverID, resetHoverID, sampleFeatureDomains } = this.props
        if (points.length === 0) return <g key="block" className="block" />
        let rows = sampleFeatureDomains.map((domain, rowIdx) => {
            let values = points.map(p => p.value[rowIdx])
            let getRectHeight: (domain: any[], value: any) => number, getRectY: (domain: any[], value: any) => number,
                domainTextArr = summarizeDomain(values.filter(v => v !== undefined) as number[] | string[] | boolean[]),
                cellText: string, cellTextFull: string

            //crop domain text
            let domainTextArrCroped = domainTextArr
                .map(d => cropText(
                    d, this.fontHeight, 700, 
                    (this.cellWidth * points.length - getTextWidth('~', this.fontHeight) * (domainTextArr.length-1)) / domainTextArr.length
                )),
                row: JSX.Element, maxHeight = this.cellHeight

            if (typeof (domain[0]) === 'number') {
                getRectHeight = (domain: any[], value: any): number => {
                    if (domain[0]===domain[1]){
                        return this.cellHeight
                    } else return (value - domain[0]) / (domain[1] - domain[0]) * this.cellHeight
                }

                getRectY = (domain: any[], value: any): number => {
                    if (domain[0]===domain[1]){
                        return 0
                    } else return this.cellHeight - (value - domain[0]) / (domain[1] - domain[0]) * this.cellHeight
                }
                cellText = domainTextArrCroped.join('~')
                cellTextFull = domainTextArr.join('~')

                let r = this.drawCellDistContinues(values, stateColor, rowIdx, getRectHeight, getRectY)
                row = r['row']
                maxHeight = r['maxHeight']

            } else {
                getRectHeight = (domain: any[], value: any): number => {
                    if (domain.length===0) {
                        console.error('domain length cannot be 0')
                        return this.cellHeight
                    }
                    return 1 / domain.length * this.cellHeight
                }
                getRectY = (domain: any[], value: any): number => {
                    if (domain.indexOf(value)===-1) {
                        console.error(`value ${value} is not in domain ${domain}`)
                        return 0
                    }else return domain.indexOf(value) / domain.length * this.cellHeight
                }
                cellText = domainTextArrCroped.join(', ')
                cellTextFull = domainTextArr.join(',')
                row = this.drawCellDistCate(values, stateColor, rowIdx, getRectHeight, getRectY)['row']
            }

            if (getTextWidth(cellText, this.fontHeight) >  this.cellWidth*points.length){
                cellText = '..'
            }
            
            let cellTooltip: JSX.Element = <div> {cellTextFull}</div>

            if (maxHeight < 0.2 * this.cellHeight) {
                cellTooltip = <svg width={this.cellWidth * points.length} height={this.cellHeight + 15}>
                    <g className="scaledChart" transform={`scale(${1}, ${this.cellHeight / maxHeight}) translate(${0}, ${-1 * (this.cellHeight - maxHeight)})`}>
                        {row}
                    </g>
                    <text fill="white" y={this.cellHeight + this.fontHeight}>{cellTextFull}</text>
                </svg>
            }


            return <Tooltip title={cellTooltip} key={`row_${rowIdx}`} destroyTooltipOnHide mouseEnterDelay={0.8} overlayStyle={{ width: "auto", maxWidth: "none" }}>
                <g className={`row_${rowIdx}`} cursor="pointer">
                    <g transform={`translate(${0}, ${rowIdx * (this.cellHeight + this.rowVerticalGap)})`}>
                        {row}
                    </g>
                    <line className='rowBG'
                        fill='none'
                        // stroke='gray'
                        stroke={stateColor}
                        strokeWidth={this.strokeW}
                        y1={(this.cellHeight + this.rowVerticalGap) * rowIdx + this.cellHeight + this.strokeW / 2}
                        y2={(this.cellHeight + this.rowVerticalGap) * rowIdx + this.cellHeight + this.strokeW / 2}
                        x1={0}
                        x2={this.cellWidth * points.length}
                    />
                    <text y={(this.cellHeight + this.rowVerticalGap) * rowIdx + this.cellHeight + this.strokeW + this.fontHeight}>
                        {cellText}
                    </text>
                </g>
            </Tooltip>
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
        // return <g className='timeDist' key="timeDist" transform={`translate(0, ${this.cellHeight * this.attrNum + this.topMargin})`}>
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
        return <g className='timeDist' key="timeDist" transform={`translate(0, ${(this.cellHeight + this.rowVerticalGap) * this.attrNum + this.topMargin})`}>
            <path
                d={pathString as string}
                fill={color}
                stroke={color}
                strokeWidth='2'
            />
        </g>

    }

    featureNameRows() {
        let { importanceScores } = this.props

        let rows = importanceScores.map((d, i) => {
            let { score, name, id } = d
            let cropName = cropText(name, 12, 400, this.maxNameColWidth)
            let featureNameComponent = cropName.length === name.length ?
                <g opacity={Math.max(0.3, score)} cursor="pointer" className="feature name">
                    <text >
                        {cropName}
                    </text>
                    <text y={12}>{score.toFixed(this.scoreDigits)}</text>
                </g>
                : <Tooltip title={name} destroyTooltipOnHide>
                    <g opacity={Math.max(0.3, score)} cursor="pointer" className="feature name">
                        <text >
                            {cropName}
                        </text>
                        <text y={12}>{score.toFixed(this.scoreDigits)}</text>
                    </g>
                </Tooltip>

            return <g key={name} transform={`translate(0, ${(this.cellHeight + this.rowVerticalGap) * (i + 0.8)})`}>
                {featureNameComponent}
                <text
                    x={this.nameColWidth} textAnchor="end" cursor="pointer"
                    onClick={() => { this.props.removeVariable(id) }}
                >
                    X
            </text>

            </g>
        })

        let impLable = 'scores', impLableWidth = getTextWidth(impLable, this.fontHeight) + 10
        return <g className='importanceScores labelButton' transform={`translate(${0}, ${this.fontHeight - this.rowVerticalGap})`} key='importanceScores'>

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

    drawYAxis(){
        const tickWidth = 3
        const {sampleFeatureDomains, width} = this.props, offsetX = width - this.axisWidth, offsetY = this.fontHeight
        let axes = sampleFeatureDomains.map((domain, featurenIdx)=>{
            const tickGap = this.cellHeight/ domain.length, labelHeight = Math.min(this.fontHeight, tickGap)

            if (typeof domain[0] === "number"){
                return <g key={featurenIdx} className="y_axis" transform={`translate(0, ${featurenIdx* (this.cellHeight+this.rowVerticalGap)})`}>
                    <line x1={0} y1={0} x2={0} y2={this.cellHeight+this.strokeW} className="axis" stroke="black"/>
                    <line x1={0} y1={0} x2={tickWidth} y2={0} className="tick" stroke="black"/>
                    <line x1={0} y1={this.cellHeight} x2={tickWidth} y2={this.cellHeight} className="tick" stroke="black"/>
                    <text x={tickWidth*2} y={labelHeight}>{domain[1]}</text>
                    <text x={tickWidth*2} y={this.cellHeight + this.strokeW}>{domain[0]}</text>
                </g>
            }else{
                const axisLabel = domain.map((d, i)=>{
                    return <g key={`${d}_${i}`} transform={`translate(${0}, ${i* tickGap})`}>
                        <line x1={0} y1={0} x2={tickWidth} y2={0} className="tick" stroke="black"/>
                        <text x= {tickWidth*2} y={ (labelHeight+tickGap)/2} fontSize={labelHeight} >{d}</text>
                    </g>
                }) 
                return <g key={featurenIdx} className="y_axis" transform={`translate(0, ${featurenIdx* (this.cellHeight+this.rowVerticalGap)})`}>
                    <line x1={0} y1={0} x2={0} y2={this.cellHeight+this.strokeW} className="axis" stroke="black"/>
                    {axisLabel}
                    <line x1={0} y1={this.cellHeight} x2={tickWidth} y2={this.cellHeight+this.strokeW} className="tick" stroke="black"/>
                </g>
            }
        })
        return <g className="axes" transform={`translate(${offsetX}, ${offsetY})`}>
            {axes}
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

    reorderRowValues(values: (string | number | boolean)[]) {
        return values.sort((a: string | number | boolean, b: string | number | boolean) => {
            let dif = 0
            if (a !== b) {
                dif = a > b ? 1 : -1
            }
            return dif
        })
    }

    render() {
        return <g className='stateSummary' key='stateSummary'>
            {this.drawAllStates()}
            {this.drawYAxis()}
        </g>
    }
}



export default StateBlock;