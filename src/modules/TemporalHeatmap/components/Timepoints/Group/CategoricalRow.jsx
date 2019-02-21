import React from 'react';
import {observer} from 'mobx-react';
/*
creates a row in a partition of a grouped timepoint
 */
const CategoricalRow = observer(class CategoricalRow extends React.Component {
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
                             onMouseLeave={_self.props.hideTooltip} width={_self.props.groupScale(f.patients.length)}
                             x={_self.props.groupScale(currCounts)} height={_self.props.height}
                             fill={fill} stroke={stroke} opacity={_self.props.opacity}/>);
            if (_self.props.store.advancedSelection) {
                rects.push(
                    <rect key={f.key + 'selected'}
                          width={_self.props.groupScale(_self.getSelected(f.patients))}
                          x={_self.props.groupScale(currCounts)} height={_self.props.height}
                          fill='none' stroke='black'/>
                );
            }
            currCounts += f.patients.length
        });
        return rects
    }

    /**
     * checks if the patients in the partition are selected
     * @param patients
     * @returns {boolean}
     */
    getSelected(patients) {
        let selected = 0;
        for (let i = 0; i < patients.length; i++) {
            if (this.props.store.selectedPatients.includes(patients[i])) {
                selected += 1;
            }
        }
        return selected;
    }

    render() {
        return (
            this.createRow()
        )
    }
});
export default CategoricalRow;