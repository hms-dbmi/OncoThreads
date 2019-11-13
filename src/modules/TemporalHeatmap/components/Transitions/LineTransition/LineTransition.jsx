import React from 'react';
import * as d3 from 'd3';
import PropTypes from 'prop-types';
import { inject, observer } from 'mobx-react';

/**
 * Component for line transition between two heatmap timepoints
 */
const LineTransition = inject('dataStore', 'visStore', 'uiStore')(observer(class LineTransition extends React.Component {
    /**
     * Draws a line for the Line transition
     * @param {number} x0 - x pos on first timepoint
     * @param {number} x1 - x pos on second timepoint
     * @param {number} y0 - y pos
     * @param {number} y1 - y pos + height
     * @param {string} key - (unique)
     * @param {boolean} mode - normal mode (true) or real time mode (false)
     * @param {string} strokeColor
     * @returns {path}
     */
    static drawLine(x0, x1, y0, y1, key, mode, strokeColor) {
        const curvature = 0.5;
        const yi = d3.interpolateNumber(y0, y1);


        const y2 = yi(curvature);


        const y3 = yi(1 - curvature);

        const path = `M${x0},${y0
        }C${x0},${y2
        } ${x1},${y3
        } ${x1},${y1}`;
        if (mode) {
            return (<path key={`${key}-solid`} d={path} stroke={strokeColor} fill="none" />);
        }
        return (<path key={`${key}-dashed`} d={path} stroke={strokeColor} strokeDasharray="5, 5" fill="none" />);
    }

    /**
     * creates lines for normal line transition
     * @return {path[]}
     */
    drawDefaultLines() {
        const lines = [];
        this.props.from.forEach((d, i) => {
            if (this.props.to && this.props.to.includes(d)) {
                let strokeColor = 'lightgray';
                if (this.props.dataStore.selectedPatients.includes(d)) {
                    strokeColor = 'black';
                }
                lines.push(LineTransition.drawLine(this.props.firstHeatmapScale(d)
                    + this.props.visStore.sampleRectWidth / 2,
                this.props.secondHeatmapScale(d) + this.props.visStore.sampleRectWidth / 2,
                0, this.props.visStore.transitionSpaces[this.props.index],
                d + i, true, strokeColor));
            }
        });
        return lines;
    }


    /**
     * draws lines for realTime mode
     * @return {(path|rect)[]}
     */
    drawRealtimeLines() {
        const lines = [];
        const currentRow = this.props.secondTimepoint.heatmap
            .filter(d => d.variable === this.props.secondTimepoint.primaryVariableId)[0].data;
        const maximum = Math.max(...currentRow
            .map(row => this.props.timeGapMapper[row.sample])
            .filter(d => d !== undefined));
        currentRow.forEach((d) => {
            let strokeColor = 'lightgray';
            if (this.props.dataStore.selectedPatients.includes(d.patient)) {
                strokeColor = 'black';
            }
            const frac = this.props.timeGapMapper[d.sample] / maximum;
            if (this.props.from.includes(d.patient)) {
                lines.push(LineTransition.drawLine(
                    this.props.firstHeatmapScale(d.patient)
                    + this.props.visStore.sampleRectWidth / 2,
                    this.props.firstHeatmapScale(d.patient) * (1 - frac)
                    + this.props.secondHeatmapScale(d.patient) * (frac)
                    + this.props.visStore.sampleRectWidth / 2,
                    0,
                    this.props.visStore.transitionSpaces[this.props.index] * frac, d.patient,
                    true, strokeColor,
                ));
                if (frac !== 1) {
                    lines.push(LineTransition.drawLine(
                        this.props.firstHeatmapScale(d.patient) * (1 - frac)
                        + this.props.secondHeatmapScale(d.patient) * (frac)
                        + this.props.visStore.sampleRectWidth / 2,
                        this.props.secondHeatmapScale(d.patient)
                        + this.props.visStore.sampleRectWidth / 2,
                        this.props.visStore.transitionSpaces[this.props.index] * frac,
                        this.props.visStore.transitionSpaces[this.props.index],
                        d.patient, false, strokeColor,
                    ));
                    const color = this.props.colorScale(d.value);

                    lines.push(
                        <rect
                            key={`${d.patient}_proxy`}
                            x={this.props.firstHeatmapScale(d.patient) * (1 - frac)
                            + this.props.secondHeatmapScale(d.patient) * (frac)
                            + this.props.visStore.sampleRectWidth / 4}
                            y={this.props.visStore.transitionSpaces[this.props.index] * frac}
                            width={this.props.visStore.sampleRectWidth / 2}
                            height={this.props.visStore.sampleRectWidth / 6}
                            fill={color}
                            onMouseOver={e => this.props.tooltipFunctions.showTooltip(e, 'Sample taken in day: '+this.props.timeGapMapper[d.sample])}
                            onMouseOut={this.props.tooltipFunctions.hideTooltip}
                        />,
                    );
                }
            }
        });
        return lines;
    }

    /*showTooltip(e, text) {
        this.tooltipVisibility = 'visible';
        this.text = text;
       
    }

    
    hideTooltip() {
        this.tooltipVisibility = 'hidden';
    }*/


    render() {
        if (this.props.uiStore.realTime) {
            return (
                this.drawRealtimeLines()
            );
        }

        return (
            this.drawDefaultLines()
        );
    }
}));
LineTransition.propTypes = {
    from: PropTypes.arrayOf(PropTypes.string).isRequired,
    to: PropTypes.arrayOf(PropTypes.string).isRequired,
    firstHeatmapScale: PropTypes.func.isRequired,
    secondHeatmapScale: PropTypes.func.isRequired,
    timeGapMapper: PropTypes.objectOf(PropTypes.number).isRequired,
    colorScale: PropTypes.func.isRequired,
};
export default LineTransition;
