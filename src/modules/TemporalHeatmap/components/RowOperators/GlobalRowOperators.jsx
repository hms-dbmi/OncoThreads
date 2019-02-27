import React from 'react';
import {inject, observer} from 'mobx-react';
import GlobalRowOperator from './GlobalRowOperator'

/*
implements the icons and their functionality on the left side of the plot
 */
const GlobalRowOperators = inject("dataStore")(observer(class GlobalRowOperators extends React.Component {
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
            if (this.props.dataStore.transitionOn) {
                i = 1;
            }
            else {
                i = 0;
            }
            const d = this.props.dataStore.timepoints[i];
            return <GlobalRowOperator timepoint={d} width={this.state.width}
                                      height={this.props.dataStore.variableStores.sample.currentVariables.length * 20}
                                      {...this.props.tooltipFunctions}/>
        }

        getEventRowHeader() {
            let i;
            if (this.props.dataStore.transitionOn) {
                i = 0;
                const d = this.props.dataStore.timepoints[i];
                return <GlobalRowOperator timepoint={d} width={this.state.width}
                                          height={this.props.dataStore.variableStores.between.getRelatedVariables("event").length * 20}
                                          {...this.props.tooltipFunctions}/>
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
    ))
;
export default GlobalRowOperators;
