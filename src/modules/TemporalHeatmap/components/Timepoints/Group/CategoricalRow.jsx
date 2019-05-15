import React from 'react';
import {inject, observer} from 'mobx-react';

/**
 * Component representing a row of a categorical variable in a partition of a grouped timepoint
 */
const CategoricalRow = inject("dataStore", "uiStore", "visStore")(observer(class CategoricalRow extends React.Component {
    /**
     * Creates a tooltip showing information about the row
     * @param {string} value - category
     * @param {number} numPatients - number of patients in that category
     * @return {string}
     */
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
     * creates a row showing the different categories and their proportions for a categorical variable
     * @return {rect[]}
     */
    createRow() {
        let rects = [];
        let currCounts = 0;
        let offset;
        if (this.props.uiStore.slantedLines === "singleDir") {
            offset = 3;
        }
        else if (this.props.uiStore.slantedLines === "altAcross") {
            if (this.props.isEven) {
                offset = 3;
            }
            else {
                offset = -3;
            }
        }
        else if (this.props.uiStore.slantedLines === "none") {
            offset = 0;
        }
        let partitionPoints, selectedPoints;

        this.props.row.forEach((f, i) => {
            let fill = this.props.color(f.key);
            let stroke = this.props.stroke;
            if (f.key === undefined) {
                if (stroke === "none") {
                    stroke = "lightgray";
                }
                fill = "white"
            }
            if (this.props.uiStore.slantedLines === "altWithin") {
                if(i%2===0){
                    offset=3;
                }
                else{
                    offset=-3;
                }
                partitionPoints = this.transformToPolygonAlternating(this.props.visStore.groupScale(currCounts), this.props.visStore.groupScale(f.patients.length), i, this.props.row.length - 1, offset);
                selectedPoints = this.transformToPolygonAlternating(this.props.visStore.groupScale(currCounts), this.props.visStore.groupScale(this.getSelected(f.patients)), i, this.props.row.length - 1, offset);
            }
            else {
                partitionPoints = this.transformToPolygonParallel(this.props.visStore.groupScale(currCounts), this.props.visStore.groupScale(f.patients.length), i, this.props.row.length - 1, offset);
                selectedPoints = this.transformToPolygonParallel(this.props.visStore.groupScale(currCounts), this.props.visStore.groupScale(this.getSelected(f.patients)), i, this.props.row.length - 1, offset);
            }
            rects.push(<polygon
                points={partitionPoints}
                key={"" + f.key}
                onMouseEnter={(e) => this.props.showTooltip(e, CategoricalRow.getTooltipContent(f.key, f.patients.length))}
                onMouseLeave={this.props.hideTooltip}
                fill={fill} stroke={stroke} opacity={this.props.opacity}/>);
            if (this.props.uiStore.advancedSelection) {
                if (this.getSelected(f.patients) > 0) {
                    rects.push(
                        <polygon
                            points={selectedPoints}
                            key={f.key + 'selected'}
                            fill='none' stroke='black'/>
                    );
                }
            }
            currCounts += f.patients.length
        });
        return rects
    }


    transformToPolygonParallel(x, width, index, maxIndex, offset) {
        let x1, x2, x3, x4, y1, y2, y3, y4;
        y1 = y2 = 0;
        y3 = y4 = this.props.height;
        if (index === 0) {
            x1 = x;
            x4 = x;
            if (index === maxIndex) {
                x2 = x3 = x + width;

            }
            else {
                x3 = x + width + offset;
                x2 = x + width - offset;
            }
        }
        else {
            x1 = x - offset;
            x4 = x + offset;
            if (index === maxIndex) {
                x3 = x + width;
                x2 = x + width;
            }
            else {
                x3 = x + width + offset;
                x2 = x + width - offset;
            }
        }
        return x1 + "," + y1 + " " + x2 + "," + y2 + " " + x3 + "," + y3 + " " + x4 + "," + y4;
    }

    transformToPolygonAlternating(x, width, index, maxIndex, offset) {
        let x1, x2, x3, x4, y1, y2, y3, y4;
        y1 = y2 = 0;
        y3 = y4 = this.props.height;
        if (index === 0) {
            x1 = x;
            x4 = x;
            if (index === maxIndex) {
                x2 = x3 = x + width;

            }
            else {
                x3 = x + width - offset;
                x2 = x + width + offset;
            }
        }
        else {
            x1 = x - offset;
            x4 = x + offset;
            if (index === maxIndex) {
                x3 = x + width;
                x2 = x + width;
            }
            else {
                x3 = x + width - offset;
                x2 = x + width + offset;
            }
        }
        return x1 + "," + y1 + " " + x2 + "," + y2 + " " + x3 + "," + y3 + " " + x4 + "," + y4;
    }

    /**
     * checks if the patients in the partition are selected
     * @param {string[]} patients
     * @returns {number}
     */
    getSelected(patients) {
        return patients.filter(patient => this.props.dataStore.selectedPatients.includes(patient)).length
    }

    render() {
        return (
            this.createRow()
        )
    }
}));
export default CategoricalRow;