import React from "react";
import {observer} from "mobx-react";
/*
creates the selector for sample variables (left side of main view, top)
 */
const SampleVariableSelector = observer(class SampleVariableSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            buttonClicked: "",
        };
        this.handleVariableClick = this.handleVariableClick.bind(this);
    }

    /**
     * method to the indices of all occurences of val in arr
     * @param arr
     * @param val
     * @returns {Array}
     */
    static getAllIndices(arr, val) {
        let indexes = [], i;
        for (i = 0; i < arr.length; i++)
            if (arr[i] === val)
                indexes.push(i);
        return indexes;
    }

    /**
     * adds a variable to the view
     * @param variable
     * @param type
     * @param dataset
     * @param event
     */
    addVariable(variable, type, dataset, event) {
        if (this.props.currentVariables.length === 0) {
            this.props.store.initialize(variable);
        }
        this.props.store.addVariable(variable, type, dataset);
    }


    /**
     * handles a click on one of the categorical Variables
     * @param event
     * @param variable
     * @param type
     * @param dataset
     */
    handleVariableClick(event, variable, type, dataset) {
        if (!(this.props.currentVariables.map(function (d) {
                return d.variable
            }).includes(variable))) {
            this.addVariable(variable, type, dataset, event);
        }
    }

    /**
     * TODO: generalize
     * handles a click on one of the continuous Variables
     * @param event
     * @param category
     * @param dataset
     */
    handleContinousClick(event, category, dataset) {
        this.props.store.computeMaxMutationCount();
        this.props.visMap.setContinousColorScale(category, 0, this.props.store.maxMutationCount);
        this.handleVariableClick(event, category, "NUMBER", dataset)
    }

    /**
     * creates a list of the clinical Variables
     * @returns {Array}
     */
    createClinicalAttributesList() {
        let buttons = [];
        const _self = this;
        this.props.clinicalSampleCategories.forEach(function (d) {
            buttons.push(<button className={"btn"} key={d.variable}
                                 onClick={(e) => _self.handleVariableClick(e, d.variable, d.datatype, "clinical")}>{d.variable}</button>)
        });
        return buttons;
    }

    /**
     * creates a list of the genomic variables
     * @returns {Array}
     */
    createGenomicAttributesList() {
        let buttons = [];
        const _self = this;
        buttons.push(<button className={"btn"}
                             onClick={(e) => _self.handleContinousClick(e, this.props.mutationCount, "mutationCount")}
                             key={this.props.mutationCount}>{this.props.mutationCount}</button>);
        return buttons;
    }


    render() {
        return (
            <div>
                <h5>Sample Variables</h5>
                <div className="btn-group-vertical btn-block">
                    <button className="btn btn-dark btn-block" data-toggle="collapse" href="#collapseClinical">Clinical
                        Features ▼
                    </button>
                    <div id="collapseClinical" className="panel-collapse collapse btn-block">
                                                <div className="btn-group-vertical btn-block">
                        {this.createClinicalAttributesList()}
                                                </div>
                    </div>
                    <button className="btn btn-dark btn-block" data-toggle="collapse" href="#collapseGenomic">Genomic
                        Features ▼
                    </button>
                    <div id="collapseGenomic" className="panel-collapse collapse btn-block">
                        <div className="btn-group-vertical btn-block">
                        {this.createGenomicAttributesList()}
                        </div>
                    </div>

                </div>


            </div>

        )
    }
});
export default SampleVariableSelector;