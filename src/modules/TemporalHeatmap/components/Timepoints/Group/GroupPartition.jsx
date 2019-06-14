import React from 'react';
import {inject, observer} from 'mobx-react';

import CategoricalRow from './CategoricalRow'
import ContinuousRow from "./ContinuousRow";

/**
 * Component for a partition in a grouped timepiint
 */
const GroupPartition = inject("dataStore", "visStore", "uiStore")(observer(class GroupPartition extends React.Component {
    createPartition() {
        let previousYposition = 0;
        let rows = [];
        this.props.partition.rows.forEach((d, i) => {
            if (!this.props.heatmap[i].isUndef || this.props.uiStore.showUndefined || d.variable === this.props.primaryVariableId) {
                const color = this.props.currentVariables[i].colorScale;
                let height = 0;
                let opacity = 1;
                let stroke = "none";
                const transform = "translate(0," + previousYposition + ")";
                if (this.props.primaryVariableId === d.variable) {
                    height = this.props.visStore.primaryHeight;
                    stroke = this.props.stroke;
                }
                else {
                    height = this.props.visStore.secondaryHeight;
                    opacity = 0.5;
                }
                // create different types of rows depending on the variables datatype
                if (this.props.currentVariables[i].datatype === "NUMBER") {
                    rows.push(<g key={d.variable} transform={transform}><ContinuousRow row={d.counts}
                                                                                       height={height}
                                                                                       opacity={opacity} color={color}
                                                                                       stroke={stroke}
                                                                                       variableDomain={this.props.currentVariables[i].domain}
                                                                                       {...this.props.tooltipFunctions}/>
                    </g>);
                }
                else {
                    rows.push(<g key={d.variable} transform={transform}><CategoricalRow row={d.counts}
                                                                                        patients={this.props.partition.patients}
                                                                                        height={height}
                                                                                        opacity={opacity}
                                                                                        color={color}
                                                                                        stroke={stroke}
                                                                                        isEven={i % 2 === 0}
                                                                                        {...this.props.tooltipFunctions}/>
                    </g>);
                }
                previousYposition += height + this.props.visStore.gap;
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