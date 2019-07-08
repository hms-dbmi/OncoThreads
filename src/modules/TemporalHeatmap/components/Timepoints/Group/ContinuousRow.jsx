import React from 'react';
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react';
import uuidv4 from 'uuid/v4';
import * as d3 from 'd3';
import PropTypes from 'prop-types';
import UtilityFunctions from '../../../UtilityClasses/UtilityFunctions';
import ColorScales from '../../../UtilityClasses/ColorScales';

/**
 * Component representing a row of a categorical variable in a grouped partition of a timepoint
 */
const ContinuousRow = inject('dataStore', 'uiStore', 'visStore')(observer(class ContinuousRow extends React.Component {
    static getTooltipContent(value, numPatients) {
        let content = '';
        if (numPatients === 1) {
            content = `${value}: ${numPatients} patient`;
        } else {
            content = `${value}: ${numPatients} patients`;
        }
        return content;
    }

    /**
     * computes the values of the boxplot
     * @param {number[]} values
     * @returns {number[]}
     */
    static computeBoxPlotValues(values) {
        const median = values[Math.floor((values.length - 1) / 2)];
        const lowerQuart = values[Math.floor((values.length - 1) / 4)];
        const higherQuart = values[Math.floor((values.length - 1) * (3 / 4))];
        const min = values[0];
        const max = values[values.length - 1];
        return [min, lowerQuart, median, higherQuart, max];
    }

    /**
     * creates a gradient representing the distribution of the values of a continuous variable
     * @param {Object[]} values - patients contained in the
     * row and their associated continuous values
     * @param {number[]} boxPlotValues - quartiles and median of the values in the row
     * @param {string[]} selectedPatients
     * @returns {g}
     */
    createGradientRow(values, boxPlotValues, selectedPatients) {
        const definedValues = values.filter(d => d.value !== undefined)
            .sort((a, b) => a.value - b.value);
        const undefinedValues = values.filter(d => d.value === undefined);
        const selectedUndefined = selectedPatients.filter(patient => undefinedValues
            .map(d => d.patient).includes(patient));
        let undefinedSelectedRect = null;
        if (selectedUndefined.length > 0 && this.props.uiStore.advancedSelection) {
            undefinedSelectedRect = (
                <g>
                    <rect
                        x={this.props.visStore.groupScale(definedValues.length) + 1}
                        height={this.props.height}
                        width={this.props.visStore.groupScale(selectedUndefined.length) - 1}
                        fill="none"
                        stroke="black"
                    />
                </g>
            );
        }
        const undefinedRects = (
            <g>
                <rect
                    x={this.props.visStore.groupScale(definedValues.length)}
                    onClick={e => this.handleMouseClick(e, undefinedValues.map(d => d.patient))}
                    height={this.props.height}
                    width={this.props.visStore.groupScale(this.props.row.length
                        - definedValues.length)}
                    fill="white"
                    stroke="lightgray"
                    opacity={this.props.opacity}
                    onMouseEnter={e => this.props.showTooltip(e, ContinuousRow.getTooltipContent('undefined', this.props.row.length - definedValues.length))}
                    onMouseLeave={this.props.hideTooltip}
                />
                {undefinedSelectedRect}
            </g>
        );
        let definedRects = null;
        const randomId = uuidv4();
        if (definedValues.length > 1) {
            const stepwidth = 100 / (definedValues.length - 1);
            const stops = [];
            const selectedScale = d3.scaleLinear().domain([0, 100])
                .range([0, this.props.visStore.groupScale(definedValues.length)]);
            const selectedLines = [];
            definedValues.forEach((d, i) => {
                if (selectedPatients.includes(d.patient)) {
                    const rectColor = ColorScales.getHighContrastColor(this.props.color(d.value));
                    if (this.props.uiStore.advancedSelection) {
                        let x = selectedScale(stepwidth * i);
                        if (i === 0) {
                            x += 1;
                        }
                        if (i === definedValues.length - 1) {
                            x -= 1;
                        }
                        selectedLines.push(<line
                            key={d.patient}
                            x1={x}
                            x2={x}
                            y1={this.props.height / 3}
                            y2={2 * (this.props.height / 3)}
                            style={{ strokeWidth: 1, stroke: rectColor }}
                        />);
                    }
                }
                stops.push(<stop
                    key={i}
                    offset={`${stepwidth * i}%`}
                    style={{ stopColor: this.props.color(d.value) }}
                />);
            });
            definedRects = (
                <g>
                    <defs>
                        <linearGradient id={randomId} x1="0%" y1="0%" x2="100%" y2="0%">
                            {stops}
                        </linearGradient>
                    </defs>
                    <rect
                        x="0"
                        height={this.props.height}
                        width={this.props.visStore.groupScale(definedValues.length)}
                        fill={`url(#${randomId})`}
                        opacity={this.props.opacity}
                        onMouseEnter={e => this.props.showTooltip(e, `${definedValues.length} patients: Minimum ${UtilityFunctions.getScientificNotation(boxPlotValues[0])}, Median ${UtilityFunctions.getScientificNotation(boxPlotValues[2])}, Maximum ${UtilityFunctions.getScientificNotation(boxPlotValues[4])}`)}
                        onMouseLeave={this.props.hideTooltip}
                    />
                    {selectedLines}
                </g>
            );
        } else if (definedValues.length === 1) {
            let selectedLine = null;
            if (selectedPatients.includes(definedValues[0].patient)) {
                selectedLine = (
                    <line
                        x1={this.props.visStore.groupScale(1) / 2}
                        x2={this.props.visStore.groupScale(1) / 2}
                        y1={this.props.height / 3}
                        y2={2 * (this.props.height / 3)}
                        style={{
                            strokeWidth: 1,
                            stroke: ColorScales
                                .getHighContrastColor(this.props.color(definedValues[0].value)),
                        }}
                    />
                );
            }
            definedRects = (
                <g>
                    <rect
                        x="0"
                        height={this.props.height}
                        width={this.props.visStore.groupScale(1)}
                        fill={this.props.color(definedValues[0].value)}
                        opacity={this.props.opacity}
                        onMouseEnter={e => this.props.showTooltip(e, `${definedValues.length} patients: Minimum ${UtilityFunctions.getScientificNotation(boxPlotValues[0])}, Median ${UtilityFunctions.getScientificNotation(boxPlotValues[2])}, Maximum ${UtilityFunctions.getScientificNotation(boxPlotValues[4])}`)}
                        onMouseLeave={this.props.hideTooltip}
                    />
                    {selectedLine}
                </g>
            );
        }
        return (
            <g>
                {undefinedRects}
                {definedRects}
            </g>
        );
    }

    /**
     * creates a boxplot representing the distribution of the values of a continuous variable
     * @param {number[]} boxPlotValues - quartiles and median of the values in the row
     * @param {number} numValues - number of values in the row
     * @returns {g}
     */
    createBoxPlot(boxPlotValues, numValues) {
        let intermediateStop = null;
        const boxPlotScale = d3.scaleLinear().domain(this.props.variableDomain)
            .range([0, this.props.visStore.groupScale(numValues)]);
        const min = this.props.color(this.props.color.domain()[0]);
        let max;
        if (this.props.color.domain().length === 3) {
            intermediateStop = <stop offset="50%" style={{ stopColor: this.props.color(this.props.color.domain()[1]) }} />;
            max = this.props.color(this.props.color.domain()[2]);
        } else {
            max = this.props.color(this.props.color.domain()[1]);
        }
        const randomId = uuidv4();
        let boxPlot = null;
        if (numValues !== 0) {
            boxPlot = (
                <g>
                    <defs>
                        <defs>
                            <linearGradient id={randomId} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{ stopColor: min }} />
                                {intermediateStop}
                                <stop offset="100%" style={{ stopColor: max }} />
                            </linearGradient>
                        </defs>
                    </defs>
                    <rect
                        x={0}
                        width={this.props.visStore.groupScale(numValues)}
                        height={this.props.height}
                        fill={`url(#${randomId})`}
                        stroke="lightgray"
                        opacity={this.props.opacity}
                        onMouseEnter={e => this.props.showTooltip(e, `Minimum: ${UtilityFunctions.getScientificNotation(boxPlotValues[0])}, Median: ${UtilityFunctions.getScientificNotation(boxPlotValues[2])}, Maximum: ${UtilityFunctions.getScientificNotation(boxPlotValues[4])}`)}
                        onMouseLeave={this.props.hideTooltip}
                    />
                    <line
                        x1={boxPlotScale(boxPlotValues[0])}
                        x2={boxPlotScale(boxPlotValues[0])}
                        y1={1 / 3 * this.props.height}
                        y2={2 / 3 * this.props.height}
                        stroke="black"
                    />
                    <line
                        x1={boxPlotScale(boxPlotValues[0])}
                        x2={boxPlotScale(boxPlotValues[1])}
                        y1={1 / 2 * this.props.height}
                        y2={1 / 2 * this.props.height}
                        stroke="black"
                    />
                    <rect
                        x={boxPlotScale(boxPlotValues[1])}
                        y={1 / 4 * this.props.height}
                        height={1 / 2 * this.props.height}
                        width={boxPlotScale(boxPlotValues[3]) - boxPlotScale(boxPlotValues[1])}
                        stroke="black"
                        fill="none"
                    />
                    <line
                        x1={boxPlotScale(boxPlotValues[2])}
                        x2={boxPlotScale(boxPlotValues[2])}
                        y1={1 / 4 * this.props.height}
                        y2={3 / 4 * this.props.height}
                        stroke="black"
                    />
                    <line
                        x1={boxPlotScale(boxPlotValues[3])}
                        x2={boxPlotScale(boxPlotValues[4])}
                        y1={1 / 2 * this.props.height}
                        y2={1 / 2 * this.props.height}
                        stroke="black"
                    />
                    <line
                        x1={boxPlotScale(boxPlotValues[4])}
                        x2={boxPlotScale(boxPlotValues[4])}
                        y1={1 / 3 * this.props.height}
                        y2={2 / 3 * this.props.height}
                        stroke="black"
                    />
                </g>
            );
        }
        return (
            <g>
                {boxPlot}
                <rect
                    x={this.props.visStore.groupScale(numValues)}
                    width={this.props.visStore.groupScale(this.props.row.length - numValues)}
                    height={this.props.height}
                    fill="white"
                    stroke="lightgray"
                    onMouseEnter={e => this.props.showTooltip(e, ContinuousRow.getTooltipContent('undefined', this.props.row.length - numValues))}
                    onMouseLeave={this.props.hideTooltip}
                />
            </g>
        );
    }

    /**
     * creates a rectangle colored with the median value of the set of values at the partition
     * @param {number[]} boxPlotValues - quartiles and median of the values in the row
     * @param {number} numValues - number of values in a row
     * @returns {g}
     */
    createMedianValue(boxPlotValues, numValues) {
        return (
            <g>
                <rect
                    x="0"
                    height={this.props.height}
                    width={this.props.visStore.groupScale(numValues)}
                    fill={this.props.color(boxPlotValues[2])}
                    opacity={this.props.opacity}
                    onMouseEnter={e => this.props.showTooltip(e, `${numValues} patients: Minimum ${UtilityFunctions.getScientificNotation(boxPlotValues[0])}, Median ${UtilityFunctions.getScientificNotation(boxPlotValues[2])}, Maximum ${UtilityFunctions.getScientificNotation(boxPlotValues[4])}`)}
                    onMouseLeave={this.props.hideTooltip}
                />
                <rect
                    x={this.props.visStore.groupScale(numValues)}
                    height={this.props.height}
                    width={this.props.visStore.groupScale(this.props.row.length - numValues)}
                    fill="white"
                    stroke="lightgray"
                    opacity={this.props.opacity}
                    onMouseEnter={e => this.props.showTooltip(e, ContinuousRow.getTooltipContent('undefined', this.props.row.length - numValues))}
                    onMouseLeave={this.props.hideTooltip}
                />
            </g>
        );
    }

    handleMouseClick(event, patients) {
        if (event.button === 0) {
            this.props.dataStore.handlePartitionSelection(patients);
        }
    }

    render() {
        const values = this.props.row.filter(d => d.key !== undefined)
            .map(element => ({ patient: element.patients[0], value: element.key }))
            .sort((a, b) => (a.value - b.value));
        const boxPlotValues = ContinuousRow
            .computeBoxPlotValues(values.map(element => element.value));
        if (this.props.uiStore.continuousRepresentation === 'gradient') {
            const selectedPartitionPatients = this.props.row.map(d => d.patients[0])
                .filter(element => this.props.dataStore.selectedPatients
                    .indexOf(element) !== -1);
            return (
                this.createGradientRow(this.props.row.map(element => ({
                    patient: element.patients[0],
                    value: element.key,
                })), boxPlotValues, selectedPartitionPatients)
            );
        }
        if (this.props.uiStore.continuousRepresentation === 'boxplot') {
            return (
                this.createBoxPlot(boxPlotValues, values.length)
            );
        }

        return (this.createMedianValue(boxPlotValues, values.length));
    }
}));
ContinuousRow.propTypes = {
    row: PropTypes.arrayOf(PropTypes.object).isRequired,
    height: PropTypes.number.isRequired,
    opacity: PropTypes.number.isRequired,
    color: PropTypes.func.isRequired,
    variableDomain: MobxPropTypes.observableArrayOf(PropTypes.number).isRequired,
    showTooltip: PropTypes.func.isRequired,
    hideTooltip: PropTypes.func.isRequired,
};
export default ContinuousRow;
