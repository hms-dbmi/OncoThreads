import React from 'react';
import {inject, observer} from 'mobx-react';

/**
 * Component for creating lines for each patient in the global timeline
 */
const GlobalTransition = inject("dataStore", "visStore")(observer(class GlobalTransition extends React.Component {

    /**
     * Draws a line for the Line transition
     * @param {number} x0 - x pos on first timepoint
     * @param {number} x1 - x pos on second timepoint
     * @param {number} y0 - y pos
     * @param {number} y1 - y pos + height
     * @param {string} key - (unique)
     * @param {string} strokeColor
     * @param {number} strokeWidth
     * @returns {path}
     */
    static drawLine(x0, x1, y0, y1, key, strokeColor, strokeWidth) {
        let path = "M" + x0 + "," + y0
            + "L" + x1 + "," + y1;
        return (<path key={key} d={path} stroke={strokeColor} strokeWidth={strokeWidth} fill="none"/>)
    }

    /**
     * draws one line for each patient
     * @returns {(rect|path)[]}
     */
    drawLines() {
        let lines = [];
        this.props.patients.forEach(d => {
            let strokeColor = "lightgray";
            if (this.props.dataStore.selectedPatients.includes(d)) {
                strokeColor = "black"
            }
            let finalValueColor = "lightgray";
            let endHeight = 1;
            let mouseProperties = [];
            if (this.props.minMax[d].value !== undefined) {
                endHeight = 3;
                mouseProperties = {
                    onMouseEnter: (e) => this.props.showTooltip(e, this.props.minMax[d].value + ": ", this.props.minMax[d].end + " days"),
                    onMouseLeave: this.props.hideTooltip
                };
                if (this.props.minMax[d].value === "DECEASED") {
                    finalValueColor = "black"
                }
            }
            lines.push(
                GlobalTransition.drawLine(this.props.heatmapScale(d) + this.props.visStore.timelineRectSize / 2,
                    this.props.heatmapScale(d) + this.props.visStore.timelineRectSize / 2,
                    this.props.visStore.timeScale(this.props.minMax[d].start),
                    this.props.visStore.timeScale(this.props.minMax[d].end),
                    d, strokeColor, 1));
            lines.push(<rect key={d + "endpoint"}
                             x={this.props.heatmapScale(d)}
                             y={this.props.visStore.timeScale(this.props.minMax[d].end)}
                             width={this.props.visStore.timelineRectSize}
                             height={endHeight}
                             fill={finalValueColor}
                             {...mouseProperties}
            />);
        });
        return lines;
    }

    render() {
        return (
            this.drawLines()
        )
    }
}));
export default GlobalTransition;