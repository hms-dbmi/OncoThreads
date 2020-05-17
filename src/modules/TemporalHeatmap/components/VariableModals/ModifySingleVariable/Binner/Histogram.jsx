import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import * as d3 from 'd3';
import Axis from './Axis';
import {getScientificNotation} from 'modules/TemporalHeatmap/UtilityClasses/UtilityFunctions';

/**
 * Component for displaying a histogram of the distribution of the values of a variable
 */
const Histogram = observer(class Histogram extends React.Component {
    render() {
        const bars = this.props.bins.map(d => (
            <rect
                key={d.x0}
                x={this.props.xScale(d.x0)}
                y={this.props.yScale(d.length)}
                width={this.props.xScale(d.x1) - this.props.xScale(d.x0)}
                style={{ stroke: 'white' }}
                height={this.props.h - this.props.yScale(d.length)}
                fill="lightblue"
            />
        ));
        const xAxis = d3.axisBottom()
            .scale(this.props.xScale).tickFormat(d => getScientificNotation(d));
        const yAxis = d3.axisLeft()
            .scale(this.props.yScale)
            .tickFormat(d => Math.round(d / this.props.numValues * 100));
        return (
            <g>
                <Axis h={this.props.h} w={this.props.w} axis={yAxis} axisType="y" label="Percent" />
                <Axis h={this.props.h} w={this.props.w} axis={xAxis} axisType="x" label={this.props.xLabel} />
                {bars}
            </g>
        );
    }
});
Histogram.propTypes = {
    w: PropTypes.number.isRequired,
    h: PropTypes.number.isRequired,
    bins: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
    numValues: PropTypes.number.isRequired,
    xScale: PropTypes.func.isRequired,
    yScale: PropTypes.func.isRequired,
};
export default Histogram;
