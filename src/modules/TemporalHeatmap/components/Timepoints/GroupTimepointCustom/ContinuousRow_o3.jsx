import React from 'react';
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react';
import uuidv4 from 'uuid/v4';
import * as d3 from 'd3';
import PropTypes from 'prop-types';
import { extendObservable } from 'mobx';
import {getScientificNotation} from 'modules/TemporalHeatmap/UtilityClasses/UtilityFunctions';
import ColorScales from 'modules/TemporalHeatmap/UtilityClasses/ColorScales';

/**
 * Component representing a row of a categorical variable in a grouped partition of a timepoint
 */
const ContinuousRow = inject('dataStore', 'uiStore', 'visStore')(observer(class ContinuousRow extends React.Component {
   

    constructor() {
        super();
        
    }

    drawRowDist(){
        let {variableDomain, height, row} = this.props
        let getBinHeight = (value) => (value-variableDomain[0])/(variableDomain[1]-variableDomain[0]) * height 
        

        let pathString = `M 0, ${height}`, currentPos = [0,0] 
        row.sort((a,b)=>a.key-b.key).forEach(d=>{
            let {key, patients} = d
            let binWidth = this.props.visStore.groupScale(patients.length), binHeight = getBinHeight(key)
            pathString += `l${0},${-binHeight-currentPos[1]} l ${binWidth}, ${0}`
            currentPos = [binWidth+currentPos[0], -1*binHeight]
        })
        pathString += `l 0 ${-1*currentPos[1]} z`
        return <path d={pathString} fill='lightgray'/>
    }



    render() {
        return <g className="continupusRow">
            {this.drawRowDist()}
            </g>
    }
}));
ContinuousRow.propTypes = {
    row: PropTypes.arrayOf(PropTypes.object).isRequired,
    height: PropTypes.number.isRequired,
    opacity: PropTypes.number.isRequired,
    color: PropTypes.func.isRequired,
    variableDomain: MobxPropTypes.observableArrayOf(PropTypes.number).isRequired,
    showTooltip: PropTypes.func.isRequired,
    hideTooltip: PropTypes.func.isRequired,
};
export default ContinuousRow;
