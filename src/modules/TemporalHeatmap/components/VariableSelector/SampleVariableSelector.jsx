import React from "react";
import {observer} from "mobx-react";
import {Button, ButtonGroup, ControlLabel, FormControl, FormGroup, Panel} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
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
    }

    /**
     * opens the binning modal
     * @param id
     * @param name
     * @param description
     */
    bin(id, name, description) {
        this.props.store.addVariable(id, name, "NUMBER", description, false);
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
            this.props.store.addVariable(id, variable, type, description, true);
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
                icon = <FontAwesome onClick={() => _self.bin(d.id, d.variable, d.description)} name="cog"/>
            }
            let lb = (
                <div onMouseEnter={(e) => {
                    //console.log(d.variable);
                    _self.props.showTooltip(e, d.variable, d.description);
                }} onMouseLeave={_self.props.hideTooltip}>
                    {icon}{d.variable}
                </div>
            );
            options.push({value: d.variable, label: lb, id: d.id, datatype: d.datatype, description: d.description})
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
        this.props.store.rootStore.getMutationsAllAtOnce(this.state.geneListString.replace(/(\r\n\t|\n|\r\t)/gm, "").split(" "), this.state.mappingType);
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
                        <ButtonGroup vertical block>
                            <FontAwesome
                                onClick={() => this.bin(this.props.store.rootStore.mutationCountId, "Mutation Count", "")
                                } name="cog"/>
                            <Button style={{textAlign: "left"}} bsSize="xsmall"
                                    onClick={() => this.handleContinousClick(this.props.store.rootStore.mutationCountId, "Mutation Count")}
                                    key={this.props.mutationCount}> {"Add " + this.props.mutationCount}
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
            <div>
                <h4>Sample variables</h4>
                <Panel>
                    <Panel.Heading>
                        <Panel.Title>
                            Clinical Features
                        </Panel.Title>
                    </Panel.Heading>
                    <Select
                        type="text"
                        searchable={true}
                        componentClass="select" placeholder="Select..."
                        searchPlaceholder="Search variable"
                        options={this.createClinicalAttributesList()}
                        onChange={opt => this.handleVariableClick(opt.id, opt.value, opt.datatype, opt.description)}
                    />
                    {this.getGenomicPanel()}
                </Panel>
            </div>
        )
    }
});
export default SampleVariableSelector;


