import React from 'react';
import { observer } from 'mobx-react';
import './ParSet.css'

import { TSelected } from './index'
import { Point, ReferencedVariables } from 'modules/Type'
import { computed } from 'mobx';
import { getColorByName } from 'modules/TemporalHeatmap/UtilityClasses/'


require("./d3parset.js");
const d3 = require("d3");

interface Props {
    parsetData: any,
    height: number,
    width: number,
    points:any
}





class ParSet extends React.Component<Props> {
    constructor(props: Props) {
        super(props)
        this.drawVIS = this.drawVIS.bind(this)
       

    }


    drawVIS() {
        let { width, height } = this.props
        let { catePoints, dimensions } = this.props.parsetData
        console.info(catePoints.map((d:any)=>d.STAGE))

        let vis = d3.select("g#parset")

        let chart = d3.parsets()
            .width(width)
            .height(height)
            .tension(0.5)
            .dimensions(dimensions);

        vis.datum(catePoints).call(chart);
    }


    componentDidMount() {
        this.drawVIS()
    }

    componentDidUpdate() {
        if (this.props.points[0] && this.props.points[0].value.length == 5) {

        console.info('update parset')
            this.drawVIS()
        }

    }

    render() {
        return <g id='parset' >
            {/* {this.props.selected.length} */}
        </g>
    }
}

export default ParSet