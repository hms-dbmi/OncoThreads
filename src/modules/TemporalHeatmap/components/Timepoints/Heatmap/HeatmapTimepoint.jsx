import React from 'react';
import {observer} from 'mobx-react';
import HeatmapRow from './HeatmapRow';
//import * as d3 from 'd3';

/*
creates a heatmap timepoint
 */
const HeatmapTimepoint = observer(class HeatmapTimepoint extends React.Component {

    getTimepoint() {
        const _self = this;
        let rows = [];
        let previousYposition = 0;
        this.props.timepoint.forEach(function (row, i) {
            let color = _self.props.currentVariables[i].colorScale;
            const transform = "translate(0," + previousYposition + ")";
            if (!row.isUndef || _self.props.showUndefined || row.variable === _self.props.primaryVariableId) {
                if (row.variable === _self.props.primaryVariableId) {
                    rows.push(<g key={row.variable} transform={transform}>
                        <HeatmapRow {..._self.props} row={row} timepoint={_self.props.index}
                                    height={_self.props.primaryHeight}
                                    opacity={1}
                                    color={color}
                                    x={(_self.props.sampleRectWidth - _self.props.rectWidth) / 2}
                                    currVar={_self.props.currentVariables[i]}/>;
                    </g>);
                    previousYposition += _self.props.primaryHeight + _self.props.gap;
                }
                else {
                    rows.push(<g key={row.variable} transform={transform}>
                        <HeatmapRow {..._self.props} row={row} timepoint={_self.props.index}
                                    height={_self.props.secondaryHeight}
                                    opacity={0.5}
                                    color={color}
                                    x={(_self.props.sampleRectWidth - _self.props.rectWidth) / 2}
                                    currVar={_self.props.currentVariables[i]}/>;
                    </g>);
                    previousYposition += _self.props.secondaryHeight + _self.props.gap;
                }
            }
        });
        return (rows)
    }

    render() {
        return (
            this.getTimepoint()
        )
    }
});
export default HeatmapTimepoint;