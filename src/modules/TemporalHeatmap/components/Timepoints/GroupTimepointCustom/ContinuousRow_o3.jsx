import React from 'react';
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react';
import PropTypes from 'prop-types';
import { Tooltip } from 'antd';

/**
 * Component representing a row of a categorical variable in a grouped partition of a timepoint
 */
const ContinuousRow = inject('dataStore', 'uiStore', 'visStore')(observer(class ContinuousRow extends React.Component {
   strokeW = 4;
    drawRowDist(){
        
        let {variableDomain, height, row, variable} = this.props
        let getBinHeight = (value) => (value-variableDomain[0])/(variableDomain[1]-variableDomain[0]) * (height-this.strokeW) 
        

        let pathString = `M 0, ${height}`, currentPos = [0,0] 
        row.sort((a,b)=>a.key-b.key).forEach(d=>{
            let {key, patients} = d
            
            let binWidth = this.props.visStore.groupScale(patients.length), binHeight = key === undefined? 0:getBinHeight(key)
            pathString += `l${0},${-binHeight-currentPos[1]} l ${binWidth}, ${0}`
            currentPos = [binWidth+currentPos[0], -1*binHeight]
        })
        pathString += `l 0 ${-1*currentPos[1]} z`

        let tooltipTitle = `${variable}: ${Math.min(...row.map(d=>d.key))}~${Math.max(...row.map(d=>d.key))}`
        return <Tooltip title={tooltipTitle}>
            <g className="continupusRow">
                <rect className="background" key="background" width={currentPos[0]} height={height} fill="white"/>
                <path d={pathString} fill='lightgray' />
                <line x1={0} x2={currentPos[0]} strokeWidth={this.strokeW} stroke={this.props.stateColor} y1={height-0.5*this.strokeW} y2={height-0.5*this.strokeW}/>
            </g>
        </Tooltip>
    }



    render() {
        return this.drawRowDist()
    }
}));
ContinuousRow.propTypes = {
    variable: PropTypes.string,
    row: PropTypes.arrayOf(PropTypes.object).isRequired,
    height: PropTypes.number.isRequired,
    opacity: PropTypes.number.isRequired,
    // color: PropTypes.func.isRequired,
    stateColor: PropTypes.string.isRequired,
    variableDomain: MobxPropTypes.observableArrayOf(PropTypes.number).isRequired
};
export default ContinuousRow;
