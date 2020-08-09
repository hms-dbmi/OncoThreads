import React from 'react';
import { observer } from 'mobx-react';
import { TSelected } from '.'

import { Point } from 'modules/Type'
import { getColorByName, getTextWidth } from 'modules/TemporalHeatmap/UtilityClasses/'
import { attr } from 'lineupjs/src/renderer/utils';
import { computed } from 'mobx';


interface Props {
    points: Point[],
    importanceScores: number[],
    stageLabels: { [key: string]: string },
    width: number,
    height: number,
    hoverPointID: number,
    selected: TSelected,
    colorScales: Array<(value: string | number | boolean) => string>,
    setHoverID: (id: number) => void,
    resetHoverID: () => void,
}


@observer
class StageBlock extends React.Component<Props> {
    public horizonGap = 15; 
        maxCellHeight = 20; 
        verticalGap = 10; 
        fontHeight = 15; 
        strokeW = 4;
        blockHeightRatio = 0.6 // the heigh of block : the height of whole chart 
        scoreRatio = 0.1 // the width of importance score col : the width of the whole chart

    constructor(props: Props) {
        super(props)
        this.drawAllStates = this.drawAllStates.bind(this)
        this.drawOneState = this.drawOneState.bind(this)
        this.drawTiemDist = this.drawTiemDist.bind(this)

    }
    @computed
    get wholeGap():number{
        let {selected, points} = this.props
        let allSelected = Object.values(selected).map(d => d.pointIdx).flat()

        let hasLeftPoints = allSelected.length < points.length
        let wholeGap = (hasLeftPoints ? Object.keys(selected).length : Object.keys(selected).length - 1) * (this.horizonGap+2*this.strokeW)  + 2*this.strokeW
        return wholeGap
    }
    @computed
    get cellWidth():number{
        let {width, points} = this.props
        let cellWidth = ( width*(1 - this.scoreRatio) - this.wholeGap) / points.length
        // console.info(width, this.wholeGap, points.length, cellWidth)
        return cellWidth
    }

    @computed
    get cellHeight():number{
        let {points, height} = this.props
        let attrNum = points[0].value.length
        let cellHeight = Math.min(
            (height - this.fontHeight - this.verticalGap)*this.blockHeightRatio / attrNum,
            this.maxCellHeight
        )
        return cellHeight
    }

    @computed
    get timeStepHeight():number{
        let {points, height} = this.props
        let maxTimeIdx = Math.max(...points.map(p=>p.timeIdx))
        const timeStepHeight = (height - this.fontHeight - this.verticalGap)*(1 - this.blockHeightRatio)/(maxTimeIdx+1)

        return timeStepHeight
    }

    drawAllStates() {
        let { points, selected, stageLabels } = this.props
        if (points.length === 0) return <g />

        let offsetX = 0
        
        let stageBlocks: JSX.Element[] = []
        let allSelected = Object.values(selected).map(d => d.pointIdx).flat()
        let hasLeftPoints = allSelected.length < points.length

        let fontHeight = this.fontHeight

        if (Object.keys(selected).length > 0) {
            

            Object.values(selected).forEach(g => {
                let { stageKey, pointIdx } = g
                let stageColor = getColorByName(stageKey)
                let stageName = stageLabels[stageKey] || stageKey

                stageBlocks.push(
                    <g key={stageKey} className={`stage${stageKey}`} transform={`translate(${offsetX}, 0)`}>

                        <rect fill={stageColor} className='labelBG'
                            width={Math.max(getTextWidth(stageName, 14), 20)} height={fontHeight}
                            rx={3} opacity={0.5}
                            stroke={stageColor}
                            strokeWidth={this.strokeW}
                        />
                        <text alignmentBaseline="hanging">{stageName}</text>

                        <rect className='stageBox'
                            fill='none'
                            stroke={stageColor}
                            strokeWidth={this.strokeW}
                            y={fontHeight-this.strokeW/2}
                            x={-this.strokeW/2}
                            width={this.cellWidth * pointIdx.length + this.strokeW}
                            height={this.cellHeight * points[0].value.length + this.strokeW}
                        />

                        <g transform={`translate(0, ${fontHeight})`} className='oneState' >
                            {this.drawOneState( pointIdx.map(id => points[id]) )}
                        </g>

                    </g>)

                offsetX += this.cellWidth * pointIdx.length + this.horizonGap
            })


            if (hasLeftPoints) {
                let leftNodes = points.map((_, i) => i)
                    .filter(i => !allSelected.includes(i))

                stageBlocks.push(
                    <g key={'undefined'} className={`undefined`} transform={`translate(${offsetX}, 0)`}>
                        <text alignmentBaseline="hanging">undefined</text>
                        <g transform={`translate(0, ${fontHeight})`} className='oneState'>
                            {this.drawOneState(leftNodes.map(id => points[id]))}
                        </g>
                    </g>)
            }

        } else {
            //if no selected stages, treat all points at one stage
            stageBlocks.push(
                <g key='undefined' className={`undefined`} transform={`translate(${offsetX}, 0)`}>
                    <text alignmentBaseline="hanging">undefined</text>
                    <g transform={`translate(0, ${fontHeight})`} className='onsState'>
                        {this.drawOneState(points)}
                    </g>
                </g>
            )
        }

        return stageBlocks
    }

    // draw the block of one state
    drawOneState(points: Point[]) {
        if (points.length==0){
            return []
        }
        

        let block = this.drawBlock(points)

        let timeDist = this.drawTiemDist(points)
        
        return [block, timeDist]

    }

    drawBlock(points: Point[]){
        points = this.reorderPoints(points)
        let { setHoverID, resetHoverID } = this.props
        let block = points.map((point, i) => {

            let pointCol = point.value.map((v, rowIdx) => {
                let fill = this.props.colorScales[rowIdx](v) || 'gray'
                return <rect key={rowIdx}
                    width={this.cellWidth} height={this.cellHeight}
                    x={this.cellWidth * i} y={rowIdx * this.cellHeight}
                    fill={fill}
                />
            })

            let opacity = (this.props.hoverPointID === point.idx) ? 1 : 0.5

            return <g
                key={`point_${point.idx}`} className={`point_${point.idx}`} opacity={opacity}
                onMouseEnter={() => setHoverID(point.idx)}
                onMouseLeave={() => resetHoverID()}
            >
                {pointCol}
            </g>
        })

        return <g key="block" className="block"> {block} </g>
    }

    // draw the time dist of one identified state
    drawTiemDist(points: Point[]){
        let maxTimeIdx = Math.max( ...this.props.points.map(d=>d.timeIdx) )
        let attrNum = points[0].value.length

        let dist = [...Array(maxTimeIdx+1)].map(d=>0)
        points.forEach(point=>{
            let timeIdx = point.timeIdx
            dist[timeIdx] += 1
        })

        let charPoints = dist.map((d,i)=>`L ${d*this.cellWidth} ${i * this.timeStepHeight}`)
        

        return <g className='timeDist' key="timeDist" transform={`translate(0, ${this.cellHeight * attrNum + this.verticalGap})`}>
            <path 
                d= {`M 0 0 ${charPoints.join(' ')} L ${0} ${maxTimeIdx* this.timeStepHeight} z`}
                fill='gray'
                stroke = 'gray'
                strokeWidth = '2'
            />
        </g>
    }

    showScores(){
        let {importanceScores} = this.props
        let scores = importanceScores.map((score,i)=><text y={this.cellHeight*i}>
            {score.toFixed(3)}
        </text>)
        return scores
    }

    reorderPoints(points: Point[]) {
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
        return <g className='stateSummary'>
            <g className='importanceScores' transform ={`translate(0, ${this.fontHeight + this.cellHeight})`}>
                {this.showScores()}
            </g>
            <g className='state' transform={`translate(${this.props.width*this.scoreRatio}, 0)`}>
                {this.drawAllStates()}
            </g>
        </g>
    }
}



export default StageBlock;