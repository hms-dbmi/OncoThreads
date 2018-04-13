import React from 'react';
import {observer} from 'mobx-react';
/*
creats a row in the heatmap
 */
const HeatmapRow = observer(class HeatmapRow extends React.Component {
    getRow() {
        let rects = [];
        const _self = this;
        this.props.row.data.forEach(function (d) {
            rects.push(<rect key={d.patient} height={_self.props.height} width={_self.props.rectWidth}
                             x={_self.props.heatmapScale(d.patient)+_self.props.x}
                             fill={_self.props.color(d.value)} opacity={_self.props.opacity}/>);
        });
        return rects;

    }

    render() {
        return (
            this.getRow()
        )
    }
});
export default HeatmapRow;