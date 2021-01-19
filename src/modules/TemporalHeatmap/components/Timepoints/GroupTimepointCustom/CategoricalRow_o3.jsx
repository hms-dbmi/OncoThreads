import React from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';

/**
 * Component representing a row of a categorical variable in a partition of a grouped timepoint
 */
const CategoricalRow = inject('dataStore', 'uiStore', 'visStore')(observer(class CategoricalRow extends React.Component {
    constructor() {
        super();
        this.previousOffset = 0;
    }

    drawRowDist(){
        let {variableDomain, height, row} = this.props

        let getRectY = (value)=>variableDomain.indexOf(value)/variableDomain.length*height
        

        let currentX = 0
        let rowDist= [] 
        row.sort((a,b)=>a.key-b.key).forEach(d=>{
            let {key, patients} = d
            let binWidth = this.props.visStore.groupScale(patients.length), binHeight = 1/variableDomain.length*height, offsetY = getRectY(key)
            let oneCate = <rect className={key} key={key} x={currentX} width={binWidth} height={binHeight} y={offsetY} fill="lightgray"/>
            rowDist.push(oneCate)
            currentX += binWidth
        })
        
        return rowDist
    }

    render() {
        return <g className="categoricalRow">
            {this.drawRowDist()}
            </g>
    }
}));
CategoricalRow.propTypes = {
    height: PropTypes.number.isRequired,
    isEven: PropTypes.bool.isRequired,
    color: PropTypes.func.isRequired,
    stroke: PropTypes.string.isRequired,
    opacity: PropTypes.number.isRequired,
    row: PropTypes.arrayOf(PropTypes.object),
    showTooltip: PropTypes.func.isRequired,
    hideTooltip: PropTypes.func.isRequired,
};
export default CategoricalRow;
