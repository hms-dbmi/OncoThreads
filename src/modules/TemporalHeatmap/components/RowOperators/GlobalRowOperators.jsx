import React from 'react';
import {observer} from 'mobx-react';
import ReactMixins from './../../../../utils/ReactMixins';
import GlobalRowOperator from './GlobalRowOperator'

/*
implements the icons and their functionality on the left side of the plot
 */
const GlobalRowOperators = observer(class GlobalRowOperators extends React.Component {
        constructor() {
            super();
            this.state = {highlightedVariable: "", width: 0};
            ReactMixins.call(this);
            this.highlightVariable = this.highlightVariable.bind(this);
            this.unhighlightVariable = this.unhighlightVariable.bind(this);
            this.numOfBetweenVars = 0;
        }

        highlightVariable(variable) {
            this.setState({highlightedVariable: variable})
        }

        unhighlightVariable() {
            this.setState({highlightedVariable: ""})
        }

        render() {
            let rowHeader = [];
            const _self = this;
            var i = 0;
            //var d=this.props.timepoints[0];
            //for(var i=0; i<2; i++){
            var d = this.props.timepoints[i];
            //this.props.timepoints.forEach(function (d, i) {
            let transform = "translate(0," + _self.props.posY[i] + ")";
            //Different icons and functions for grouped and ungrouped timepoints
            rowHeader.push(<GlobalRowOperator key={i} transform={transform} timepoint={d} width={_self.state.width}
                                              visMap={_self.props.visMap} store={_self.props.store}
                                              showTooltip={_self.props.showTooltip} hideTooltip={_self.props.hideTooltip}
                                              showContextMenu={_self.props.showContextMenu}
                                              openBinningModal={_self.props.openBinningModal}
                                              selectedPatients={_self.props.selectedPatients}
                                              highlightVariable={_self.highlightVariable}
                                              unhighlightVariable={_self.unhighlightVariable}
                                              highlightedVariable={_self.state.highlightedVariable}/>);

            _self.numOfBetweenVars = _self.props.store.variableStore.between.allVariables.filter(d => !d.derived).length
                - _self.props.store.variableStore.between.allVariables.filter(d => d.derived).length
                - _self.numOfBetweenVars;

            //});
            //}

            //if(_self.props.store.){

            //}
            if (_self.props.store.rootStore.transitionOn && _self.props.store.rootStore.sampleTimepointStore.variableStore.allVariables.length !== 0) {
                i = 1;
                d = this.props.timepoints[i];

                let transform = "translate(0," + _self.props.posY[i] + ")";
                //Different icons and functions for grouped and ungrouped timepoints
                rowHeader.push(<GlobalRowOperator key={i} transform={transform} timepoint={d} width={_self.state.width}
                                                  visMap={_self.props.visMap} store={_self.props.store}
                                                  showTooltip={_self.props.showTooltip}
                                                  hideTooltip={_self.props.hideTooltip}
                                                  showContextMenu={_self.props.showContextMenu}
                                                  openBinningModal={_self.props.openBinningModal}
                                                  selectedPatients={_self.props.selectedPatients}
                                                  highlightVariable={_self.highlightVariable}
                                                  unhighlightVariable={_self.unhighlightVariable}
                                                  highlightedVariable={_self.state.highlightedVariable}/>);


            }
            let transform2 = "translate(0," + 20 + ")";
            return (
                <div>
                    <svg width={this.state.width} height={this.props.height}>
                        <g transform={transform2}>
                            {rowHeader}
                        </g>
                    </svg>
                </div>
            )
        }
    }
    )
;
export default GlobalRowOperators;
