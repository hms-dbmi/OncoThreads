import React from 'react';
import {inject, observer} from 'mobx-react';
import RowOperator from './RowOperator'

/**
 * Component for rowOperators of the timepoints
= */
const RowOperators = inject("rootStore")(observer(class RowOperators extends React.Component {
    render() {
        let rowHeader = [];
        this.props.rootStore.dataStore.timepoints.forEach((d, i)=> {
            let transform = "translate(0," + this.props.rootStore.visStore.timepointPositions.timepoint[i] + ")";
            //Different icons and functions for grouped and ungrouped timepoints
            rowHeader.push(<RowOperator key={i} transform={transform} timepoint={d} width={this.props.width}
                             {...this.props.tooltipFunctions}
                             showContextMenu={this.props.showContextMenu}
                             openBinningModal={this.props.openBinningModal}
                             selectedPatients={this.props.selectedPatients}
                             highlightVariable={this.props.setHighlightedVariable}
                             unhighlightVariable={this.props.removeHighlightedVariable}
                             highlightedVariable={this.props.highlightedVariable}/>);

        });
        return (
            <div ref='rowOperators'>
                <svg width={this.props.width} height={this.props.rootStore.visStore.svgHeight}>
                    {rowHeader}
                </svg>
            </div>
        )
    }
}));
export default RowOperators;
