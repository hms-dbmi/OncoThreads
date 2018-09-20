import React from "react";
import {observer} from "mobx-react";
import {Button, ButtonGroup, Panel} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';


import {FormControl, FormGroup, ControlLabel, HelpBlock, Checkbox, Radio} from 'react-bootstrap';
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';


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
        this.handleVariableClick = this.handleVariableClick.bind(this);
        this.toggleClinicalIcon = this.toggleClinicalIcon.bind(this);
        this.toggleMutationIcon = this.toggleMutationIcon.bind(this);
        this.bin = this.bin.bind(this);
    }


    onPickVariable(e){
        //console.log('[onPickColor]', this.inputEl )
        this.setState({ color: this.inputEl.value });

        const _self=this;

        this.props.clinicalSampleCategories.forEach(function (d) {
            if(_self.inputEl.value===d.variable){
                _self.handleVariableClick(d.id, d.variable, d.datatype)
            }
        });
    }


    bin(id) {
        this.props.openBinningModal(id, "sample", this.props.store.rootStore.timepointStore.regroupTimepoints , null);
    }

    /**
     * adds a variable to the view
     * @param id
     * @param variable
     * @param type
     */
    addVariable(id, variable, type) {
        if (this.props.currentVariables.length === 0) {
            this.props.store.initialize(id, variable, type);
        }
        else {
            this.props.store.addVariable(id, variable, type);
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
            this.addVariable(id, variable, type);
        }
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
                                 onClick={() => _self.handleVariableClick(d.id, d.variable, d.datatype)}>{icon} {d.variable}</Button>)
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
            let lb = (<div>{icon}{d.variable}</div>);
            //let vl=(<div>{d.id}{d.variable}{d.datatype}</div>)
            let vl=d.variable;
            let obj=(<div>{d.id}{d.variable}{d.datatype}</div>);

            options.push({value: vl, label: lb})
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

        return(

            

            <Nav>
                    <Panel id="clinicalPanel" placeholder="Search for names.." defaultExpanded>
                    
                    <div style={{backgroundColor: this.state.color }}>
                        <FormGroup controlId="formControlsSelect">
                        <ControlLabel>Genomic Features</ControlLabel>


                        <Select  
                            type="text" 
                            //onChange={this.onPickVariable.bind(this)}
                            inputRef={ el => this.inputEl=el }
                            searchable={true}
                            componentClass="select" placeholder="select"

                          
                            searchPlaceholder="Search variable"                        
                            
                            options={this.createClinicalAttributesListNewSelect()}


                            //options={this.createClinicalAttributesListNewSelect().map(d => {return {value: d.value, label:d.label}})}

                            //onChange={opt => this.handleVariableClick(opt.value.props.children[0], opt.value.props.children[1], opt.value.props.children[2])}

                            onChange={opt => console.log(opt.value, opt.label)}

                            //_self.handleVariableClick(d.id, d.variable, d.datatype)
                            //onChange={this.myOnChange}

                        />



                        

                        </FormGroup>
                    </div>


                    </Panel>
            </Nav>
        )

        /*return(
           



            <Nav>
                    <Panel id="clinicalPanel" placeholder="Search for names.." defaultExpanded>
                    
                    <div style={{backgroundColor: this.state.color }}>
                        <FormGroup controlId="formControlsSelect">
                        <ControlLabel>Genomic Features</ControlLabel>



                         <FormControl 
                            type="text" 
                            onChange={this.onPickVariable.bind(this)}
                            inputRef={ el => this.inputEl=el }
                            searchable={true}
                            componentClass="select" placeholder="select"

                          
                            searchPlaceholder="Search variable"
 
                            
                            >
                         {this.createClinicalAttributesListNew()}

                          </FormControl>

                        

                        </FormGroup>
                    </div>


                    </Panel>
            </Nav>
        )*/
    }
});
export default SampleVariableSelector;

/*

 <Navbar>
        <Nav>
            
            <NavDropdown eventKey={3} title="Clinical Features" id="basic-nav-dropdown">
                <MenuItem eventKey={3.1}>Action</MenuItem>
                <MenuItem eventKey={3.2}>Another action</MenuItem>
                <MenuItem eventKey={3.3}>Something else here</MenuItem>
                <MenuItem divider />
                <MenuItem eventKey={3.3}>Separated link</MenuItem>
            </NavDropdown>
        </Nav>
               
</Navbar>

            ----------
 <Navbar.Collapse>
                    <Navbar.Form pullLeft>
                    <FormGroup>
                        <FormControl type="text" placeholder="Search" />
                    </FormGroup>{' '}
                    <Button type="submit">Submit</Button>
                    </Navbar.Form>
                </Navbar.Collapse>


                ------------


        <div style={{backgroundColor: this.state.color }}>
                        <FormGroup controlId="formControlsSelect">
                        <ControlLabel>Genomic Features</ControlLabel>
                        <FormControl 
                            onChange={this.onPickColor.bind(this)}
                            inputRef={ el => this.inputEl=el }
                            componentClass="select" placeholder="select">
                            <option value="">select</option>
                            <option value="red">Red</option>
                            <option value="green">Green</option>
                            <option value="blue">Blue</option>
                        </FormControl>
                        </FormGroup>
                    </div>


                    ---working

                    <FormControl 
                            type="text" 
                            onChange={this.onPickVariable.bind(this)}
                            inputRef={ el => this.inputEl=el }
                            searchable={true}
                            componentClass="select" placeholder="select"

                          
                            searchPlaceholder="Search variable"
 
                            
                            >
                         {this.createClinicalAttributesListNew()}

                          </FormControl>


                          ---test


                           <Select  
                            type="text" 
                            //onChange={this.onPickVariable.bind(this)}
                            inputRef={ el => this.inputEl=el }
                            searchable={true}
                            componentClass="select" placeholder="select"

                          
                            searchPlaceholder="Search variable"
 
                            
                            
                            options={this.createClinicalAttributesListNew()}

                            onChange={opt => console.log(opt.label, opt.value)}

                          />
         
*/
