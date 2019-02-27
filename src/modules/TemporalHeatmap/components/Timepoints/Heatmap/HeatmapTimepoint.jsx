import React from 'react';
import {inject, observer} from 'mobx-react';
import HeatmapRow from './HeatmapRow';

/*
creates a heatmap timepoint
 */
const HeatmapTimepoint = inject("visStore", "uiStore")(observer(class HeatmapTimepoint extends React.Component {
    getTimepoint() {
        let rows = [];
        let previousYposition = 0;
        this.props.timepoint.heatmap.forEach((d) => {
            const transform = "translate(0," + previousYposition + ")";
            if (!d.isUndef || this.props.uiStore.showUndefined || d.variable === this.props.timepoint.primaryVariableId) {
                let rowHeight = this.props.visStore.secondaryHeight;
                let opacity = 0.5;
                if (d.variable === this.props.timepoint.primaryVariableId) {
                    rowHeight = this.props.visStore.primaryHeight;
                    opacity = 1;
                }
                rows.push(<g key={d.variable} transform={transform}>
                    <HeatmapRow showContextMenuHeatmapRow={this.props.showContextMenuHeatmapRow}
                                {...this.props.tooltipFunctions}

                                heatmapScale={this.props.heatmapScale}
                                row={d}
                                timepointIndex={this.props.timepoint.globalIndex}
                                timepointType={this.props.timepoint.type}
                                rectWidth={this.props.rectWidth}
                                xOffset={this.props.xOffset}

                                height={rowHeight}
                                opacity={opacity}/>
                </g>);
                previousYposition += rowHeight + this.props.visStore.gap;
            }
        });
        return rows
    }

    render() {
        return (
            this.getTimepoint()
        )
    }
}));
export default HeatmapTimepoint;