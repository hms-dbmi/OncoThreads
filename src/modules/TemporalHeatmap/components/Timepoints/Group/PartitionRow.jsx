import React from 'react';
import {observer} from 'mobx-react';
/*
creates a row in a partition of a grouped timepoint
 */
const PartitionRow = observer(class PartitionRow extends React.Component {
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
                             onMouseEnter={(e) => _self.props.showTooltip(e, PartitionRow.getTooltipContent(f.key, f.value))}
                             onMouseLeave={_self.props.hideTooltip} width={_self.props.groupScale(f.value)}
                             x={_self.props.groupScale(currCounts)} height={_self.props.height}
                             fill={fill} stroke={stroke} opacity={_self.props.opacity}/>);
            currCounts += f.value
        });
        return rects
    }

    render() {
        return (
            this.createRow()
        )
    }
});
export default PartitionRow;