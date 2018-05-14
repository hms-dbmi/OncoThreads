import React from "react";
import {observer} from "mobx-react";
import {Button,ButtonGroup,Panel} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';

/*
creates the selector for sample variables (left side of main view, top)
 */
const SampleVariableSelector = observer(class SampleVariableSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            buttonClicked: "",
            clinicalOpen:true,
            clinicalIcon:"caret-down",
            mutationIcon:"caret-right"
        };
        this.handleVariableClick = this.handleVariableClick.bind(this);
        this.toggleClinicalIcon=this.toggleClinicalIcon.bind(this);
        this.toggleMutationIcon=this.toggleMutationIcon.bind(this);
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
            buttons.push(<Button key={d.variable} onClick={(e) => _self.handleVariableClick(e, d.variable, d.datatype, "clinical")}>{d.variable}</Button>)
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
        buttons.push(<Button onClick={(e) => _self.handleContinousClick(e, this.props.mutationCount, "mutationCount")}
                             key={this.props.mutationCount}>{this.props.mutationCount}</Button>);
        return buttons;
    }
    static toggleIcon(icon){
        if(icon==="caret-down"){
            return "caret-right"
        }
        else{
            return "caret-down"
        }
    }
    toggleClinicalIcon(){
        this.setState({clinicalIcon:SampleVariableSelector.toggleIcon(this.state.clinicalIcon)});
    }
    toggleMutationIcon(){
        this.setState({mutationIcon:SampleVariableSelector.toggleIcon(this.state.mutationIcon)});
    }


    render() {
        return (
            <div>
                <h4 className="mt-3">Sample Variables</h4>
                <Panel id="clinicalPanel" defaultExpanded>
                    <Panel.Heading>
                        <Panel.Title toggle>
                            <div  onClick={this.toggleClinicalIcon}> Clinical Features <FontAwesome name={this.state.clinicalIcon}/></div>
                        </Panel.Title>
                    </Panel.Heading>
                    <Panel.Collapse>
                        <Panel.Body>
                            <ButtonGroup vertical block>
                                {this.createClinicalAttributesList()}
                            </ButtonGroup>
                        </Panel.Body>
                    </Panel.Collapse>
                </Panel>
                <Panel id="genomicPanel">
                    <Panel.Heading>
                        <Panel.Title toggle >
                            <div onClick={this.toggleMutationIcon}> Genomic Features <FontAwesome name={this.state.mutationIcon}/> </div>
                        </Panel.Title>
                    </Panel.Heading>
                    <Panel.Collapse>
                        <Panel.Body>
                            <ButtonGroup vertical block>
                                {this.createGenomicAttributesList()}
                            </ButtonGroup>
                        </Panel.Body>
                    </Panel.Collapse>
                </Panel>

            </div>

        )
    }
});
export default SampleVariableSelector;