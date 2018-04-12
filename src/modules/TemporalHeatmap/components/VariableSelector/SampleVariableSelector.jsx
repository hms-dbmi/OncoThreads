import React from "react";
import {observer} from "mobx-react";

const SampleVariableSelector = observer(class SampleVariableSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            buttonClicked: "",
        };
        this.handleSampleVariableClick = this.handleSampleVariableClick.bind(this);
    }


    static getAllIndexes(arr, val) {
        let indexes = [], i;
        for (i = 0; i < arr.length; i++)
            if (arr[i] === val)
                indexes.push(i);
        return indexes;
    }

    addVariable(variable, type, event) {
        if (this.props.currentVariables.length === 0) {
            this.props.store.initialize(variable);
        }
        this.props.store.addVariable(variable, type);
        event.target.className = "selected";
    }

    removeVariable(variable, event) {
        event.target.className = "notSelected";
        //case the row removed was not the only row
        if (this.props.currentVariables.length > 1) {


            this.props.store.removeVariable(variable);
        }
        //case: last row removed
        else {
            this.props.store.timepointData = [];
            this.props.store.primaryVariables = [];
            this.props.store.currentVariables = [];
            this.props.store.groupOrder = [];

        }
    }

    handleSampleVariableClick(event, variable, type) {
        if (!(this.props.currentVariables.map(function (d) {
                return d.variable
            }).includes(variable))) {
            this.addVariable(variable, type, event);
        }
        else {
            this.removeVariable(variable, event)
        }
    }

    handleContinousClick(event, category) {
        this.props.store.computeMaxMutationCount();
        this.props.visMap.setContinousColorScale(category, 0, this.props.store.maxMutationCount);
        this.handleSampleVariableClick(event, category, "continous")
    }


    createClinicalAttributesList() {
        let buttons = [];
        const _self = this;
        this.props.clinicalSampleCategories.forEach(function (d) {
            buttons.push(<button className="notSelected" key={d}
                                 onClick={(e) => _self.handleSampleVariableClick(e, d, "categorical")}>{d}</button>)
        });
        return buttons;
    }
    createGenomicAttributesList(){
         let buttons = [];
        const _self = this;
        buttons.push(<button className={"notSeleced"}
                             onClick={(e) => _self.handleContinousClick(e, this.props.mutationCount)}
                             key={this.props.mutationCount}>{this.props.mutationCount}</button>);
        return buttons;
    }


    render() {
        return (
            <div>
                <h4>Sample Variables</h4>
                <h5>Clinical Features</h5>
                <div className={"btn-group"}>
                    {this.createClinicalAttributesList()}
                </div>
                <h5>Genomic Features</h5>
                <div className={"btn-group"}>
                    {this.createGenomicAttributesList()}
                </div>
            </div>
        )
    }
});
export default SampleVariableSelector;