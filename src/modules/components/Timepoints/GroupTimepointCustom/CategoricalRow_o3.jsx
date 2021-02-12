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
        let {variableDomain, height, row, stateColor} = this.props

        let getRectY = (value)=>variableDomain.indexOf(value)/variableDomain.length*(height-this.strokeW)
        

        let currentX = 0
        let rowDist= [] 
        row.sort((a,b)=>a.key-b.key).forEach((d,i)=>{
            let {key, patients} = d
            let binWidth = this.props.visStore.groupScale(patients.length), 
                binHeight = key===undefined? 0: 1/variableDomain.length*(height-this.strokeW), 
                offsetY = key===undefined? 0: getRectY(key)

            let oneCate = <rect className={key} key={i} x={currentX} width={binWidth} height={binHeight} y={offsetY} fill="#999"/>
            rowDist.push(oneCate)
            currentX += binWidth
        })

        rowDist.unshift(<rect key="background" className="background" width={currentX} height={height-this.strokeW} fill={stateColor} opacity={0.1} />)
        rowDist.push(
            <rect key="outline" className="outline" fill="none" width={currentX} height={height-this.strokeW} strokeWidth={1} stroke='black' />
        )
        return <g className="categoricalRow" transform={`translate(0, ${this.strokeW})`}>  {rowDist} </g>
    }

    render() {
        let tooltipTitle = this.props.row.map((d)=><span key={d.key}>{`${d.key}: ${d.patients.length} patients`} <br/> </span>)
        tooltipTitle.unshift(<span key="title">{this.props.variable} <br/></span>)
        return <Tooltip title={tooltipTitle} destroyTooltipOnHide>
            {this.drawRowDist()}
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
