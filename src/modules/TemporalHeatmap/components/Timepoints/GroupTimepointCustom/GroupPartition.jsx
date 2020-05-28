import React from 'react';
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react';
import { extendObservable } from 'mobx';
import {Input} from 'antd'

import PropTypes from 'prop-types';
import CategoricalRow from './CategoricalRow';
import ContinuousRow from './ContinuousRow';
import DerivedVariable from '../../../stores/DerivedVariable';
import OriginalVariable from '../../../stores/OriginalVariable';

import {getColorByName} from 'modules/TemporalHeatmap/UtilityClasses/'
import {getTextWidth} from 'modules/TemporalHeatmap/UtilityClasses/UtilityFunctions'

import './GroupPartition.css'

/**
 * Component for a partition in a grouped timepiint
 */
const GroupPartition = inject('dataStore', 'visStore', 'uiStore')(observer(class GroupPartition extends React.Component {
    constructor(props){
        super(props)
        this.changeLabel = this.changeLabel.bind(this)
        extendObservable(this, {
            hasBackground: true
        })
        
    }
    createPartition() {
        let previousYposition = 0;
        const rows = [];
        let totalH = 0
        this.props.partition.rows.forEach((d, i) => {
            if (!this.props.heatmap[i].isUndef
                || this.props.uiStore.showUndefined
                || d.variable === this.props.primaryVariableId) {
                const color = this.props.currentVariables[i].colorScale;
                // let height = 0;
                // let opacity = 1;
                let height = this.props.visStore.secondaryHeight;
                let opacity = 0.5;
                let stroke = 'none';
                let shiftOffset = 0;
                if (i % 2 !== 0) {
                    shiftOffset = this.props.uiStore.rowOffset;
                }
                const transform = `translate(${shiftOffset},${previousYposition})`;
                if (this.props.primaryVariableId === d.variable) {
                    height = this.props.visStore.primaryHeight;
                    stroke = this.props.stroke;
                } 

                totalH += height
                // else {
                //     height = this.props.visStore.secondaryHeight;
                //     opacity = 0.5;
                // }
                // create different types of rows depending on the variables datatype
                if (this.props.currentVariables[i].datatype === 'NUMBER') {
                    rows.push(
                        <g key={d.variable} transform={transform}>
                            <ContinuousRow
                                row={d.counts}
                                height={height}
                                opacity={opacity}
                                color={color}
                                stroke={stroke}
                                variableDomain={this.props.currentVariables[i].domain}
                                {...this.props.tooltipFunctions}
                            />
                        </g>,
                    );
                } else {
                    rows.push(
                        <g key={d.variable} transform={transform}>
                            <CategoricalRow
                                row={d.counts}
                                patients={this.props.partition.patients}
                                height={height}
                                opacity={opacity}
                                color={color}
                                stroke={stroke}
                                isEven={i % 2 === 0}
                                {...this.props.tooltipFunctions}
                            />
                        </g>,
                    );
                }
                previousYposition += height + this.props.uiStore.horizontalGap;
            }
        });

        let totalW = this.props.visStore.groupScale(this.props.partition.patients.length)
        return {totalH, totalW, rows};
    }
    
    changeLabel(e){
        this.props.dataStore
        .setStageLabel(this.props.partition.partition, e.target.value)
    }


    render() {
        let stageInputLabel = <g/>, stageKey = this.props.partition.partition||'', 
        stageBackground = <g/>

        let {rows, totalH, totalW} = this.createPartition()

        // add changable stage label if this is a sample timepoint
        if(this.props.type=='sample'){
            const fontWeight=700,
                // labelColor = colors[stageKey.charCodeAt(0)-65]||'black',
                
            stageName = this.props.stageLabels[stageKey]===undefined?
                stageKey:this.props.stageLabels[stageKey],

            labelColor = getColorByName(stageKey),
            labelHeight = this.props.visStore.primaryHeight, 
            labelWidth = Math.max(getTextWidth(stageName, 14, fontWeight)+25, 40)

            stageInputLabel =  <foreignObject style={{width:labelWidth, height:labelHeight}}>
                <Input value={stageName} style={{color: labelColor, fontWeight:fontWeight}}
                onChange={this.changeLabel}/>    
            </foreignObject> 

            stageBackground = <g className='stageBackground'>
                <rect 
            className='stageBackground'
            opacity={0.8}
            width={this.props.hasBackground?totalW:0} 
            height={totalH} 
            fill={getColorByName(stageKey)} />
            <circle 
            r= {4}
            cx={totalW-2}
            cy={totalH-2}
            stroke='lightgray'
            onClick={()=>{this.hasBackground=!this.hasBackground}}
            />
            </g>
        }

        return  <g className={`partitions ${stageKey}`} ref={this.ref}>
            {rows}   
            {stageBackground} 
            {stageInputLabel}
        </g>;
    }
}));
GroupPartition.propTypes = {
    partition: PropTypes.shape({
        partition: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
        rows: PropTypes.array,
        patients: PropTypes.array,
    }),
    heatmap: MobxPropTypes.observableArrayOf(PropTypes.object).isRequired,
    primaryVariableId: PropTypes.string.isRequired,
    currentVariables: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.instanceOf(DerivedVariable),
        PropTypes.instanceOf(OriginalVariable),
    ])).isRequired,
    stroke: PropTypes.string.isRequired,
    tooltipFunctions: PropTypes.objectOf(PropTypes.func),
    stageLabels: PropTypes.object.isRequired,
    hasBackground: PropTypes.bool.isRequired
};
export default GroupPartition;
