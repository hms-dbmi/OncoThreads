import React from 'react';
import { observer } from 'mobx-react';
import './ParSet.css'

import { TSelected } from './index'
import { Point, ReferencedVariables } from 'modules/Type'
import { computed } from 'mobx';



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
            this.drawVIS()
        // this.drawVIS()

    }

    render() {
        return <g id='parset' >
            {/* {this.props.selected.length} */}
        </g>
    }
}

export default ParSet