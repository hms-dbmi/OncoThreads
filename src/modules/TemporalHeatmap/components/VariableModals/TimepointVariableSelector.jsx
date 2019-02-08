import React from 'react';
import {observer} from 'mobx-react';
import {Alert, Button, Checkbox, Col, Form, FormControl, FormGroup} from 'react-bootstrap';
import Select from 'react-select';
import ControlLabel from "react-bootstrap/es/ControlLabel";


const TimepointVariableSelector = observer(class TimepointVariableSelector extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            geneListString: "",
            selectionType: "clinical",
            mutationOptions: [],
            molecularOptions: [],
            showCheckBoxOptions: false,
        };
        this.handleOptionSelect = this.handleOptionSelect.bind(this);
        this.handleClinicalOptionSelect = this.handleClinicalOptionSelect.bind(this);
        this.handleSavedOptionSelect = this.handleSavedOptionSelect.bind(this);
        this.searchGenes = this.searchGenes.bind(this);
        this.updateSearchValue = this.updateSearchValue.bind(this);
        this.handleEnterPressed = this.handleEnterPressed.bind(this);
        this.updateMutationCheckBoxOptions = this.updateMutationCheckBoxOptions.bind(this);
        this.updateMolecularCheckBoxOptions = this.updateMolecularCheckBoxOptions.bind(this);
        this.addGenes = this.addGenes.bind(this);
    }

    createOptions(){
        let savedOptions=[];
        this.props.savedReferences.forEach(d => {
            let variable = this.props.variableStore.getById(d);
            let lb = (
                <div style={{textAlign: "left"}}
                     key={d}><b>{variable.name}</b>{": " + variable.description}
                </div>);
            savedOptions.push({value: variable.name + variable.description, label: lb, object: variable.id, type:"saved"})
        });
        let sampleOptions = [];
        this.props.clinicalSampleCategories.filter(d => !this.props.currentVariables.map(d => d.id).includes(d.id)).forEach(d => {
            let lb = (
                <div style={{textAlign: "left"}}
                     key={d.variable}><b>{d.variable}</b>{": " + d.description}
                </div>);
            sampleOptions.push({value: d.variable + d.description, label: lb, object: d, type: "clinical"})
        });
        let patientOptions = [];
        this.props.clinicalPatientCategories.filter(d => !this.props.currentVariables.map(d => d.id).includes(d.id)).forEach(d => {
            let lb = (
                <div style={{textAlign: "left"}}
                     key={d.variable}><b>{d.variable}</b>{": " + d.description}
                </div>);
            patientOptions.push({value: d.variable + " " + d.description, label: lb, object: d, type: "clinical"})
        });
        return [{label: "Saved variables",options:savedOptions},
            {label: "Sample-specific", options: sampleOptions},
            {label: "Patient-specific", options: patientOptions}];

    }

    /**
     * handle selection of an option
     * @param selectedOption
     */
    handleOptionSelect(selectedOption) {
        if (!Array.isArray(selectedOption)) {
            if (selectedOption.type === 'clinical') {
                this.props.handleVariableAdd(selectedOption.object, selectedOption.profile, true)
            }
            else {
                this.props.handleSavedVariableAdd(selectedOption.object);
            }
        }
    }

    /**
     * handle selection of an option
     * @param selectedOption
     */
    handleClinicalOptionSelect(selectedOption) {
        this.props.handleVariableAdd(selectedOption.object, selectedOption.profile, true)

    }

    /**
     * handle selection of an option
     * @param selectedOption
     */
    handleSavedOptionSelect(selectedOption) {
        this.props.handleSavedVariableAdd(selectedOption.object);

    }

    /**
     * updates the checkboxes showing the different mutation data types
     * @param hasData
     */
    updateMutationCheckBoxOptions(hasData) {
        let mutationOptions = [];
        if (hasData) {
            this.props.mutationMappingTypes.forEach(d => {
                mutationOptions.push({id: d, selected: false});
            })
        }
        this.setState({mutationOptions: mutationOptions, showCheckBoxOptions: true});
    }

    /**
     * updates the checkboxes showing the different molecular profiles
     * @param profile
     * @param hasData
     */
    updateMolecularCheckBoxOptions(profile, hasData) {
        let molecularOptions = this.state.molecularOptions.slice();
        if (hasData) {
            if (!molecularOptions.map(d => d.id).includes(profile)) {
                molecularOptions.push({
                    id: profile,
                    profile: profile,
                    name: this.props.availableProfiles.filter(d => d.molecularProfileId === profile)[0].name,
                    selected: false
                });
            }
        }
        else {
            if (molecularOptions.map(d => d.id).includes(profile)) {
                molecularOptions.splice(molecularOptions.map(d => d.id).indexOf(profile), 1);
            }
        }
        this.setState({molecularOptions: molecularOptions, showCheckBoxOptions: true});
    }

    /**
     * searches for the genes entered in the search field
     */
    searchGenes() {
        this.setState({molecularOptions: [], mutationOptions: []});
        let geneList = this.state.geneListString.replace(/(\r\n\t|\n|\r\t)/gm, "").toUpperCase().split(" ");
        geneList.forEach(function (d, i) {
            if (d.includes("ORF")) {
                geneList[i] = d.replace("ORF", "orf")
            }
        });
        this.props.molProfileMapping.loadIds(geneList, () => {
            if (this.props.availableProfiles.map(d => d.molecularAlterationType).includes("MUTATION_EXTENDED")) {
                this.props.molProfileMapping.loadMutations(() => {
                    this.updateMutationCheckBoxOptions(Object.values(this.props.molProfileMapping.isInGenePanel).join().length > 0);
                });
            }
            this.props.availableProfiles.filter(d => d.molecularAlterationType !== "MUTATION_EXTENDED").forEach(d => {
                this.props.molProfileMapping.loadMolecularData(d.molecularProfileId, () => {
                    this.updateMolecularCheckBoxOptions(d.molecularProfileId, this.props.molProfileMapping.currentMolecular[d.molecularProfileId].length > 0);
                })
            });
        });

    }

    /**
     * adds Genes to view
     */
    addGenes() {
        const mappingTypes = this.state.mutationOptions.filter(d => d.selected).map(d => d.id);
        const profiles = this.state.molecularOptions.filter(d => d.selected).map(d => d.profile);
        this.props.molProfileMapping.getMultipleProfiles(profiles, mappingTypes).forEach(d => this.props.handleGeneSelect(d));
        this.setState({geneListString: "", showCheckBoxOptions: false});
    }

    /**
     * updates the value of geneListString with the current content of the search field
     * @param event
     */
    updateSearchValue(event) {
        this.setState({geneListString: event.target.value, showCheckBoxOptions: false});
    }

    /**
     * handles pressing enter after entering genes into the search field
     * @param event
     */
    handleEnterPressed(event) {
        if (TimepointVariableSelector.checkEnterPressed(event)) {
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


    /**
     * toggles selection of a checkbox
     * @param index
     * @param isMutation
     */
    toggleSelect(index, isMutation) {
        if (isMutation) {
            let mutationOptions = this.state.mutationOptions.slice();
            mutationOptions[index].selected = !mutationOptions[index].selected;
            this.setState({mutationOptions: mutationOptions});
        }
        else {
            let molecularOptions = this.state.molecularOptions.slice();
            molecularOptions[index].selected = !molecularOptions[index].selected;
            this.setState({molecularOptions: molecularOptions});
        }

    }

    /**
     * gets the checkboxes for the available genomic data
     * @returns {*}
     */
    getAvailableCheckBoxes() {
        let checkBoxes = [];
        if (this.state.mutationOptions.length > 0 || this.state.molecularOptions.length > 0) {
            checkBoxes.push(<h5 key={"header"}>Available data for gene(s)</h5>)
        }
        else {
            checkBoxes = "No data available"
        }
        if (this.state.mutationOptions.length > 0) {
            let available = [];
            this.state.mutationOptions.forEach((d, i) => available.push(<Checkbox
                onChange={() => this.toggleSelect(i, true)} checked={d.selected} key={d.id}
                value={d.id}>{d.id}</Checkbox>));
            checkBoxes.push(<Col key="Mutations" sm={6}>
                <ControlLabel>Mutations</ControlLabel>
                {available}
            </Col>)
        }
        if (this.state.molecularOptions.length > 0) {
            let available = [];
            this.state.molecularOptions.forEach((d, i) => available.push(<Checkbox
                onChange={() => this.toggleSelect(i, false)} checked={d.selected} key={d.id}
                value={d.id}>{d.name}</Checkbox>));
            checkBoxes.push(<Col key="Molecular" sm={6}>
                <ControlLabel>Molecular Profiles</ControlLabel>
                {available}
            </Col>)
        }
        return <Form horizontal>
            <Alert>
                <FormGroup>{checkBoxes}</FormGroup>
                <Button onClick={this.addGenes}>Add genes</Button>
            </Alert>
        </Form>
    }



    render() {
        let formGroups = [];
        if (this.props.clinicalSampleCategories.length > 0 || this.props.clinicalPatientCategories.length > 0) {
            formGroups.push(<FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                    Variables
                </Col>
                <Col sm={10}>
                    <Select
                        type="text"
                        searchable={true}
                        componentClass="select" placeholder="Select..."
                        searchPlaceholder="Search variable"
                        options={this.createOptions()}
                        onChange={this.handleOptionSelect}

                    />
                </Col>
            </FormGroup>);
        }
        if (this.props.availableProfiles.length > 0) {
            formGroups.push(<FormGroup>
                <Col componentClass={ControlLabel} sm={2}>
                    Find gene
                </Col>
                <Col sm={10}>
                    <FormControl style={{height: 38}} type="textarea"
                                 placeholder={"Enter HUGO Gene Symbols (e.g. TP53, IDH1)"}
                                 onChange={this.updateSearchValue}
                                 onKeyDown={this.handleEnterPressed}
                                 value={this.state.geneListString}/>
                </Col>
            </FormGroup>);
        }
        return (<div>
            <h4>Select Variable</h4>
            <Form horizontal>
            {formGroups}
        </Form>
            {this.state.showCheckBoxOptions ? this.getAvailableCheckBoxes() : null}
        </div>)
    }
});
export default TimepointVariableSelector;
