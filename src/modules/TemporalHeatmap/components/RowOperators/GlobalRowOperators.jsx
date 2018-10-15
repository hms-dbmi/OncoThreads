import React from 'react';
import {observer} from 'mobx-react';
import GlobalRowOperator from './GlobalRowOperator'

/*
implements the icons and their functionality on the left side of the plot
 */
const GlobalRowOperators = observer(class GlobalRowOperators extends React.Component {
        constructor() {
            super();
            this.state = {width: 100};
            this.updateDimensions = this.updateDimensions.bind(this);
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

        getSampleRowHeader() {
            let i;
            if (this.props.store.transitionOn) {
                i = 1;
            }
            else {
                i = 0;
            }
            const d = this.props.timepoints[i];
            return <svg width={this.state.width} height={this.props.timepointVarHeight}>
                <GlobalRowOperator timepoint={d} width={this.state.width}
                                   visMap={this.props.visMap} store={this.props.store}
                                   showTooltip={this.props.showTooltip}
                                   hideTooltip={this.props.hideTooltip}
                                   showContextMenu={this.props.showContextMenu}
                                   openBinningModal={this.props.openBinningModal}
                                   selectedPatients={this.props.selectedPatients}
                                   highlightVariable={this.highlightVariable}
                                   unhighlightVariable={this.unhighlightVariable}
                                   highlightedVariable={this.state.highlightedVariable}/>
            </svg>
        }

        getEventRowHeader() {
            let i;
            if (this.props.store.transitionOn) {
                i = 0;
                const d = this.props.timepoints[i];
                return <svg width={this.state.width} height={this.props.eventVarHeight}>
                    <GlobalRowOperator timepoint={d} width={this.state.width}
                                       visMap={this.props.visMap} store={this.props.store}
                                       showTooltip={this.props.showTooltip}
                                       hideTooltip={this.props.hideTooltip}
                                       showContextMenu={this.props.showContextMenu}
                                       openBinningModal={this.props.openBinningModal}
                                       selectedPatients={this.props.selectedPatients}
                                       highlightVariable={this.highlightVariable}
                                       unhighlightVariable={this.unhighlightVariable}
                                       highlightedVariable={this.state.highlightedVariable}/></svg>
            }
            else {
                return "-"
            }
        }

        render() {
            return (
                <div ref={"rowOperators"}>
                    <h5>Current timepoint variables</h5>
                    {this.getSampleRowHeader()}
                    <h5>Current events</h5>
                    {this.getEventRowHeader()}
                </div>
            )
        }
    }
    )
;
export default GlobalRowOperators;
