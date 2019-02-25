import React from 'react';
import {observer} from 'mobx-react';
import uuidv4 from "uuid/v4";
import * as d3 from 'd3';
import UtilityFunctions from "../../../UtilityFunctions";
/*
creates a row of a continuous variable in a partition of a grouped timepoint
 */
const ContinuousRow = observer(class ContinuousRow extends React.Component {
    static getTooltipContent(value, numPatients) {
        let content = "";
        if (numPatients === 1) {
            content = value + ": " + numPatients + " patient";
        }
        else {
            content = value + ": " + numPatients + " patients";
        }
        return content;
    }

    /**
     * creates a gradient representing the distribution of the values of a continuous variable
     * @param values
     * @param boxPlotValues
     * @param selectedPatients
     * @returns {*}
     */
    createGradientRow(values, boxPlotValues, selectedPatients) {
        let randomId = uuidv4();
        const _self = this;
        let gradient;
        const stepwidth = 100 / (values.length - 1);
        let stops = [];
        let selectedScale = d3.scaleLinear().domain([0, 100]).range([0, this.props.groupScale(values.length)]);
        let selectedRects = [];
        let undefinedValuesCounter = selectedPatients.length;
        values.forEach(function (d, i) {
            if (selectedPatients.includes(d.patient)) {
                undefinedValuesCounter -= 1;

                const rgb = _self.props.color(d.value).replace(/[^\d,]/g, '').split(',');
                let brightness = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
                let rectColor;
                if (brightness < 255 / 2) {
                    rectColor = "white";
                }
                else {
                    rectColor = "black";
                }
                if (_self.props.store.rootStore.uiStore.advancedSelection) {
                    let x = selectedScale(stepwidth * i);
                    if (i === 0) {
                        x = x + 1;
                    }
                    if (i === values.length - 1) {
                        x = x - 1;
                    }
                    selectedRects.push(<line key={d.patient} x1={x} x2={x} y1={_self.props.height / 3}
                                             y2={2 * (_self.props.height / 3)}
                                             style={{strokeWidth: 1, stroke: rectColor}}/>);
                }
            }
            stops.push(<stop key={i} offset={(stepwidth * i) + "%"}
                             style={{stopColor: _self.props.color(d.value)}}/>)
        });
        gradient = <linearGradient id={randomId} x1="0%" y1="0%" x2="100%" y2="0%">
            {stops}
        </linearGradient>;
        let selectUndefinedRect = null;
        if (undefinedValuesCounter > 0 && this.props.store.rootStore.uiStore.advancedSelection) {
            selectUndefinedRect = <rect x={this.props.groupScale(values.length) + 1} height={this.props.height}
                                        width={this.props.groupScale(undefinedValuesCounter) - 1}
                                        fill={"none"}
                                        stroke="black"/>
        }
        return (<g>
            <defs>
                {gradient}
            </defs>
            <rect x="0" height={this.props.height} width={this.props.groupScale(values.length)}
                  fill={"url(#" + randomId + ")"} opacity={this.props.opacity}
                  onMouseEnter={(e) => this.props.showTooltip(e, values.length + ' patients: Minimum ' + UtilityFunctions.getScientificNotation(boxPlotValues[0]) + ', Median ' + UtilityFunctions.getScientificNotation(boxPlotValues[2]) + ', Maximum ' + UtilityFunctions.getScientificNotation(boxPlotValues[4]))}
                  onMouseLeave={this.props.hideTooltip}/>
            <rect x={this.props.groupScale(values.length)} height={this.props.height}
                  width={this.props.groupScale(this.props.row.length - values.length)} fill={"white"}
                  stroke="lightgray"
                  opacity={this.props.opacity}
                  onMouseEnter={(e) => this.props.showTooltip(e, ContinuousRow.getTooltipContent("undefined", this.props.row.length - values.length))}
                  onMouseLeave={this.props.hideTooltip}/>
            {selectUndefinedRect}
            {selectedRects}
        </g>);
    }

    /**
     * creates a boxplot representing the distribution of the values of a continuous variable
     * @param boxPlotValues
     * @param numValues
     * @returns {*}
     */
    createBoxPlot(boxPlotValues, numValues) {
        let intermediateStop = null;
        let boxPlotScale = d3.scaleLinear().domain(this.props.variableDomain).range([0, this.props.groupScale(numValues)]);
        let min = this.props.color(this.props.color.domain()[0]);
        let max;
        if (this.props.color.domain().length === 3) {
            intermediateStop = <stop offset="50%" style={{stopColor: this.props.color(this.props.color.domain()[1])}}/>;
            max = this.props.color(this.props.color.domain()[2]);
        }
        else {
            max = this.props.color(this.props.color.domain()[1]);

        }
        let randomId = uuidv4();
        let boxPlot = null;
        if (numValues !== 0) {
            boxPlot = <g>
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
                      onMouseEnter={(e) => this.props.showTooltip(e, 'Minimum: ' + UtilityFunctions.getScientificNotation(boxPlotValues[0]) + ', Median: ' + UtilityFunctions.getScientificNotation(boxPlotValues[2]) + ', Maximum: ' + UtilityFunctions.getScientificNotation(boxPlotValues[4]))}
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

    /**
     * creates a rectangle colored with the median value of the set of values at the partition
     * @param boxPlotValues
     * @param numValues
     * @returns {*}
     */
    createMedianValue(boxPlotValues, numValues) {
        return (<g>
            <rect x="0" height={this.props.height} width={this.props.groupScale(numValues)}
                  fill={this.props.color(boxPlotValues[2])} opacity={this.props.opacity}
                  onMouseEnter={(e) => this.props.showTooltip(e, numValues + ' patients: Minimum ' + UtilityFunctions.getScientificNotation(boxPlotValues[0]) + ', Median ' + UtilityFunctions.getScientificNotation(boxPlotValues[2]) + ', Maximum ' + UtilityFunctions.getScientificNotation(boxPlotValues[4]))}
                  onMouseLeave={this.props.hideTooltip}/>
            <rect x={this.props.groupScale(numValues)} height={this.props.height}
                  width={this.props.groupScale(this.props.row.length - numValues)} fill={"white"}
                  stroke="lightgray"
                  opacity={this.props.opacity}
                  onMouseEnter={(e) => this.props.showTooltip(e, ContinuousRow.getTooltipContent("undefined", this.props.row.length - numValues))}
                  onMouseLeave={this.props.hideTooltip}/>
        </g>);
    }

    /**
     * computes the values of the boxplot
     * @param values
     * @returns {*[]}
     */
    static computeBoxPlotValues(values) {
        values = values.map(element => element.value);
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
        }).map(element => ({patient: element.patients[0], value: element.key})).sort(function (a, b) {
            return (a.value - b.value)
        });
        let boxPlotValues = ContinuousRow.computeBoxPlotValues(values);
        if (this.props.store.rootStore.uiStore.continuousRepresentation === 'gradient') {
            let selectedPartitionPatients = this.props.row.map(d => d.patients[0]).filter(element => -1 !== this.props.store.selectedPatients.indexOf(element));
            return (
                this.createGradientRow(values, boxPlotValues, selectedPartitionPatients)
            )
        }
        else if (this.props.store.rootStore.uiStore.continuousRepresentation === 'boxplot')
            return (
                this.createBoxPlot(boxPlotValues, values.length)
            );
        else {
            return (this.createMedianValue(boxPlotValues, values.length));
        }
    }
});
export default ContinuousRow;