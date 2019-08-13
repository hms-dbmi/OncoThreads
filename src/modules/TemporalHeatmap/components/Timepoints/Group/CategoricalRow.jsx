import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';

/**
 * Component representing a row of a categorical variable in a partition of a grouped timepoint
 */
const CategoricalRow = inject('dataStore', 'uiStore', 'visStore')(observer(class CategoricalRow extends React.Component {
    constructor() {
        super();
        this.previousOffset = 0;
    }

    /**
     * Creates a tooltip showing information about the row
     * @param {number} numPatients - number of patients in that category
     * @return {string}
     */
    getSecondTooltipLine(numPatients) {
        return `${Math.round(numPatients / this.props.dataStore.numberOfPatients * 100)}% of total`;
    }

    static getFirstTooltipLine(value, numPatients, rowPatients) {
        if (numPatients === 1) {
            return `${value}: ${Math.round(numPatients / rowPatients * 100)}% (${numPatients} patient) of group`;
        }
        return `${value}: ${Math.round(numPatients / rowPatients * 100)}% (${numPatients} patients) of group`;
    }


    /**
     * checks if the patients in the partition are selected
     * @param {string[]} patients
     * @returns {number}
     */
    getSelected(patients) {
        return patients.filter(patient => this.props
            .dataStore.selectedPatients.includes(patient)).length;
    }

    handleMouseClick(event, patients) {
        if (event.button === 0) {
            this.props.dataStore.handlePartitionSelection(patients);
        }
    }


    /**
     * creates a parallelogram for a category
     * @param {number} x
     * @param {number} width
     * @param {number} index - current index
     * @param {number} maxIndex - maximum index in the row
     * @param {number} offset - offset for the slanted lines
     * @return {string} polygon points
     */
    transformToPolygonParallel(x, width, index, maxIndex, offset) {
        const y12 = 0;
        const y34 = this.props.height;
        let x1;
        let x2;
        let x3;
        let x4;
        if (index === 0) {
            x1 = x;
            x4 = x;
            if (index === maxIndex) {
                x2 = x + width;
                x3 = x2;
            } else {
                x3 = x + width + offset;
                x2 = x + width - offset;
            }
        } else {
            x1 = x - offset;
            x4 = x + offset;
            if (index === maxIndex) {
                x3 = x + width;
                x2 = x + width;
            } else {
                x3 = x + width + offset;
                x2 = x + width - offset;
            }
        }
        return `${x1},${y12} ${x2},${y12} ${x3},${y34} ${x4},${y34}`;
    }

    /**
     * creates a polygon with alternating slanted lines
     * @param {number} x
     * @param {number} width
     * @param {number} index - current index
     * @param {number} maxIndex - maximum index in the row
     * @param {number} offset - offset for the slanted lines
     * @return {string} polygon points
     */
    transformToPolygonAlternating(x, width, index, maxIndex, offset) {
        const y12 = 0;
        const y34 = this.props.height;
        let x1;
        let x2;
        let x3;
        let x4;
        let adaptedOffset = offset;
        if (width / 2 < adaptedOffset) {
            adaptedOffset = width / 2;
        }
        if (index === 0) {
            x1 = x;
            x4 = x;
            if (index === maxIndex) {
                x2 = x + width;
                x3 = x2;
            } else {
                x3 = x + width - adaptedOffset;
                x2 = x + width + adaptedOffset;
            }
        } else {
            x1 = x - adaptedOffset;
            x4 = x + adaptedOffset;
            if (index === maxIndex) {
                x3 = x + width;
                x2 = x + width;
            } else {
                x3 = x + width - adaptedOffset;
                x2 = x + width + adaptedOffset;
            }
        }
        return `${x1},${y12} ${x2},${y12} ${x3},${y34} ${x4},${y34}`;
    }

    /**
     * creates a polygon with alternating slanted lines
     * @param {number} x
     * @param {number} width
     * @param {number} index - current index
     * @param {number} maxIndex - maximum index in the row
     * @param {number} previousOffset - previous slanted line offset
     * @param {number} newOffset - new slanted line offset
     * @return {string} polygon points
     */
    transformToPolygonRandom(x, width, index, maxIndex, previousOffset, newOffset) {
        const y12 = 0;
        const y34 = this.props.height;
        let x1;
        let x2;
        let x3;
        let x4;
        if (index === 0) {
            x1 = x;
            x4 = x;
            if (index === maxIndex) {
                x2 = x + width;
                x3 = x2;
            } else {
                x3 = x + width + newOffset;
                x2 = x + width - newOffset;
            }
        } else {
            x1 = x - previousOffset;
            x4 = x + previousOffset;
            if (index === maxIndex) {
                x3 = x + width;
                x2 = x + width;
            } else {
                x3 = x + width + newOffset;
                x2 = x + width - newOffset;
            }
        }
        return `${x1},${y12} ${x2},${y12} ${x3},${y34} ${x4},${y34}`;
    }

    /**
     * creates a row showing the different categories
     * and their proportions for a categorical variable
     * @return {rect[]}
     */
    createRow() {
        const rowPatients = this.props.row.reduce((sum, curr) => sum + curr.patients.length, 0);
        const rects = [];
        let currCounts = 0;
        let offset;
        if (!this.props.uiStore.horizontalStacking) {
            if (this.props.uiStore.slantedLines === 'singleDir') {
                offset = this.props.height / 2;
            } else if (this.props.uiStore.slantedLines === 'altAcross') {
                if (this.props.isEven) {
                    offset = this.props.height / 2;
                } else {
                    offset = -this.props.height / 2;
                }
            } else if (this.props.uiStore.slantedLines === 'none') {
                offset = 0;
            }

            this.props.row.forEach((f, i) => {
                let partitionPoints;
                let
                    selectedPoints;
                let fill = this.props.color(f.key);
                let stroke = this.props.stroke;
                if (f.key === undefined) {
                    if (stroke === 'none') {
                        stroke = 'lightgray';
                    }
                    fill = 'white';
                }
                if (this.props.uiStore.slantedLines === 'altWithin') {
                    if (i % 2 === 0) {
                        offset = this.props.height / 2;
                    } else {
                        offset = -this.props.height / 2;
                    }
                    partitionPoints = this.transformToPolygonAlternating(
                        this.props.visStore.groupScale(currCounts),
                        this.props.visStore.groupScale(f.patients.length),
                        i, this.props.row.length - 1, offset,
                    );
                    selectedPoints = this.transformToPolygonAlternating(
                        this.props.visStore.groupScale(currCounts),
                        this.props.visStore.groupScale(this.getSelected(f.patients)),
                        i, this.props.row.length - 1, offset,
                    );
                } else if (this.props.uiStore.slantedLines === 'random') {
                    offset = Math.random() * this.props.height - this.props.height / 2;
                    partitionPoints = this.transformToPolygonRandom(
                        this.props.visStore.groupScale(currCounts),
                        this.props.visStore.groupScale(f.patients.length),
                        i, this.props.row.length - 1, this.previousOffset, offset,
                    );
                    selectedPoints = this.transformToPolygonRandom(
                        this.props.visStore.groupScale(currCounts),
                        this.props.visStore.groupScale(this.getSelected(f.patients)),
                        i, this.props.row.length - 1, this.previousOffset, offset,
                    );
                    this.previousOffset = offset;
                } else {
                    partitionPoints = this.transformToPolygonParallel(
                        this.props.visStore.groupScale(currCounts),
                        this.props.visStore.groupScale(f.patients.length),
                        i, this.props.row.length - 1, offset,
                    );
                    selectedPoints = this.transformToPolygonParallel(
                        this.props.visStore.groupScale(currCounts),
                        this.props.visStore.groupScale(this.getSelected(f.patients)),
                        i, this.props.row.length - 1, offset,
                    );
                }
                rects.push(<polygon
                    onClick={e => this.handleMouseClick(e, f.patients)}
                    points={partitionPoints}
                    key={`${f.key}`}
                    onMouseEnter={e => this.props.showTooltip(e,
                        CategoricalRow.getFirstTooltipLine(f.key, f.patients.length, rowPatients))}
                    onMouseLeave={this.props.hideTooltip}
                    fill={fill}
                    stroke={stroke}
                    opacity={this.props.opacity}
                />);
                if (this.props.uiStore.advancedSelection) {
                    if (this.getSelected(f.patients) > 0) {
                        rects.push(
                            <polygon
                                points={selectedPoints}
                                key={`${f.key}selected`}
                                fill="none"
                                stroke="black"
                            />,
                        );
                    }
                }
                currCounts += f.patients.length;
            });
        } else {
            this.props.row.forEach((row) => {
                let fill = this.props.color(row.key);
                let stroke = this.props.stroke;
                if (row.key === undefined) {
                    if (stroke === 'none') {
                        stroke = 'lightgray';
                    }
                    fill = 'white';
                }
                const height = row.patients.length
                    / this.props.patients.length * (this.props.height - 1);
                const y = currCounts / this.props.patients.length * (this.props.height - 1);
                rects.push(<rect
                    key={`${row.key}`}
                    x="0"
                    y={y}
                    height={height}
                    opacity={this.props.opacity}
                    width={this.props.visStore.groupScale(this.props.patients.length)}
                    fill={fill}
                    stroke={stroke}
                    onMouseEnter={e => this.props.showTooltip(e,
                        CategoricalRow.getFirstTooltipLine(row.key, row.patients.length,
                            rowPatients))}
                    onMouseLeave={this.props.hideTooltip}
                />);
                currCounts += row.patients.length;
            });
        }
        return rects;
    }

    render() {
        return (
            this.createRow()
        );
    }
}));
CategoricalRow.propTypes = {
    height: PropTypes.number.isRequired,
    isEven: PropTypes.bool.isRequired,
    color: PropTypes.func.isRequired,
    stroke: PropTypes.string.isRequired,
    opacity: PropTypes.number.isRequired,
    row: PropTypes.arrayOf(PropTypes.object),
    showTooltip: PropTypes.func.isRequired,
    hideTooltip: PropTypes.func.isRequired,
};
export default CategoricalRow;
