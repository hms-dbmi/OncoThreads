import React from 'react';
import {observer} from 'mobx-react';
import {Col, Form, FormControl, FormGroup} from 'react-bootstrap';
import Select from 'react-select';


const VariableSelector = observer(class VariableSelector extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            mappingType: 'binary',
            category: "clinSample",
        };
        this.handleOptionSelect = this.handleOptionSelect.bind(this);
        this.searchGenes = this.searchGenes.bind(this);
        this.updateSearchValue = this.updateSearchValue.bind(this);
        this.handleEnterPressed = this.handleEnterPressed.bind(this);
        this.handleCategorySelect = this.handleCategorySelect.bind(this);
        this.handleMutationSelect = this.handleMutationSelect.bind(this);
    }


    /**
     * creates a searchable list of clinical attributes
     * @returns {Array}
     */
    createOptions() {
        let options = [];
        let list = [];
        if (this.state.category === "clinSample") {
            list = this.props.clinicalSampleCategories;
        }
        else {
            list = this.props.clinicalPatientCategories;
        }
        list.forEach(d => {
            let lb = (
                <div className="wordBreak" style={{textAlign: "left"}}
                     key={d.variable}> {d.variable}
                </div>);
            options.push({value: d.id, label: lb, object: d})
        });
        return options;
    }


    handleCategorySelect(e) {
        this.setState({
            category: e.target.value,
            geneListString: "",
        });
    }


    handleOptionSelect(selectedOption) {
        this.props.handleVariableSelect(selectedOption.object, this.state.category, true)
    }

    /**
     * searches for the genes entered in the search field
     */
    searchGenes() {
        let geneList = this.state.geneListString.replace(/(\r\n\t|\n|\r\t)/gm, "").toUpperCase().split(" ");
        geneList.forEach(function (d, i) {
            if (d.includes("ORF")) {
                geneList[i] = d.replace("ORF", "orf")
            }
        });
        this.props.store.rootStore.molProfileMapping.getMutations(this.state.category, geneList, this.state.mappingType, newVariable => {
            this.props.handleGeneSelect(newVariable, this.state.category);
        });
        this.setState({geneListString: ""});
    }

    /**
     * updates the value of geneListString with the current content of the search field
     * @param event
     */
    updateSearchValue(event) {
        this.setState({geneListString: event.target.value});
    }

    /**
     * handles pressing enter after entering genes into the search field
     * @param event
     */
    handleEnterPressed(event) {
        if (VariableSelector.checkEnterPressed(event)) {
            this.searchGenes();
        }
    }

    static checkEnterPressed(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            return true;
        }
        return false;
    }

    handleMutationSelect(event) {
        this.setState({mappingType: event.target.value})
    }


    getTimepointSearchField() {
        if (this.state.category === "clinSample" || this.state.category === "clinPatient") {
            return <Select
                type="text"
                searchable={true}
                componentClass="select" placeholder="Select..."
                searchPlaceholder="Search variable"
                options={this.createOptions()}
                onChange={this.handleOptionSelect}

            />
        }
        else {

            return <FormControl style={{height: 38}} type="textarea"
                                placeholder={"Enter HUGO Gene Symbols (e.g. TP53, IDH1)"}
                                onChange={this.updateSearchValue}
                                onKeyDown={this.handleEnterPressed}
                                value={this.state.geneListString}/>
        }
    }

    getMappingTypeSelect() {
        let mutationSelect = null;
        if (this.props.molecularProfiles.map(d => d.molecularProfileId).includes(this.state.category)) {
            if (this.props.molecularProfiles.filter(d => d.molecularProfileId === this.state.category)[0].molecularAlterationType === "MUTATION_EXTENDED") {
                mutationSelect =
                    <FormControl style={{height: 38}} onChange={this.handleMutationSelect} componentClass="select"
                                 placeholder="select">
                        <option value="binary">Binary</option>
                        <option value="proteinChange">Protein change</option>
                        <option value="mutationType">Mutation type</option>
                        <option value="vaf">Variant allele frequency</option>
                    </FormControl>
            }
        }
        return mutationSelect;
    }


    render() {
        let mappingTypeSelect = this.getMappingTypeSelect();
        let searchFieldSize = 8;
        let mappingTypeCol = null;
        if (mappingTypeSelect !== null) {
            searchFieldSize = 6;
            mappingTypeCol = <Col sm={2} style={{padding: 0}}>{mappingTypeSelect}</Col>
        }
        return (<Form horizontal>
                <FormGroup>
                    <Col sm={4} style={{paddingRight: "0"}}>
                        <FormControl style={{height: 38}} componentClass="select"
                                     onChange={this.handleCategorySelect}
                                     placeholder="Select Category">
                            {this.props.variableOptions.map((d) => <option value={d.id}
                                                                           key={d.id}>{d.name}</option>)}
                        </FormControl>
                    </Col>
                    {mappingTypeCol}
                    <Col sm={searchFieldSize} style={{padding: 0}}>
                        {this.getTimepointSearchField()}
                    </Col>
                </FormGroup>
            </Form>
        )
    }
});
export default VariableSelector;
