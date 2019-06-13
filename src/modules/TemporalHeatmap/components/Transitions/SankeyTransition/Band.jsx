import React from 'react';
import * as d3 from 'd3';
import {inject, observer} from 'mobx-react';
/*
implements a Band for Sankey Transition
 */
const Band = inject("dataStore", "visStore")(observer(class Band extends React.Component {

    /**
     * creates the partition names for the tooltip: adapts the partition names of the primary variables
     * @param primaryVariable
     * @param partitionValue
     * @returns {*}
     */
    static getTooltipPartitionName(primaryVariable, partitionValue) {
        if (primaryVariable.datatype === "binary") {
            if (partitionValue === false) {
                return "no " + primaryVariable.name;
            }
            else {
                return primaryVariable.name;
            }
        }
        else {
            return partitionValue;
        }
    }

    /**
     * Gets the width for the selected part of the band
     * @returns {number}
     */
    getSelectedWidth() {
        let numSelected = 0;
        const _self = this;
        this.props.dataStore.selectedPatients.forEach(function (d, i) {
            if (_self.props.patients.includes(d)) {
                numSelected += 1;
            }
        });
        return (this.props.width * (numSelected / this.props.patients.length))
    }

    /**
     * gets the path for a band
     * @param {number} x0
     * @param {number} x1
     * @param {number} y0
     * @param {number} y1
     * @param {number} width
     */
    static getPath(x0, x1, y0, y1, width) {
        const curvature = .5;
        const yi = d3.interpolateNumber(y0, y1),
            y2 = yi(curvature),
            y3 = yi(1 - curvature);
        return ("M" + x0 + "," + y0
            + "C" + x0 + "," + y2
            + " " + x1 + "," + y3
            + " " + x1 + "," + y1
            + "L" + (x1 + width) + "," + y1
            + "C" + (x1 + width) + "," + y3
            + " " + (x0 + width) + "," + y2
            + " " + (x0 + width) + "," + y0
            + "L" + x0 + "," + y0)
    }

    /**
     * gets the paths for the outline of a band
     * @param {number} x0
     * @param {number} x1
     * @param {number} y0
     * @param {number} y1
     * @param {number} width
     * @return {*[]}
     */
    static getOutlinePaths(x0, x1, y0, y1, width) {
        const curvature = .5;
        const yi = d3.interpolateNumber(y0, y1),
            y2 = yi(curvature),
            y3 = yi(1 - curvature);
        return <g>
            <path d={"M" + x0 + "," + y0
            + "C" + x0 + "," + y2
            + " " + x1 + "," + y3
            + " " + x1 + "," + y1} stroke={"#cccccc"} fill={"none"} opacity={0.5}/>
            <path d={"M" + (x1 + width) + "," + y1
            + "C" + (x1 + width) + "," + y3
            + " " + (x0 + width) + "," + y2
            + " " + (x0 + width) + "," + y0} stroke={"#cccccc"} fill={"none"} opacity={0.5}/>
        </g>
    }

    handleMouseClick(event, patients) {
        if (event.button === 0) {
            this.props.dataStore.handlePartitionSelection(patients);
        }
    }

    render() {
        const source = Band.getTooltipPartitionName(this.props.firstPrimary, this.props.firstPartition);
        const target = Band.getTooltipPartitionName(this.props.secondPrimary, this.props.secondPartition);
        const selectedWidth = this.getSelectedWidth();
        const y0 = this.props.visStore.gap + this.props.visStore.colorRectHeight + this.props.visStore.bandRectHeight,
            y1 = this.props.visStore.transitionSpace - this.props.visStore.gap - this.props.visStore.colorRectHeight - this.props.visStore.bandRectHeight;
        let selected = null;
        if (selectedWidth !== 0) {
            selected = <path onClick={(e) => this.handleMouseClick(e, this.props.patients)} d={Band.getPath(this.props.x0, this.props.x1, y0, y1, selectedWidth)}
                             fill={"#afafaf"} opacity={0.5}/>
        }
        let notSelected = <g>
            <path onClick={(e) => this.handleMouseClick(e, this.props.patients)} key={"band"}
                  d={Band.getPath(this.props.x0 + selectedWidth, this.props.x1 + selectedWidth, y0, y1, this.props.width - selectedWidth)}
                  fill={"#dddddd"} opacity={0.5}/>
            {Band.getOutlinePaths(this.props.x0, this.props.x1, y0, y1, this.props.width)}</g>;
        return (
            <g onMouseEnter={(e) => this.props.showTooltip(e, source + " -> " + target + ": " + this.props.patients.length)}
               onMouseLeave={this.props.hideTooltip}>
                {selected}
                {notSelected}
            </g>)
    }
}));
export default Band;