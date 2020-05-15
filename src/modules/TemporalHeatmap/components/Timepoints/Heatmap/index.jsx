import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import HeatmapRow from './HeatmapRow';
import SingleTimepoint from '../../../stores/SingleTimepoint';

/**
 * Component for creating a heatmap timepoint
 */
const HeatmapTimepoint = inject('visStore', 'uiStore')(observer(class HeatmapTimepoint extends React.Component {
    getTimepoint() {
        const rows = [];
        let previousYposition = 0;
        
        this.props.timepoint.heatmap.forEach((d) => {
            const transform = `translate(0,${previousYposition})`;
            if (!d.isUndef || this.props.uiStore.showUndefined
                || d.variable === this.props.timepoint.primaryVariableId) {
                let rowHeight = this.props.visStore.secondaryHeight;
                let opacity = 0.5;
                if (d.variable === this.props.timepoint.primaryVariableId) {
                    rowHeight = this.props.visStore.primaryHeight;
                    opacity = 1;
                }
                rows.push(
                    <g key={d.variable} transform={transform} className='heatmap row'>
                        <HeatmapRow
                            showContextMenuHeatmapRow={this.props.showContextMenuHeatmapRow}
                            {...this.props.tooltipFunctions}

                            heatmapScale={this.props.heatmapScale}
                            row={d}
                            timepointIndex={this.props.timepoint.globalIndex}
                            timepointType={this.props.timepoint.type}
                            rectWidth={this.props.rectWidth}
                            xOffset={this.props.xOffset}

                            height={rowHeight}
                            opacity={opacity}
                        />
                    </g>,
                );
                previousYposition += rowHeight + this.props.uiStore.horizontalGap;
            }
        });
        return rows;
    }

    render() {
        return (
            this.getTimepoint()
        );
    }
}));
HeatmapTimepoint.propTypes = {
    timepoint: PropTypes.instanceOf(SingleTimepoint).isRequired,
    showContextMenuHeatmapRow: PropTypes.func.isRequired,
    tooltipFunctions: PropTypes.objectOf(PropTypes.func.isRequired),
    heatmapScale: PropTypes.func.isRequired,
    rectWidth: PropTypes.number.isRequired,
    xOffset: PropTypes.number.isRequired,
};
export default HeatmapTimepoint;
