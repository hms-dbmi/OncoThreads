import React from 'react';
import {observer} from 'mobx-react';

const PartitionRow = observer(class PartitionRow extends React.Component {
    createRow() {
        let rects = [];
        let currCounts = 0;
        const _self = this;
        this.props.row.forEach(function (f, j) {
            rects.push(<rect key={f.key + j} width={_self.props.groupScale(f.value)} x={_self.props.groupScale(currCounts)} height={_self.props.height}
                             fill={_self.props.color(f.key)} opacity={_self.props.opacity}/>);
            currCounts += f.value
        });
        return rects
    }

    render() {
        return (
            <g>
                {this.createRow()}
            </g>
        )
    }
});
export default PartitionRow;