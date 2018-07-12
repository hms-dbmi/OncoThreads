import React from 'react';
import {observer} from 'mobx-react';
import uuidv4 from "uuid/v4";
import * as d3 from 'd3';
/*
creates a row in a partition of a grouped timepoint
 */
const ContinuousRow = observer(class ContinuousRow extends React.Component {
    static getTooltipContent(value, numPatients) {
        {
            let content = "";
            if (numPatients === 1) {
                content = value + ": " + numPatients + " patient";
            }
            else {
                content = value + ": " + numPatients + " patients";
            }
            return content;
        }
    }

    createGradientRow(boxPlotValues, numValues) {
        let randomId = uuidv4();
        let gradient;
        if(numValues===2){
            gradient= <linearGradient id={randomId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor: this.props.color(boxPlotValues[0])}}/>
                    <stop offset="100%" style={{stopColor: this.props.color(boxPlotValues[4])}}/>
                </linearGradient>
        }
        else if(numValues===4){
            gradient=<linearGradient id={randomId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor: this.props.color(boxPlotValues[0])}}/>
                    <stop offset="33%" style={{stopColor: this.props.color(boxPlotValues[1])}}/>
                    <stop offset="33%" style={{stopColor: this.props.color(boxPlotValues[3])}}/>
                    <stop offset="100%" style={{stopColor: this.props.color(boxPlotValues[4])}}/>
                </linearGradient>
        }
        else{
            gradient=<linearGradient id={randomId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor: this.props.color(boxPlotValues[0])}}/>
                    <stop offset="25%" style={{stopColor: this.props.color(boxPlotValues[1])}}/>
                    <stop offset="50%" style={{stopColor: this.props.color(boxPlotValues[2])}}/>
                    <stop offset="75%" style={{stopColor: this.props.color(boxPlotValues[3])}}/>
                    <stop offset="100%" style={{stopColor: this.props.color(boxPlotValues[4])}}/>
                </linearGradient>
        }

        return (<g>
            <defs>
                {gradient}
            </defs>
            <rect x="0" height={this.props.height} width={this.props.groupScale(numValues)}
                  fill={"url(#" + randomId + ")"} opacity={this.props.opacity}
                  onMouseEnter={(e) => this.props.showTooltip(e, 'Minimum: ' + Math.round(boxPlotValues[0] * 100) / 100 + ', Median: ' + Math.round(boxPlotValues[2] * 100) / 100 + ', Maximum: ' + Math.round(boxPlotValues[4] * 100) / 100)}
                  onMouseLeave={this.props.hideTooltip}/>
            <rect x={this.props.groupScale(numValues)} height={this.props.height}
                  width={this.props.groupScale(this.props.row.length - numValues)} fill={"white"} stroke="lightgray"
                  opacity={this.props.opacity}
                  onMouseEnter={(e) => this.props.showTooltip(e, ContinuousRow.getTooltipContent("undefined", this.props.row.length - numValues))}
                  onMouseLeave={this.props.hideTooltip}/>
        </g>);
    }

    createBoxPlot(boxPlotValues, numValues) {
        let intermediateStop = null;
        let boxPlotScale = d3.scaleLinear().domain(this.props.variableDomain).range([0, this.props.groupScale(numValues)]);
        let min=this.props.color(this.props.color.domain()[0]);
        let max;
        if (this.props.color.domain().length === 3) {
            intermediateStop = <stop offset="50%" style={{stopColor: this.props.color(this.props.color.domain()[1])}}/>;
            max=this.props.color(this.props.color.domain()[2]);
        }
        else{
            max=this.props.color(this.props.color.domain()[1]);

        }
        let randomId = uuidv4();
        let boxPlot=null;
        if(numValues!==0){
            boxPlot=<g>
                <defs>
                    <defs>
                        <linearGradient id={randomId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{stopColor: min}}/>
                            {intermediateStop}
                            <stop offset="100%" style={{stopColor: max}}/>
                        </linearGradient>
                    </defs>
                </defs>
                <rect x={0} width={this.props.groupScale(numValues)} height={this.props.height}
                      fill={"url(#" + randomId + ")"} stroke={'lightgray'} opacity={this.props.opacity}
                      onMouseEnter={(e) => this.props.showTooltip(e, 'Minimum: ' + Math.round(boxPlotValues[0] * 100) / 100 + ', Median: ' + Math.round(boxPlotValues[2] * 100) / 100 + ', Maximum: ' + Math.round(boxPlotValues[4] * 100) / 100)}
                      onMouseLeave={this.props.hideTooltip}/>
                <line x1={boxPlotScale(boxPlotValues[0])} x2={boxPlotScale(boxPlotValues[0])}
                      y1={1 / 3 * this.props.height} y2={2 / 3 * this.props.height} stroke="black"/>
                <line x1={boxPlotScale(boxPlotValues[0])} x2={boxPlotScale(boxPlotValues[1])}
                      y1={1 / 2 * this.props.height} y2={1 / 2 * this.props.height} stroke="black"/>
                <rect x={boxPlotScale(boxPlotValues[1])} y={1 / 4 * this.props.height}
                      height={1 / 2 * this.props.height}
                      width={boxPlotScale(boxPlotValues[3]) - boxPlotScale(boxPlotValues[1])} stroke={"black"}
                      fill={"none"}/>
                <line x1={boxPlotScale(boxPlotValues[2])} x2={boxPlotScale(boxPlotValues[2])}
                      y1={1 / 4 * this.props.height} y2={3 / 4 * this.props.height} stroke="black"/>
                <line x1={boxPlotScale(boxPlotValues[3])} x2={boxPlotScale(boxPlotValues[4])}
                      y1={1 / 2 * this.props.height} y2={1 / 2 * this.props.height} stroke="black"/>
                <line x1={boxPlotScale(boxPlotValues[4])} x2={boxPlotScale(boxPlotValues[4])}
                      y1={1 / 3 * this.props.height} y2={2 / 3 * this.props.height} stroke="black"/>
            </g>
        }
        return (
            <g>
                {boxPlot}
                <rect x={this.props.groupScale(numValues)}
                      width={this.props.groupScale(this.props.row.length - numValues)} height={this.props.height}
                      fill={'white'} stroke={'lightgray'}
                      onMouseEnter={(e) => this.props.showTooltip(e, ContinuousRow.getTooltipContent("undefined", this.props.row.length - numValues))}
                      onMouseLeave={this.props.hideTooltip}/>
            </g>
        )
    }

    static computeBoxPlotValues(values) {
        values.sort(function (a, b) {
            return (a - b);
        });
        let median = values[Math.floor((values.length - 1) / 2)];
        let lowerQuart = values[Math.floor((values.length - 1) / 4)];
        let higherQuart = values[Math.floor((values.length - 1) * (3 / 4))];
        let min = values[0];
        let max = values[values.length - 1];
        return [min, lowerQuart, median, higherQuart, max]
    }

    render() {
        let values = this.props.row.filter(function (d, i) {
            return d.key !== undefined;
        }).map(element => element.key);
        let boxPlotValues = ContinuousRow.computeBoxPlotValues(values);
        return (
            this.createGradientRow(boxPlotValues, values.length)
        )
    }
});
export default ContinuousRow;