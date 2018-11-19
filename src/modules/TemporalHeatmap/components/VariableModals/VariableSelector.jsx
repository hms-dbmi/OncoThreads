import React from 'react';
import {observer} from 'mobx-react';
import {Alert, Button, Checkbox, Col, Form, FormControl, FormGroup} from 'react-bootstrap';
import Select from 'react-select';
import ControlLabel from "react-bootstrap/es/ControlLabel";


const VariableSelector = observer(class VariableSelector extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            geneListString:"",
            selectionType: "clinical",
            mutationOptions: [],
            molecularOptions: [],
            showCheckBoxOptions: false,
        };
        this.handleOptionSelect = this.handleOptionSelect.bind(this);
        this.searchGenes = this.searchGenes.bind(this);
        this.updateSearchValue = this.updateSearchValue.bind(this);
        this.handleEnterPressed = this.handleEnterPressed.bind(this);
        this.handleCategorySelect = this.handleCategorySelect.bind(this);
        this.updateMutationCheckBoxOptions = this.updateMutationCheckBoxOptions.bind(this);
        this.updateMolecularCheckBoxOptions = this.updateMolecularCheckBoxOptions.bind(this);
        this.addGenes = this.addGenes.bind(this);
    }


    /**
     * creates a searchable list of clinical attributes
     * @returns {Array}
     */
    createOptions() {
        let sampleOptions = [];
        this.props.clinicalSampleCategories.forEach(d => {
            let lb = (
                <div className="wordBreak" style={{textAlign: "left"}}
                     key={d.variable}><b>{d.variable}</b>{": " + d.description}
                </div>);
            sampleOptions.push({value: d.variable + d.description, label: lb, object: d, profile: "clinSample"})
        });
        let patientOptions = [];
        this.props.clinicalPatientCategories.forEach(d => {
            let lb = (
                <div className="wordBreak" style={{textAlign: "left"}}
                     key={d.variable}><b>{d.variable}</b>{": " + d.description}
                </div>);
            patientOptions.push({value: d.variable + " " + d.description, label: lb, object: d, profile: "clinPatient"})
        });
        return [{label: "Sample", options: sampleOptions}, {
            label: "Patient", options: patientOptions
        }];
    }


    handleCategorySelect(e) {
        this.setState({
            selectionType: e.target.value,
            showCheckBoxOptions: false
        });
    }


    handleOptionSelect(selectedOption) {
        if (!Array.isArray(selectedOption)) {
            this.props.handleVariableAddRemove(selectedOption.object, selectedOption.profile, true)
        }
    }

    updateMutationCheckBoxOptions(hasData) {
        let mutationOptions = [];
        if (hasData) {
            this.props.availableProfiles.forEach(d => {
                if (d.type === "mutation") {
                    mutationOptions.push({id: d.id, profile: d.profile, name: d.name, selected: false});
                }
            })
        }
        this.setState({mutationOptions: mutationOptions, showCheckBoxOptions: true});
    }

    updateMolecularCheckBoxOptions(profile, hasData) {
        let molecularOptions = this.state.molecularOptions.slice();
        if (hasData) {
            if (!molecularOptions.map(d => d.id).includes(profile)) {
                molecularOptions.push({
                    id: profile,
                    profile: profile,
                    name: this.props.availableProfiles.filter(d => d.profile === profile)[0].name,
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
            this.props.molProfileMapping.loadMutations(() => {
                this.updateMutationCheckBoxOptions(this.props.molProfileMapping.currentMutations.length>0);
            });
            this.props.availableProfiles.forEach(d => {
                if (d.type === "molecular") {
                    this.props.molProfileMapping.loadMolecularData(d.profile, () => {
                        this.updateMolecularCheckBoxOptions(d.profile, this.props.molProfileMapping.currentMolecular[d.profile].length>0);
                    })
                }
            });
        });

    }

    addGenes() {
        const mappingTypes = this.state.mutationOptions.filter(d => d.selected).map(d => d.id);
        const profiles=this.state.molecularOptions.filter(d => d.selected).map(d => d.profile);
        this.props.molProfileMapping.getMultipleProfiles(profiles, mappingTypes).forEach(d=>this.props.handleGeneSelect(d));
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


    getTimepointSearchField() {
        if (this.state.selectionType === "clinical") {
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
                value={d.id}>{d.name}</Checkbox>));
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
        return <Alert>
            <FormGroup>{checkBoxes}</FormGroup>
            <Button onClick={this.addGenes}>Add genes</Button>
        </Alert>;
    }


    render() {
        return (<Form horizontal>
                <FormGroup>
                    <Col sm={4} style={{paddingRight: "0"}}>
                        <FormControl style={{height: 38}} componentClass="select"
                                     onChange={this.handleCategorySelect}
                                     placeholder="Select Category">
                            <option value={"clinical"}>Clinical Data</option>
                            <option value={"genes"}>Genomic Data</option>
                        </FormControl>
                    </Col>
                    <Col sm={8} style={{padding: 0}}>
                        {this.getTimepointSearchField()}
                    </Col>
                </FormGroup>

                {this.state.showCheckBoxOptions ? this.getAvailableCheckBoxes() : null}

            </Form>
        )
    }
});
export default VariableSelector;
