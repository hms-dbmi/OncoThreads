import React from 'react';
import { observer } from 'mobx-react';
import { TStage } from '.'
import * as d3 from 'd3';
import { TSelected } from '.'

import { Point, ReferencedVariables } from 'modules/Type'
import { getColorByName } from 'modules/TemporalHeatmap/UtilityClasses/'


const clipText = (text: string | number, len: number): string | number => {
    if (typeof (text) === 'number') return text
    else if (text.length < len) return text
    else {
        return text.substring(0, len - 1) + '..'
    }
}

interface Props {
    points: Point[],
    stageLabels: { [key: string]: string },
    width: number,
    height: number,
    hoverPointID:number,
    selected: TSelected,
    colorScales: Array<(value: string | number | boolean) => string>,
}


@observer
class StageBlock extends React.Component<Props> {
    public margin = 20; maxCellHeight = 20;
    constructor(props: Props) {
        super(props)
        this.drawVIS = this.drawVIS.bind(this)
        this.drawBlock = this.drawBlock.bind(this)

    }

    drawVIS() {
        let { points, width, height, selected, stageLabels } = this.props
        if (points.length == 0) return <g />

        let offsetX = 0

        let stageBlocks: JSX.Element[] = []
        let cellWidth = (width - this.margin) / points.length
        let fontHeight = 15
        let cellHeight = Math.min(
            (height - fontHeight) / points[0].value.length,
            this.maxCellHeight
        )

        if (selected.length > 0) {
            let allSelected = selected.map(d => d.pointIdx).flat()
            let hasLeftPoints =allSelected.length < points.length

            let gap = hasLeftPoints? this.margin / selected.length:this.margin / (selected.length - 1)

            selected.forEach(g => {
                let { stageKey, pointIdx } = g
                let stageColor = getColorByName(stageKey)
                let stageName = stageLabels[stageKey] || stageKey

                stageBlocks.push(
                    <g key={stageKey} className={`stage${stageKey}`} transform={`translate(${offsetX}, 0)`}>
                        <text>{stageName}</text>
                        <g transform={`translate(0, ${fontHeight})`} className='blockCols' >
                            {this.drawBlock(pointIdx.map(id => points[id]), cellWidth, cellHeight)}
                        </g>
                    </g>)

                offsetX += cellWidth * pointIdx.length + gap
            })

            
            if (hasLeftPoints) {
                let leftNodes = points.map((_, i) => i)
                    .filter(i => !allSelected.includes(i))

                stageBlocks.push(
                    <g key={'noStage'} className={`noStage`} transform={`translate(${offsetX}, 0)`}>
                        <text>noStage</text>
                        <g transform={`translate(0, ${fontHeight})`} className='blockCols'>
                            {this.drawBlock(leftNodes.map(id => points[id]), cellWidth, cellHeight)}
                        </g>
                    </g>)
            }

        } else {
            //if no selected stages, treat all points at one stage
            stageBlocks.push(
                <g key='noStage' className={`noStage`} transform={`translate(${offsetX}, 0)`}>
                    <text>noStage</text>
                    <g transform={`translate(0, ${fontHeight})`} className='blockCols'>
                        {this.drawBlock(points, cellWidth, cellHeight)}
                    </g>
                </g>
            )
        }

        return stageBlocks
    }

    drawBlock(points: Point[], cellWidth: number, cellHeight: number) {
        points = this.reorderPoints(points)
        let block = points.map((point, i) => {

            let pointCol = point.value.map((v, rowIdx) => {
                let fill = this.props.colorScales[rowIdx](v) || 'gray'
                return <rect key={rowIdx}
                    width={cellWidth} height={cellHeight}
                    x={cellWidth * i} y={rowIdx * cellHeight}
                    fill={fill}
                />
            })

            let opacity= (this.props.hoverPointID===point.idx)?1:0.5

            return <g key={`point_${point.idx}`} className={`point_${point.idx}`} opacity={opacity}>
                {pointCol}
            </g>
        })

        return block

    }

    reorderPoints(points: Point[]) {
        return [...points].sort((a, b) => {
            let dif = 0, i = 0
            for (let i = 0; i < a.value.length; i++) {
                if (a.value[i] != b.value[i]) {
                    dif = a.value[i] > b.value[i] ? 1 : -1
                    break
                }
            }
            return dif
        })
    }

    render() {
        return <g className='stageBlock'>
            {this.drawVIS()}
        </g>
    }
}



export default StageBlock;