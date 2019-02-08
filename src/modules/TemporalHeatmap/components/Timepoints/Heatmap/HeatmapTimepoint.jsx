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
            const transform = "translate(0," + previousYposition + ")";
            if (!row.isUndef || _self.props.store.showUndefined || row.variable === _self.props.primaryVariableId) {
                let rowHeight = _self.props.visMap.secondaryHeight;
                let opacity = 0.5;
                if (row.variable === _self.props.primaryVariableId) {
                    rowHeight = _self.props.visMap.primaryHeight;
                    opacity = 1;
                }
                rows.push(<g key={row.variable} transform={transform}>
                    <HeatmapRow showContextMenuHeatmapRow={_self.props.showContextMenuHeatmapRow}
                                store={_self.props.store}
                                {..._self.props.tooltipFunctions}

                                heatmapScale={_self.props.heatmapScale}
                                row={row}
                                timepointIndex={_self.props.index}
                                rectWidth={_self.props.rectWidth}
                                xOffset={_self.props.xOffset}
                                currVar={_self.props.currentVariables[i]}

                                height={rowHeight}
                                opacity={opacity}/>;
                </g>);
                previousYposition += rowHeight + _self.props.visMap.gap;

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