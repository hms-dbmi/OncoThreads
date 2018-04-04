import React from 'react';
import {observer} from 'mobx-react';
import HeatmapRow from './HeatmapRow'

const HeatmapTimepoint = observer(class HeatmapTimepoint extends React.Component {


    getTimepoint() {
        const _self = this;
        let rows = [];
        let previousYposition = 0;
        this.props.timepoint.forEach(function (row, i) {
            let color = _self.props.visMap.getColorScale(row.variable);
            const transform = "translate(0," + previousYposition + ")";
            if (row.variable === _self.props.primaryVariable) {
                rows.push(<g key={row.variable} transform={transform}>
                    <HeatmapRow {..._self.props} row={row} timepoint={_self.props.index}
                                height={_self.props.primaryHeight}
                                opacity={1}
                                color={color}/>;
                </g>);
                previousYposition += _self.props.primaryHeight + _self.props.gap;
            }
            else {
                rows.push(<g key={row.variable} transform={transform}>
                    <HeatmapRow {..._self.props} row={row} timepoint={_self.props.index}
                                height={_self.props.secondaryHeight}
                                opacity={0.5}
                                color={color}/>;
                </g>);
                previousYposition += _self.props.secondaryHeight + _self.props.gap;
            }
        });
        return (rows)
    }

    render() {
        return (
            <g>
                {this.getTimepoint()}
            </g>
        )
    }
});
export default HeatmapTimepoint;