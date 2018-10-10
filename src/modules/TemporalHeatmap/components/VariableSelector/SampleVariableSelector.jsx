import React from "react";
import {observer} from "mobx-react";
import {Button, ButtonGroup, ControlLabel, FormControl, FormGroup, Nav, Panel} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import Select from 'react-select';


//import {FormGroup} from 'react-bootstrap';
//import { Nav } from 'react-bootstrap';

/*
creates the selector for sample variables (left side of main view, top)
 */
const SampleVariableSelector = observer(class SampleVariableSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            buttonClicked: "",
            clinicalOpen: true,
            mutationIcon: "caret-right",
            color: '',
            geneListString: '',
            mutationType: "binary"

        };

        this.passToHandleVariableClick = this.passToHandleVariableClick.bind(this);
        this.handleVariableClick = this.handleVariableClick.bind(this);
        this.toggleMutationIcon = this.toggleMutationIcon.bind(this);
        this.searchGenes = this.searchGenes.bind(this);
        this.updateSearchValue = this.updateSearchValue.bind(this);
        this.handleEnterPressed = this.handleEnterPressed.bind(this);
        this.handleSelect = this.handleSelect.bind(this);

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
            this.props.store.initialize(id, variable, type, description);
        }
        else {
            this.props.store.addVariable(id, variable, type, description);
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
        this.handleVariableClick(value.id, value.variable, value.datatype, value.description);
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
                <div onMouseOver={(e) => {
                    //console.log(d.variable);
                    _self.props.showTooltip(e, d.variable, d.description);
                }}>
                    {icon}{d.variable}
                </div>
            );
            //let vl=(<div>{d.id}{d.variable}{d.datatype}</div>)
            let vl = d.variable;
            //let ob=(<div>{d.id}{d.variable}{d.datatype}</div>);

            options.push({value: vl, label: lb, obj: d})
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

    static toggleIcon(icon) {
        if (icon === "caret-down") {
            return "caret-right"
        }
        else {
            return "caret-down"
        }
    }


    toggleMutationIcon() {
        this.setState({mutationIcon: SampleVariableSelector.toggleIcon(this.state.mutationIcon)});
    }

    handleEnterPressed(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.searchGenes();
        }
    }

    handleSelect(event) {
        this.setState({mutationType: event.target.value})
    }

    searchGenes() {
        this.props.store.rootStore.getMutationsAllAtOnce(this.state.geneListString.replace(/(\r\n\t|\n|\r\t)/gm, "").split(" "), this.state.mutationType);
        this.setState({geneListString: ''});
    }

    updateSearchValue(event) {
        this.setState({geneListString: event.target.value});
    }

    getGenomicPanel() {
        if (this.props.store.rootStore.hasMutations) {
            return (<Panel id="genomicPanel">
                <Panel.Heading>
                    <Panel.Title toggle>
                        <div onClick={this.toggleMutationIcon}> Genomic Features <FontAwesome
                            name={this.state.mutationIcon}/></div>
                    </Panel.Title>
                </Panel.Heading>
                <Panel.Collapse>
                    <Panel.Body>
                        <FormGroup controlId="formControlsSelect">
                            <ControlLabel>Search gene(s)</ControlLabel>
                            <FormControl onChange={this.handleSelect} componentClass="select" placeholder="select">
                                <option onChange={this.handleSelect} value="binary">Binary</option>
                                <option onChange={this.handleSelect} value="proteinChange">Protein change</option>
                                <option onChange={this.handleSelect} value="mutationType">Mutation type</option>
                                {/*<option onChange={this.handleSelect} value="vaf">Variant allele frequency</option>*/}
                            </FormControl>
                            <textarea placeholder={"Enter HUGO Gene Symbols"}
                                      onKeyDown={this.handleEnterPressed} onChange={this.updateSearchValue}
                                      value={this.state.geneListString}/>
                            <br/>
                            <Button style={{textAlign: "left"}} bsSize="xsmall" onClick={this.searchGenes}>Add</Button>
                        </FormGroup>
                        <ButtonGroup vertical block>
                            <Button style={{textAlign: "left"}} bsSize="xsmall"
                                    onClick={() => this.handleContinousClick(this.props.store.rootStore.mutationCountId, "Mutation Count")}
                                    key={this.props.mutationCount}><FontAwesome
                                onClick={() => this.bin(this.props.store.rootStore.mutationCountId)
                                } name="cog"/> {"Add " + this.props.mutationCount}
                            </Button>
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

        return (


            <Nav>
                <Panel id="clinicalPanel" placeholder="Search for names..">
                    <Panel.Heading>
                        <Panel.Title>
                            <div> Clinical Features</div>
                        </Panel.Title>
                    </Panel.Heading>


                    <FormGroup controlId="formControlsSelect">


                        <Select
                            type="text"
                            //onChange={this.onPickVariable.bind(this)}
                            inputRef={el => this.inputEl = el}
                            searchable={true}
                            componentClass="select" placeholder="Select..."


                            searchPlaceholder="Search variable"

                            options={this.createClinicalAttributesListNewSelect()}


                            //options={this.createClinicalAttributesListNewSelect().map(d => {return {value: d.value, label:d.label}})}

                            //onChange={opt => this.handleVariableClick(opt.value.props.children[0], opt.value.props.children[1], opt.value.props.children[2])}

                            onChange={opt => this.passToHandleVariableClick(opt.obj)}

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


