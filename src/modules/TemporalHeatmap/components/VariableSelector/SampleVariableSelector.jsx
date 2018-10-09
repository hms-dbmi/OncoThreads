import React from "react";
import {observer} from "mobx-react";
import {Button, ButtonGroup, FormGroup, Nav, Panel} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';


//import {FormGroup} from 'react-bootstrap';
//import { Nav } from 'react-bootstrap';


import Select from 'react-select';

/*
creates the selector for sample variables (left side of main view, top)
 */
const SampleVariableSelector = observer(class SampleVariableSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            buttonClicked: "",
            clinicalOpen: true,
            clinicalIcon: "caret-down",
            mutationIcon: "caret-right",
            color: ''

        };
        
        this.passToHandleVariableClick=this.passToHandleVariableClick.bind(this);
        this.handleVariableClick = this.handleVariableClick.bind(this);
        this.toggleClinicalIcon = this.toggleClinicalIcon.bind(this);
        this.toggleMutationIcon = this.toggleMutationIcon.bind(this);

        //this.handleMouseEnter = this.handleMouseEnter.bind(this);
        //this.handleMouseLeave = this.handleMouseLeave.bind(this);

        this.bin = this.bin.bind(this);
    }


    bin(id) {
        this.props.openBinningModal(id, "sample", this.props.store.rootStore.timepointStore.regroupTimepoints, null);
    }

    /**
     * adds a variable to the view
     * @param id
     * @param variable
     * @param type
     * @param description
     */
    addVariable(id, variable, type, description) {
        if (this.props.currentVariables.length === 0) {
            this.props.store.initialize(id, variable, type,description);
        }
        else {
            this.props.store.addVariable(id, variable, type,description);
        }
    }


    /**
     * handles a click on one of the categorical Variables
     * @param id
     * @param variable
     * @param type
     * @param description
     */
    handleVariableClick(id, variable, type, description) {
        if (!(this.props.currentVariables.map(function (d) {
            return d.id
        }).includes(id))) {
            this.addVariable(id, variable, type, description);
        }
    }

    passToHandleVariableClick(value) {
        //this.handleVariableClick(value.id, value.variable, value.datatype,value.description);

        var id=this.props.clinicalSampleCategories.filter(d1=>d1.variable===value)[0].id,
        variable= this.props.clinicalSampleCategories.filter(d1=>d1.variable===value)[0].variable,
        type= this.props.clinicalSampleCategories.filter(d1=>d1.variable===value)[0].datatype;

        this.handleVariableClick(id, variable, type);
    }

    /**
     * handles a click on one of the continuous Variables
     * @param id
     * @param variable
     */
    handleContinousClick(id, variable) {
        this.handleVariableClick(id, variable, "NUMBER")
    }

    /**
     * creates a list of the clinical Variables
     * @returns {Array}
     */
    createClinicalAttributesList() {
        let buttons = [];
        const _self = this;
        this.props.clinicalSampleCategories.forEach(function (d) {
            let icon = null;
            if (d.datatype === "NUMBER") {
                icon = <FontAwesome onClick={() => _self.bin(d.id)} name="cog"/>
            }
            buttons.push(<Button style={{textAlign: "left"}} bsSize="xsmall" key={d.variable}
                                 onClick={() => _self.handleVariableClick(d.id, d.variable, d.datatype, d.description)}>{icon} {d.variable}</Button>)
        });
        return buttons;
    }

    createClinicalAttributesListNewSelect() {
        let options = [];
        const _self = this;
        this.props.clinicalSampleCategories.forEach(function (d) {
            let icon = null;
            if (d.datatype === "NUMBER") {
                icon = <FontAwesome onClick={() => _self.bin(d.id)} name="cog"/>
            }
            //let lb = (<div>{icon}{d.variable}</div>);
            //options.push({value: d.variable, label: lb,obj:d})
            let lb = (
                <div onMouseOver={(e)=>{
                    //console.log(d.variable);
                    _self.props.showTooltip(e, d.variable, d.description);
                }}>
                    {icon}{d.variable}
                </div>
            );
            //let vl=(<div>{d.id}{d.variable}{d.datatype}</div>)
            let vl=d.variable;
            //let ob=(<div>{d.id}{d.variable}{d.datatype}</div>);

            options.push({value:vl, label:lb})
        });
        return options;
    }

    /*createClinicalAttributesListNew() {

        let options = [];
        const _self = this;


        options.push(<option style={{textAlign: "left"}} bsSize="xsmall" label = {'search'} value={'search'}
                                 > {'select'}</option>)
        this.props.clinicalSampleCategories.forEach(function (d) {
            let icon = null;
            if (d.datatype === "NUMBER") {
                icon = <FontAwesome onClick={() => _self.bin(d.id)} name="cog"/>
            }
            //<option value="red">Red</option>
            options.push(<option style={{textAlign: "left"}} bsSize="xsmall"
                                 label = {d.variable}
                                 //value={d.variable}
                                 //onClick={() => _self.handleVariableClick(d.id, d.variable, d.datatype)}>{icon} {d.variable}</option>)
                                 onClick={() => _self.handleVariableClick(d.id, d.variable, d.datatype)}>
                                 {d.variable}
                        </option>)
        });
        return options;

    }*/
    /**
     * creates a list of the genomic variables
     * @returns {Array}
     */
    createGenomicAttributesList() {
        let buttons = [];
        const _self = this;
        buttons.push(<Button style={{textAlign: "left"}} bsSize="xsmall"
                             onClick={() => _self.handleContinousClick(this.props.store.rootStore.mutationCountId, "Mutation Count")}
                             key={this.props.mutationCount}><FontAwesome
            onClick={() => _self.bin(_self.props.store.rootStore.mutationCountId)
            } name="cog"/> {this.props.mutationCount}</Button>);
        return buttons;
    }

    static toggleIcon(icon) {
        if (icon === "caret-down") {
            return "caret-right"
        }
        else {
            return "caret-down"
        }
    }

    toggleClinicalIcon() {
        this.setState({clinicalIcon: SampleVariableSelector.toggleIcon(this.state.clinicalIcon)});
    }

    toggleMutationIcon() {
        this.setState({mutationIcon: SampleVariableSelector.toggleIcon(this.state.mutationIcon)});
    }

    getGenomicPanel() {
        if (this.props.store.rootStore.hasMutationCount) {
            return (<Panel id="genomicPanel">
                <Panel.Heading>
                    <Panel.Title toggle>
                        <div onClick={this.toggleMutationIcon}> Genomic Features <FontAwesome
                            name={this.state.mutationIcon}/></div>
                    </Panel.Title>
                </Panel.Heading>
                <Panel.Collapse>
                    <Panel.Body>
                        <ButtonGroup vertical block>
                            {this.createGenomicAttributesList()}
                        </ButtonGroup>
                    </Panel.Body>
                </Panel.Collapse>
            </Panel>)
        }
        else {
            return null;
        }
    }

    /*handleMouseEnter() {

        //this.props.showTooltip(event, patient + ": " + value + ", Event start day: " + startDay + ", Duration: " + duration + " days")

        this.props.showTooltip("sample tooltip");

        console.log("sample tooltip");
    }

    handleMouseLeave() {
        this.props.hideTooltip();
    }*/

    render() {
        /*return (
            <div>
                <h4 className="mt-3">Sample Variables</h4>
                <Panel id="clinicalPanel" placeholder="Search for names.." defaultExpanded>
                    <Panel.Heading>
                        <Panel.Title toggle>
                            <div onClick={this.toggleClinicalIcon}> Clinical Features <FontAwesome
                                name={this.state.clinicalIcon}/></div>
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
                {this.getGenomicPanel()}

            </div>

        )*/


        //const {multiple} = this.state;

        //const _self=this;

        //const detailedOptions=this.createClinicalAttributesListNewSelect();

        return (


            <Nav>
                    <Panel id="clinicalPanel" placeholder="Search for names.." defaultExpanded>
                    <Panel.Heading>
                        <Panel.Title toggle>
                            <div > Clinical Features </div>
                        </Panel.Title>
                    </Panel.Heading>
                   



                        <FormGroup controlId="formControlsSelect">
                       

                        <Select  
                            type="text" 
                            //onChange={this.onPickVariable.bind(this)}
                            inputRef={ el => this.inputEl=el }
                            searchable={true}
                            componentClass="select" placeholder="Select..."


                                searchPlaceholder="Search variable"

                                options={this.createClinicalAttributesListNewSelect()}


                                //options={this.createClinicalAttributesListNewSelect().map(d => {return {value: d.value, label:d.label}})}

                                //onChange={opt => this.handleVariableClick(opt.value.props.children[0], opt.value.props.children[1], opt.value.props.children[2])}

                                onChange={opt => this.passToHandleVariableClick(opt.value)}

                                //onMouseOver={(e) => this.handleMouseEnter()}
                                //onMouseLeave={this.handleMouseLeave}

                                //_self.handleVariableClick(d.id, d.variable, d.datatype)
                                //onChange={this.myOnChange}

                            />


                        </FormGroup>

                        {this.getGenomicPanel()}

                   


                </Panel>
            </Nav>
        )


    }
});
export default SampleVariableSelector;


