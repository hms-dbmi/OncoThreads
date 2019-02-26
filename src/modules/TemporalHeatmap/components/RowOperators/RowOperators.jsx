import React from 'react';
import {inject, observer} from 'mobx-react';
import RowOperator from './RowOperator'

/*
implements the icons and their functionality on the left side of the plot
 */
const RowOperators = inject("rootStore")(observer(class RowOperators extends React.Component {
    constructor() {
        super();
        this.state = {highlightedVariable: "", width: 100};
        this.highlightVariable = this.highlightVariable.bind(this);
        this.unhighlightVariable = this.unhighlightVariable.bind(this);
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

    highlightVariable(variable) {
        this.setState({highlightedVariable: variable})
    }

    unhighlightVariable() {
        this.setState({highlightedVariable: ""})
    }

    render() {
        let rowHeader = [];
        this.props.rootStore.dataStore.timepoints.forEach((d, i)=> {
            let transform = "translate(0," + this.props.rootStore.visStore.timepointPositions.timepoint[i] + ")";
            //Different icons and functions for grouped and ungrouped timepoints
            rowHeader.push(<RowOperator key={i} transform={transform} timepoint={d} width={this.state.width}
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
                <svg width={this.state.width} height={this.props.rootStore.visStore.svgHeight}>
                    {rowHeader}
                </svg>
            </div>
        )
    }
}));
export default RowOperators;
