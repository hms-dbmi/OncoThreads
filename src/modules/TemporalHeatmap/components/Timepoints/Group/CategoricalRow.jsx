import React from 'react';
import {observer,inject} from 'mobx-react';

/**
 * Component representing a row of a categorical variable in a partition of a grouped timepoint
 */
const CategoricalRow = inject("dataStore","uiStore","visStore")(observer(class CategoricalRow extends React.Component {
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
        const _self = this;
        this.props.row.forEach(function (f) {
            let fill = _self.props.color(f.key);
            let stroke = _self.props.stroke;
            if (f.key === undefined) {
                if (stroke === "none") {
                    stroke = "lightgray";
                }
                fill = "white"
            }
            rects.push(<rect key={f.key}
                             onMouseEnter={(e) => _self.props.showTooltip(e, CategoricalRow.getTooltipContent(f.key, f.patients.length))}
                             onMouseLeave={_self.props.hideTooltip} width={_self.props.visStore.groupScale(f.patients.length)}
                             x={_self.props.visStore.groupScale(currCounts)} height={_self.props.height}
                             fill={fill} stroke={stroke} opacity={_self.props.opacity}/>);
            if (_self.props.uiStore.advancedSelection) {
                rects.push(
                    <rect key={f.key + 'selected'}
                          width={_self.props.visStore.groupScale(_self.getSelected(f.patients))}
                          x={_self.props.visStore.groupScale(currCounts)} height={_self.props.height}
                          fill='none' stroke='black'/>
                );
            }
            currCounts += f.patients.length
        });
        return rects
    }

    /**
     * checks if the patients in the partition are selected
     * @param {string[]} patients
     * @returns {number}
     */
    getSelected(patients) {
        return patients.filter(patient=>this.props.dataStore.selectedPatients.includes(patient)).length
    }

    render() {
        return (
            this.createRow()
        )
    }
}));
export default CategoricalRow;