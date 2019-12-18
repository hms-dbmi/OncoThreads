import React from 'react';
import PropTypes from 'prop-types';
import { inject, observer } from 'mobx-react';

/**
 * Component for creating lines for each patient in the global timeline
 */
const GlobalTransition = inject('dataStore', 'visStore')(observer(class GlobalTransition extends React.Component {
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
        const path = `M${x0},${y0
        }L${x1},${y1}`;
        return (<path key={key} d={path} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" />);
    }

    /**
     * draws one line for each patient
     * @returns {(rect|path)[]}
     */
    drawLines() {
        const lines = [];
        this.props.patients.forEach((d) => {
            let strokeColor = 'lightgray';
            if (this.props.dataStore.selectedPatients.includes(d)) {
                strokeColor = 'black';
            }
            let finalValueColor = 'lightgray';
            let endHeight = 1;
            let mouseProperties = [];
            if (this.props.minMax[d].status !== undefined) {
                endHeight = 3;
                mouseProperties = {
                    onMouseEnter: e => this.props.showTooltip(e, `${this.props.minMax[d].status}: `, `${this.props.minMax[d].end} days`),
                    onMouseLeave: this.props.hideTooltip,
                };
                if (this.props.minMax[d].status === 'DECEASED') {
                    finalValueColor = 'black';
                }
            }
            lines.push(<rect
                key={`${d}startpoint`}
                x={this.props.heatmapScale(d) + this.props.visStore.timelineRectSize/4}
                y={this.props.visStore.timeScale(this.props.minMax[d].start)}
                width={this.props.visStore.timelineRectSize/2}
                height={1}
                fill={strokeColor}
            />);
            lines.push(
                GlobalTransition.drawLine(this.props.heatmapScale(d)
                    + this.props.visStore.timelineRectSize / 2,
                this.props.heatmapScale(d) + this.props.visStore.timelineRectSize / 2,
                this.props.visStore.timeScale(this.props.minMax[d].start),
                this.props.visStore.timeScale(this.props.minMax[d].end),
                d, strokeColor, 1),
            );
            /*lines.push(<rect
                key={`${d}endpoint`}
                x={this.props.heatmapScale(d)}
                y={this.props.visStore.timeScale(this.props.minMax[d].end)}
                width={this.props.visStore.timelineRectSize}
                height={endHeight}
                fill={finalValueColor}
                {...mouseProperties}
            />);*/

            if (this.props.minMax[d].status === 'DECEASED'){
                lines.push(<rect
                    key={`${d}endpoint`}
                    x={this.props.heatmapScale(d) + this.props.visStore.timelineRectSize/4}
                    y={this.props.visStore.timeScale(this.props.minMax[d].end)}
                    width={this.props.visStore.timelineRectSize/2}
                    height={endHeight}
                    fill={finalValueColor}
                    {...mouseProperties}
                />);
    
            }
            else{
                let x1=this.props.heatmapScale(d) + this.props.visStore.timelineRectSize/4;
                let x2=x1+this.props.visStore.timelineRectSize/2;
                let y1=this.props.visStore.timeScale(this.props.minMax[d].end);
                let y2=y1;
                let x3=(x1+x2)/2;
                let y3=y1+4;
                let points = [];
                points.push(
                    `${x1},${y1}`
                );
                points.push(
                    `${x2},${y2}`
                );
                points.push(
                    `${x3},${y3}`
                );
                lines.push(<polygon 
                    points={points}
                    fill={finalValueColor}
                    {...mouseProperties}
                    />
                );
            }
            
            //<polygon points="200,10 250,190 160,210" style="fill:grey;stroke:purple;stroke-width:1" />

        });
        return lines;
    }

    render() {
        return (
            this.drawLines()
        );
    }
}));
GlobalTransition.propTypes = {
    patients: PropTypes.arrayOf(PropTypes.string).isRequired,
    minMax: PropTypes.objectOf(PropTypes.object).isRequired,
    heatmapScale: PropTypes.func.isRequired,
    showTooltip: PropTypes.func.isRequired,
    hideTooltip: PropTypes.func.isRequired,
};
export default GlobalTransition;
