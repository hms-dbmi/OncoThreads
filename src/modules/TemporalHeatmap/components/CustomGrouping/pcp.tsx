import {Point, ReferencedVariables} from 'modules/Type'
import React from 'react';
import { observer } from 'mobx-react';
import * as d3 from 'd3';
import {Tooltip} from 'antd';
import {TSelected} from './index'

import {getColorByName} from 'modules/TemporalHeatmap/UtilityClasses/'


const clipText =(text:string|number, len:number):string|number=>{
    if (typeof(text)==='number') return text
    else if (text.length<len) return text
    else {
        return text.substring(0, len-1)+'..'
    }
}

interface Props {
    points: Point[],
    selected: TSelected,
    currentVariables: string[],
    referencedVariables: ReferencedVariables, // add more detils later
    height:number,
    width: number,
}


const PCP = observer(class CustomGrouping extends React.Component<Props> {
    constructor(props: Props){
        super(props)
        this.generateLines = this.generateLines.bind(this)
    }
    generateLines(){
        let {width, height, referencedVariables, currentVariables, points, selected} = this.props
        let yScale = d3.scalePoint()
            .domain(currentVariables)
            .range([0, height])

        // console.info(yScale)

        let xScales = currentVariables.map(name=>{
            let ref = referencedVariables[name]
            if (ref.datatype === 'NUMBER'){
                return d3.scaleLinear()
                .domain(ref.domain as number[])
                .range([0, width])
            } else {
                return d3.scalePoint()
                .domain(ref.domain as string[])
                .range([0, width])
            } 
        }) 

        let svgLines = points.map((point, i)=>{
            let lineMid = point.value.map((v,j)=>{
                let x = xScales[j](v as any)
                if (typeof(v)==="undefined") {x = xScales[j].range()[0]}
                let y = yScale(currentVariables[j])
                return `${j===0?'M':'L'} ${x} ${y}`
            })
            let wholeLine = `${lineMid.join(' ')}`
            let id = i
            let groupIdx = this.props.selected.findIndex(p=>p.pointIdx.includes(id))
            
            return <path 
                className='pcpLine'
                d={wholeLine} 
                fill='none' 
                key={id}
                stroke={groupIdx>-1?getColorByName(selected[groupIdx].stageKey):"lightgray"}
                strokeWidth='4'
                opacity={`${groupIdx>-1?'1':'0.4'}`}
                />
        })

        // add axis
        let axes = currentVariables.map((v, i)=>{
            let y = yScale(v)||0
            return <g className={`axis ${v}`} key={`axis_${i}`}>
                <line className={`axis ${v}`}
                    x1={0}
                    y1={y}
                    x2={width}
                    y2={y}
                    stroke='black'
                    strokeWidth='2'
                />
                <text className='label' x={width} y={y-18} textAnchor="end">
                    {v}
                </text>
                <g className='ticks'>
                    {(xScales[i].domain() as string[] ).map((v:string)=>{
                        const maxLen = (this.props.width/xScales[i].domain().length)/6
                        if (v.toString().length>maxLen){ // tooltip only when clip
                            return <Tooltip title={v} key={v} >
                                <text x={xScales[i](v as any)||0+5} y={y-5} key={v} textAnchor="middle" cursor='pointer'>
                                {clipText(v, maxLen)}
                                </text>
                            </Tooltip>
                        }else {
                            return <text x={xScales[i](v as any)||0+5} y={y-5} key={v} textAnchor="middle" cursor='pointer'>
                            {v} </text>
                        }
                    })}
                </g>
            </g>
        })
        return [
            <g className='pcpLines' key='PCPlines'>{svgLines}</g>,
            <g className='pcpAxes' key='PCPAxes'>{axes}</g>,
        ]
    }
    

    render() {
        return this.generateLines()
    }
})



export default PCP;