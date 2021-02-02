import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Tooltip } from 'antd';

/**
 * Component representing a row of a categorical variable in a partition of a grouped timepoint
 */
const CategoricalRow = inject('dataStore', 'uiStore', 'visStore')(observer(class CategoricalRow extends React.Component {
    strokeW = 4;
    constructor() {
        super();
        this.previousOffset = 0;
    }

    drawRowDist(){
        let {variableDomain, height, row} = this.props

        let getRectY = (value)=>variableDomain.indexOf(value)/variableDomain.length*(height-this.strokeW)
        

        let currentX = 0
        let rowDist= [] 
        row.sort((a,b)=>a.key-b.key).forEach((d,i)=>{
            let {key, patients} = d
            let binWidth = this.props.visStore.groupScale(patients.length), 
                binHeight = key===undefined? 0: 1/variableDomain.length*(height-this.strokeW), 
                offsetY = key===undefined? 0: getRectY(key)

            let oneCate = <rect className={key} key={i} x={currentX} width={binWidth} height={binHeight} y={offsetY} fill="lightgray"/>
            rowDist.push(oneCate)
            currentX += binWidth
        })

        rowDist.push(
            <line key="base" x1={0} x2={currentX} y1={height-this.strokeW/2} y2={height-this.strokeW/2} 
                strokeWidth={this.strokeW} stroke={this.props.stateColor}
                />
        )

        rowDist.unshift(<rect key="background" className="background" fill="white" width={currentX} height={height} key="bg"/>)

        
        
        return rowDist
    }

    render() {
        let tooltipTitle = this.props.row.map((d)=><span key={d.key}>{`${d.key}: ${d.patients.length} patients`} <br/> </span>)
        tooltipTitle.unshift(<span key="title">{this.props.variable} <br/></span>)
        return <Tooltip title={tooltipTitle} destroyTooltipOnHide>
            <g className="categoricalRow">
            {this.drawRowDist()}
            </g>
            </Tooltip>
    }
}));
CategoricalRow.propTypes = {
    variable: PropTypes.string,
    height: PropTypes.number.isRequired,
    // color: PropTypes.func.isRequired,
    stateColor: PropTypes.string.isRequired,
    row: PropTypes.arrayOf(PropTypes.object)
};
export default CategoricalRow;
