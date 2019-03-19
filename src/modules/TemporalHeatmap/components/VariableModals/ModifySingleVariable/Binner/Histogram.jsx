import React from 'react';
import {observer} from 'mobx-react';
import Axis from "./Axis";
import * as d3 from "d3";
import UtilityFunctions from "../../../../UtilityClasses/UtilityFunctions";

/**
 * Component for displaying a histogram of the distribution of the values of a variable
 */
const Histogram = observer(class Histogram extends React.Component {
    render() {
        const _self = this;
        const bars = this.props.bins.map(function (d, i) {
            return (
                <rect key={i} x={_self.props.xScale(d.x0)} y={_self.props.yScale(d.length)}
                      width={_self.props.xScale(d.x1) - _self.props.xScale(d.x0)}
                      style={{stroke: 'white'}}
                      height={_self.props.h - _self.props.yScale(d.length)} fill="lightblue"/>
            );
        });
         const xAxis = d3.axisBottom()
            .scale(this.props.xScale).tickFormat(d=>{
                return UtilityFunctions.getScientificNotation(d);
             });
        const yAxis = d3.axisLeft()
            .scale(this.props.yScale)
            .tickFormat(d =>{
                return Math.round(d / this.props.numValues * 100)
            });
        return (
            <g>
                <Axis h={this.props.h} w={this.props.w} axis={yAxis} axisType="y" label="Percent"/>
                <Axis h={this.props.h} w={this.props.w} axis={xAxis} axisType="x" label={this.props.xLabel}/>
                {bars}
            </g>
        )
    }
});
export default Histogram;