import React from 'react';
import { observer } from 'mobx-react';
import { TSelected } from '.'

import { Point } from 'modules/Type'
import { getColorByName, getTextWidth } from 'modules/TemporalHeatmap/UtilityClasses/'
import { attr } from 'lineupjs/src/renderer/utils';


interface Props {
    points: Point[],
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
    public horizonGap = 20; maxCellHeight = 20; verticalGap = 10;
    constructor(props: Props) {
        super(props)
        this.drawAllStates = this.drawAllStates.bind(this)
        this.drawOneState = this.drawOneState.bind(this)
        this.drawTiemDist = this.drawTiemDist.bind(this)

    }

    drawAllStates() {
        let { points, width, height, selected, stageLabels } = this.props
        if (points.length === 0) return <g />

        let offsetX = 0
        let fontHeight = 15,
        blockHeightRatio = 0.6 // the heigh of block of the whole chart 

        let stageBlocks: JSX.Element[] = []
        let allSelected = selected.map(d => d.pointIdx).flat()
        let hasLeftPoints = allSelected.length < points.length
        let wholeGap = (hasLeftPoints ? selected.length : selected.length - 1) * this.horizonGap
        let cellWidth = (width - wholeGap) / points.length
        
        let attrNum = points[0].value.length
        let cellHeight = Math.min(
            (height - fontHeight - this.verticalGap)*blockHeightRatio / attrNum,
            this.maxCellHeight
        )
        let maxTimeIdx = Math.max(...points.map(p=>p.timeIdx))
        const timeStepHeight = (height - fontHeight - this.verticalGap)*(1-blockHeightRatio)/(maxTimeIdx+1)

        if (selected.length > 0) {


            let strokeW = 4

            selected.forEach(g => {
                let { stageKey, pointIdx } = g
                let stageColor = getColorByName(stageKey)
                let stageName = stageLabels[stageKey] || stageKey

                stageBlocks.push(
                    <g key={stageKey} className={`stage${stageKey}`} transform={`translate(${offsetX}, 0)`}>

                        <rect fill={stageColor} className='labelBG'
                            width={Math.max(getTextWidth(stageName, 14), 20)} height={fontHeight}
                            rx={3} opacity={0.5}
                            stroke={stageColor}
                            strokeWidth={strokeW}
                        />
                        <text alignmentBaseline="hanging">{stageName}</text>

                        <rect className='stageBox'
                            fill='none'
                            stroke={stageColor}
                            strokeWidth={strokeW}
                            y={fontHeight-strokeW/2}
                            x={-strokeW/2}
                            width={cellWidth * pointIdx.length + strokeW}
                            height={cellHeight * points[0].value.length + strokeW}
                        />

                        <g transform={`translate(0, ${fontHeight})`} className='oneState' >
                            {this.drawOneState(pointIdx.map(id => points[id]), cellWidth, cellHeight, maxTimeIdx, timeStepHeight)}
                        </g>

                    </g>)

                offsetX += cellWidth * pointIdx.length + this.horizonGap
            })


            if (hasLeftPoints) {
                let leftNodes = points.map((_, i) => i)
                    .filter(i => !allSelected.includes(i))

                stageBlocks.push(
                    <g key={'undefined'} className={`undefined`} transform={`translate(${offsetX}, 0)`}>
                        <text alignmentBaseline="hanging">undefined</text>
                        <g transform={`translate(0, ${fontHeight})`} className='oneState'>
                            {this.drawOneState(leftNodes.map(id => points[id]), cellWidth, cellHeight, maxTimeIdx,timeStepHeight)}
                        </g>
                    </g>)
            }

        } else {
            //if no selected stages, treat all points at one stage
            stageBlocks.push(
                <g key='undefined' className={`undefined`} transform={`translate(${offsetX}, 0)`}>
                    <text alignmentBaseline="hanging">undefined</text>
                    <g transform={`translate(0, ${fontHeight})`} className='onsState'>
                        {this.drawOneState(points, cellWidth, cellHeight, maxTimeIdx, timeStepHeight)}
                    </g>
                </g>
            )
        }

        return stageBlocks
    }

    // draw the block of one state
    drawOneState(points: Point[], cellWidth: number, cellHeight: number, maxTimeIdx:number, timeStepHeight:number) {
        

        let block = this.drawBlock(points, cellWidth, cellHeight)

        let timeDist = this.drawTiemDist(points, cellWidth, cellHeight, maxTimeIdx, timeStepHeight)
        
        return [block, timeDist]

    }

    drawBlock(points: Point[], cellWidth: number, cellHeight: number){
        points = this.reorderPoints(points)
        let { setHoverID, resetHoverID } = this.props
        let block = points.map((point, i) => {

            let pointCol = point.value.map((v, rowIdx) => {
                let fill = this.props.colorScales[rowIdx](v) || 'gray'
                return <rect key={rowIdx}
                    width={cellWidth} height={cellHeight}
                    x={cellWidth * i} y={rowIdx * cellHeight}
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
    drawTiemDist(points: Point[], cellWidth: number,cellHeight:number,  maxTimeIdx:number, timeStepHeight:number){
        let attrNum = points[0].value.length

        let dist = [...Array(maxTimeIdx+1)].map(d=>0)
        points.forEach(point=>{
            let timeIdx = point.timeIdx
            dist[timeIdx] += 1
        })

        let charPoints = dist.map((d,i)=>`L ${d*cellWidth} ${i*timeStepHeight}`)
        

        return <g className='timeDist' key="timeDist" transform={`translate(0, ${cellHeight*attrNum + this.verticalGap})`}>
            <path 
                d= {`M 0 0 ${charPoints.join(' ')} L ${0} ${maxTimeIdx*timeStepHeight} z`}
                fill='gray'
                stroke = 'gray'
                strokeWidth = '2'
            />
        </g>
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
        return <g className='stageBlock'>
            {this.drawAllStates()}
        </g>
    }
}



export default StageBlock;