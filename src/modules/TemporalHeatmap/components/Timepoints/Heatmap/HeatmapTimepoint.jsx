import React from 'react';
import {inject, observer} from 'mobx-react';
import HeatmapRow from './HeatmapRow';

/*
creates a heatmap timepoint
 */
const HeatmapTimepoint = inject("dataStore", "visStore", "variableStore", "uiStore")(observer(class HeatmapTimepoint extends React.Component {
    getTimepoint() {
        const _self = this;
        let rows = [];
        let previousYposition = 0;
        this.props.variableStore.fullCurrentVariables.forEach((variable, i) => {
            const transform = "translate(0," + previousYposition + ")";
            if (!this.props.heatmap[i].isUndef || _self.props.uiStore.showUndefined || this.props.heatmap[i].variable === _self.props.primaryVariableId) {
                let rowHeight = _self.props.visStore.secondaryHeight;
                let opacity = 0.5;
                if (variable.id === _self.props.primaryVariableId) {
                    rowHeight = _self.props.visStore.primaryHeight;
                    opacity = 1;
                }
                rows.push(<g key={variable.id} transform={transform}>
                    <HeatmapRow showContextMenuHeatmapRow={_self.props.showContextMenuHeatmapRow}
                                {..._self.props.tooltipFunctions}

                                heatmapScale={_self.props.heatmapScale}
                                row={this.props.heatmap[i]}
                                timepointIndex={_self.props.index}
                                variableStore={_self.props.variableStore}
                                rectWidth={_self.props.rectWidth}
                                xOffset={_self.props.xOffset}
                                currVar={variable}

                                height={rowHeight}
                                opacity={opacity}/>
                </g>);
                previousYposition += rowHeight + _self.props.visStore.gap;

            }
        });
        return (rows)
    }

    render() {
        return (
            this.getTimepoint()
        )
    }
}));
export default HeatmapTimepoint;