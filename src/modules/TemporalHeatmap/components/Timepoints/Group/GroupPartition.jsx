import React from 'react';
import {inject, observer} from 'mobx-react';

import CategoricalRow from './CategoricalRow'
import ContinuousRow from "./ContinuousRow";

/**
 * Component for a partition in a grouped timepiint
 */
const GroupPartition = inject("dataStore", "visStore","uiStore")(observer(class GroupPartition extends React.Component {
    createPartition() {
        const _self = this;
        let previousYposition = 0;
        let rows = [];
        this.props.partition.rows.forEach(function (d, i) {
            if (!_self.props.heatmap[i].isUndef || _self.props.uiStore.showUndefined || d.variable === _self.props.primaryVariableId) {
                const color = _self.props.currentVariables[i].colorScale;
                let height = 0;
                let opacity = 1;
                let stroke = "none";
                const transform = "translate(0," + previousYposition + ")";
                if (_self.props.primaryVariableId === d.variable) {
                    height = _self.props.visStore.primaryHeight;
                    stroke = _self.props.stroke;
                }
                else {
                    height = _self.props.visStore.secondaryHeight;
                    opacity = 0.5;
                }
                // create different types of rows depending on the variables datatype
                if (_self.props.currentVariables[i].datatype === "NUMBER") {
                    rows.push(<g key={d.variable} transform={transform}><ContinuousRow row={d.counts}
                                                                                       height={height}
                                                                                       opacity={opacity} color={color}
                                                                                       stroke={stroke}
                                                                                       variableDomain={_self.props.currentVariables[i].domain}
                                                                                       {..._self.props.tooltipFunctions}/>
                    </g>);
                }
                else {
                    rows.push(<g key={d.variable} transform={transform}><CategoricalRow row={d.counts}
                                                                                        height={height}
                                                                                        opacity={opacity}
                                                                                        color={color}
                                                                                        stroke={stroke}
                                                                                        isEven={i%2===0}
                                                                                        {..._self.props.tooltipFunctions}/>
                    </g>);
                }
                previousYposition += height + _self.props.visStore.gap;
            }

        });
        return rows;
    }

    render() {
        return (
            this.createPartition()
        )
    }
}));
export default GroupPartition;