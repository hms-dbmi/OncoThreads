import React from 'react';
import { observer , PropTypes as MobxPropTypes } from 'mobx-react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';
import {Tooltip} from 'antd';

import ColorScales from 'modules/TemporalHeatmap/UtilityClasses/ColorScales'
const colors = ColorScales.defaultCategoricalRange

const clipText =(text, len)=>{
    if (typeof(text)=='number') return text
    else if (text.length<len) return text
    else {
        return text.substring(0, len-1)+'..'
    }
}

const PCP = observer(class CustomGrouping extends React.Component {
    constructor(props){
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
                .domain(ref.domain)
                .range([0, width])
            } else {
                return d3.scalePoint()
                .domain(ref.domain)
                .range([0, width])
            } 
        }) 

        let svgLines = points.map((point, i)=>{
            let lineMid = point.value.map((v,j)=>{
                let x = xScales[j](v)
                if (typeof(v)=="undefined") {x = xScales[j].range()[0]}
                let y = yScale(currentVariables[j])
                return `${j==0?'M':'L'} ${x} ${y}`
            })
            let wholeLine = `${lineMid.join(' ')}`
            let id = i.toString()
            let groupIdx = this.props.selected.findIndex(p=>p.includes(id))
            
            return <path 
                d={wholeLine} 
                fill='none' 
                key={id}
                stroke={groupIdx>-1?colors[groupIdx]:"lightgray"}
                strokeWidth='4'
                opacity={`${groupIdx>-1?'0.7':'0.4'}`}
                />
        })

        // add axis
        let axes = currentVariables.map((v, i)=>{
            let y = yScale(v)
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
                    {xScales[i].domain().map(v=>{
                        const maxLen = (this.props.width/xScales[i].domain().length)/6
                        v=v.toString()
                        if (v.length>maxLen){ // tooltip only when clip
                            return <Tooltip title={v} key={v} >
                                <text x={xScales[i](v)+5} y={y-5} title={v} key={v} textAnchor="middle" cursor='pointer'>
                                {clipText(v, maxLen)}
                                </text>
                            </Tooltip>
                        }else {
                            return <text x={xScales[i](v)+5} y={y-5} title={v} key={v} textAnchor="middle" cursor='pointer'>
                            {v} </text>
                        }
                    })}
                </g>
            </g>
        })
        return [
            <g className='pcpLines'>{svgLines}</g>,
            <g className='pcpAxis'>{axes}</g>,
        ]
    }
    

    render() {
        return this.generateLines()
    }
})

PCP.propTypes = {
    points: PropTypes.arrayOf(PropTypes.object).isRequired,
    selected: PropTypes.arrayOf(PropTypes.array).isRequired,
    currentVariables: PropTypes.arrayOf(PropTypes.string).isRequired,
    referencedVariables: PropTypes.object.isRequired,
    height:PropTypes.number,
    width: PropTypes.number,
}

export default PCP;