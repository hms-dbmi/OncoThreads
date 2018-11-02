import React from "react";
import {observer} from "mobx-react";
import {Button, ButtonGroup, ButtonToolbar, ControlLabel, FormControl, FormGroup, Panel} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import Select from 'react-select';
import OriginalVariable from "../../OriginalVariable";

/*
creates the selector for sample variables (left side of main view, top)
 */
const SampleVariableSelector = observer(class SampleVariableSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            buttonClicked: "",
            mutationIcon: "caret-right",
            color: '',
            geneListString: '',
            mappingType: "binary"

        };
        this.handleVariableClick = this.handleVariableClick.bind(this);
        this.toggleMutationIcon = this.toggleMutationIcon.bind(this);
        this.searchGenes = this.searchGenes.bind(this);
        this.updateSearchValue = this.updateSearchValue.bind(this);
        this.handleEnterPressed = this.handleEnterPressed.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.bin = this.bin.bind(this);
        this.addVarModal = this.addVarModal.bind(this);
    }

    /**
     * opens the binning modal
     * @param id
     * @param name
     * @param description
     */
    bin(id, name, description) {
        let variable=new OriginalVariable(id,name,"NUMBER",description,[],[],this.props.store.rootStore.staticMappers[id]);
        this.props.store.addVariableToBeReferenced(variable);
        this.props.openBinningModal(variable, "sample", newVariable=>this.props.store.addVariableToBeDisplayed(newVariable));
    }

    /**
     * opens the binning modal
     * @param id
     */
    addVarModal() {
        this.props.openAddModal();
    }


    /**
     * adds a variable to the view
     * @param id
     * @param variable
     * @param type
     * @param description
     */
    addVariable(id, variable, type, description) {
        this.props.store.addOriginalVariable(id, variable, type, description, [], true, this.props.store.rootStore.staticMappers[id]);
    }


    /**
     * handles a click on one of the categorical Variables
     * @param id
     * @param variable
     * @param type
     * @param description
     */
    handleVariableClick(id, variable, type, description) {
        this.props.hideTooltip();
        if (!(this.props.currentVariables.map(function (d) {
            return d.id
        }).includes(id))) {
            this.addVariable(id, variable, type, description);
        }
    }

    /**
     * handles a click on one of the continuous Variables
     * @param id
     * @param variable
     */
    handleContinousClick(id, variable) {
        this.handleVariableClick(id, variable, "NUMBER", "")
    }

    /**
     * creates a searchable list of clinical attributes
     * @returns {Array}
     */
    createClinicalAttributesList() {
        let options = [];
        const _self = this;
        this.props.clinicalSampleCategories.forEach(function (d) {
            let icon = null;
            if (d.datatype === "NUMBER") {
                icon = <div className="floatDiv">
                    <FontAwesome
                        onClick={() => _self.bin(d.id, d.variable, d.description)
                        } name="cog"/>
                </div>
            }
            let lb = (
                <div onMouseEnter={(e) => {
                    _self.props.showTooltip(e, d.description);
                }} onMouseLeave={_self.props.hideTooltip}>
                    {icon}
                    <div className="wordBreak" style={{textAlign: "left"}}
                         onClick={() => _self.handleVariableClick(d.id, d.variable, d.datatype, d.description)}
                         key={d.variable}> {d.variable}
                    </div>
                </div>);
            options.push({value: d.variable, label: lb})
        });
        return options;
    }
     /**
     * creates a searchable list of clinical attributes
     * @returns {Array}
     */
    createClinicalPatientAttributesList() {
        let options = [];
        const _self = this;
        this.props.clinicalPatientCategories.forEach(function (d) {
            let icon = null;
            if (d.datatype === "NUMBER") {
                icon = <div className="floatDiv">
                    <FontAwesome
                        onClick={() => _self.bin(d.id, d.variable, d.description)
                        } name="cog"/>
                </div>
            }
            let lb = (
                <div onMouseEnter={(e) => {
                    _self.props.showTooltip(e, d.description);
                }} onMouseLeave={_self.props.hideTooltip}>
                    {icon}
                    <div className="wordBreak" style={{textAlign: "left"}}
                         onClick={() => _self.handleVariableClick(d.id, d.variable, d.datatype, d.description)}
                         key={d.variable}> {d.variable}
                    </div>
                </div>);
            options.push({value: d.variable, label: lb})
        });
        return options;
    }

    /**
     * toggles an arrow icon (right and down)
     * @param icon
     * @returns {string}
     */
    static toggleIcon(icon) {
        if (icon === "caret-down") {
            return "caret-right"
        }
        else {
            return "caret-down"
        }
    }

    /**
     * toggles the open/close icon of the mutation count panel
     */
    toggleMutationIcon() {
        this.setState({mutationIcon: SampleVariableSelector.toggleIcon(this.state.mutationIcon)});
    }

    /**
     * handles pressing enter after entering genes into the search field
     * @param event
     */
    handleEnterPressed(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.searchGenes();
        }
    }

    /**
     * sets a different mapping type
     * @param event
     */
    handleSelect(event) {
        this.setState({mappingType: event.target.value})
    }

    /**
     * searches for the genes entered in the search field
     */
    searchGenes() {
        let geneList=this.state.geneListString.replace(/(\r\n\t|\n|\r\t)/gm, "").toUpperCase().split(" ");
        geneList.forEach(function (d,i) {
            if(d.includes("ORF")){
                geneList[i]=d.replace("ORF","orf")
            }
        });
        this.props.store.rootStore.getMutationsAllAtOnce(geneList, this.state.mappingType);
        this.setState({geneListString: ''});
    }

    /**
     * updates the value of geneListString with the current content of the search field
     * @param event
     */
    updateSearchValue(event) {
        this.setState({geneListString: event.target.value});
    }

    /**
     * gets the genomic variables/search field
     * @returns {*}
     */
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
                                <option onChange={this.handleSelect} value="vaf">Variant allele frequency</option>
                            </FormControl>
                            <textarea style={{width: 100 + "%"}}
                                      placeholder={"Enter HUGO Gene Symbols ( e.g. TP53, IDH1)"}
                                      onKeyDown={this.handleEnterPressed} onChange={this.updateSearchValue}
                                      value={this.state.geneListString}/>
                            <br/>
                            <Button style={{textAlign: "left"}} bsSize="xsmall" onClick={this.searchGenes}>Add</Button>
                        </FormGroup>
                        <div>
                            <ButtonToolbar>
                                <ButtonGroup bsSize="xsmall">
                                    <Button>
                                        <FontAwesome
                                            onClick={() => this.bin(this.props.store.rootStore.mutationCountId, "Mutation Count", "")
                                            } name="cog"/>
                                    </Button>
                                    <Button style={{textAlign: "left"}}
                                            onClick={() => this.handleContinousClick(this.props.store.rootStore.mutationCountId, "Mutation Count")}
                                            key={this.props.mutationCount}> {"Add " + this.props.mutationCount}
                                    </Button>
                                </ButtonGroup>
                            </ButtonToolbar>
                        </div>
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
            <div>

                {
                    <ButtonGroup vertical block>
                            <Button style={{textAlign: "left"}} bsSize="small" color="secondary"
                                    //onClick={() =>this.addVarModal(this.createVarList())}//this.handleContinousClick(this.props.store.rootStore.mutationCountId, "Mutation Count")}
                                    onClick={() =>this.addVarModal()}
                                    key={this.props.mutationCount}>{"Add Variables"}
                            </Button>
                    </ButtonGroup>
}

                <h4>Sample variables</h4>
                <Panel>
                    <Panel.Heading>
                        <Panel.Title>
                            Clinical Features
                        </Panel.Title>
                    </Panel.Heading>
                    <h5>Sample-specific</h5>
                    <Select
                        type="text"
                        searchable={true}
                        componentClass="select" placeholder="Select..."
                        searchPlaceholder="Search variable"
                        options={this.createClinicalAttributesList()}
                    />
                    <h5>Patient-specific</h5>
                    <Select
                        type="text"
                        searchable={true}
                        componentClass="select" placeholder="Select..."
                        searchPlaceholder="Search variable"
                        options={this.createClinicalPatientAttributesList()}
                    />
                    {this.getGenomicPanel()}
                </Panel>
            </div>
        )
    }
});
export default SampleVariableSelector;


