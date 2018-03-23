import React from "react";
import {observer} from "mobx-react";

const VariableSelector = observer(class VariableSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            selectedVariables: []
        };
        this.handleSampleCategoryClick = this.handleSampleCategoryClick.bind(this);
    }

    static getAllIndexes(arr, val) {
        let indexes = [], i;
        for (i = 0; i < arr.length; i++)
            if (arr[i] === val)
                indexes.push(i);
        return indexes;
    }

    handleSampleCategoryClick(category) {
        if (!this.state.selectedVariables.includes(category)) {
            if (this.props.store.sampleData.length === 0) {
                this.props.store.initialize(category);
            }
            this.props.store.addVariable(category);
            this.setState({selectedVariables: [...this.state.selectedVariables, category]})
        }
        else {
            //case the row removed was not the only row
            if(this.props.store.currentVariables.length>1) {
                if (this.props.store.primaryVariables.includes(category)) {
                    let newPrimary = "";
                    const tps = VariableSelector.getAllIndexes(this.props.store.primaryVariables, category);
                    let rowIndex = -1;
                    let _self = this;
                    tps.forEach(function (f) {
                        _self.props.store.sampleData[f].heatmap.forEach(function (d, i) {
                            if (d.variable === category) {
                                rowIndex = i;
                            }
                        });
                        if (rowIndex === 0) {
                            newPrimary = _self.props.store.currentVariables[1];
                        }
                        else {
                            newPrimary = _self.props.store.currentVariables[0];
                        }
                        _self.props.store.setPrimaryVariable(f, newPrimary);

                    });
                }

                let selectedVariables = this.state.selectedVariables.slice();
                selectedVariables.splice(selectedVariables.indexOf(category), 1);
                this.setState({selectedVariables: selectedVariables});
                this.props.store.removeVariable(category);
            }
            //case:
            else{
                this.props.store.sampleData=[];
                this.props.store.primaryVariables=[];
                this.setState({selectedVariables: []})

            }
        }
    }

    handleTransitionClick() {

    }

    createSampleAttributeList() {
        let buttons = [];
        const _self = this;
        this.props.clinicalSampleCategories.forEach(function (d) {
            buttons.push(<button key={d} onClick={() => _self.handleSampleCategoryClick(d)}>{d}</button>)
        });
        return buttons;
    }

    createTransitionsList() {
        let buttons = [];
        this.props.eventCategories.forEach(function (d) {
            if (d !== "SPECIMEN") {
                buttons.push(<button key={d}>{d}</button>)
            }
        });
        return buttons;
    }

    render() {
        return (
            <div>
                <h4>Clinical Features</h4>
                <div className={"btn-group"}>
                    <h5>Sample variables</h5>
                    {this.createSampleAttributeList()}
                    <h5>Transition variables</h5>

                    {this.createTransitionsList()}
                </div>
            </div>
        )
    }
});
export default VariableSelector;