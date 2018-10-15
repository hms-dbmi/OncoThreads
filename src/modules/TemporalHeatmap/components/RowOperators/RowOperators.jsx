import React from 'react';
import {observer} from 'mobx-react';
import RowOperator from './RowOperator'

/*
implements the icons and their functionality on the left side of the plot
 */
const RowOperators = observer(class RowOperators extends React.Component {
        constructor() {
            super();
            this.state = {highlightedVariable: "", width: 100};
            this.highlightVariable = this.highlightVariable.bind(this);
            this.unhighlightVariable = this.unhighlightVariable.bind(this);
            this.updateDimensions=this.updateDimensions.bind(this);
        }

        /**
         * Add event listener
         */
        componentDidMount() {
            this.updateDimensions();
            window.addEventListener("resize", this.updateDimensions);
        }

        /**
         * Remove event listener
         */
        componentWillUnmount() {
            window.removeEventListener("resize", this.updateDimensions);
        }

        updateDimensions() {
            this.setState({
                width: this.refs.rowOperators.parentNode.clientWidth
            });
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
            this.props.timepoints.forEach(function (d, i) {
                let transform = "translate(0," + _self.props.posY[i] + ")";
                //Different icons and functions for grouped and ungrouped timepoints
                rowHeader.push(<RowOperator key={i} transform={transform} timepoint={d} width={_self.state.width}
                                            visMap={_self.props.visMap} store={_self.props.store}
                                            showTooltip={_self.props.showTooltip} hideTooltip={_self.props.hideTooltip}
                                            showContextMenu={_self.props.showContextMenu}
                                            openBinningModal={_self.props.openBinningModal}
                                            selectedPatients={_self.props.selectedPatients}
                                            highlightVariable={_self.props.setHighlightedVariable}
                                            unhighlightVariable={_self.props.removeHighlightedVariable}
                                            highlightedVariable={_self.props.highlightedVariable}/>);

            });
            let transform = "translate(0," + 20 + ")";
            return (
                <div ref='rowOperators'>
                    <svg width={this.state.width} height={this.props.height}>
                        <g transform={transform}>
                            {rowHeader}
                        </g>
                    </svg>
                </div>
            )
        }
    }
    )
;
export default RowOperators;
