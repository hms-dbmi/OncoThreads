import React from "react";
import {observer} from "mobx-react";
import {Button,ButtonGroup,Panel} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import RootStore from "../../../RootStore";

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
     * adds a variable to the view
     * @param id
     * @param variable
     * @param type
     */
    addVariable(id,variable, type) {
        if (this.props.currentVariables.length === 0) {
            this.props.store.initialize(id, variable, type);
        }
        else {
            this.props.store.addVariable(id,variable, type);
        }
    }


    /**
     * handles a click on one of the categorical Variables
     * @param id
     * @param variable
     * @param type
     */
    handleVariableClick(id, variable, type) {
        if (!(this.props.currentVariables.map(function (d) {
                return d.id
            }).includes(id))) {
            this.addVariable(id,variable, type);
        }
    }

    /**
     * handles a click on one of the continuous Variables
     * @param id
     * @param variable
     */
    handleContinousClick(id,variable) {
        let minMax=RootStore.getMinMaxOfContinuous(this.props.store.rootStore.sampleMappers[id],"sample");
        this.props.visMap.setContinousColorScale(id, minMax[0], minMax[1]);
        this.handleVariableClick(id,variable, "NUMBER")
    }

    /**
     * creates a list of the clinical Variables
     * @returns {Array}
     */
    createClinicalAttributesList() {
        let buttons = [];
        const _self = this;
        this.props.clinicalSampleCategories.forEach(function (d) {
            buttons.push(<Button key={d.variable} onClick={() => _self.handleVariableClick(d.id, d.variable, d.datatype)}>{d.variable}</Button>)
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
        buttons.push(<Button onClick={() => _self.handleContinousClick(this.props.store.rootStore.mutationCountId,"Mutation Count")}
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