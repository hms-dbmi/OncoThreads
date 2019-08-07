import React from 'react';
import { inject, observer } from 'mobx-react';
import { Alert, Button, Checkbox, Col, ControlLabel, Form, FormControl, FormGroup } from 'react-bootstrap';
import { extendObservable } from 'mobx';
import Select from 'react-select';
import OriginalVariable from '../../stores/OriginalVariable';
import VariableExplorer from '../Modals/VariableExplorer';

/**
 * Component for selecting timepoint variables in variable manager
 */
const TimepointVariableSelector = inject('variableManagerStore', 'rootStore')(observer(class TimepointVariableSelector extends React.Component {
    /**
     * checks if the pressed key was the enter key
     * @param {event} event
     * @return {boolean}
     */
    static checkEnterPressed(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            return true;
        }
        return false;
    }

    constructor(props) {
        super(props);
        extendObservable(this, {
            geneListString: '',
            selectionType: 'clinical',
            mutationOptions: [],
            molecularOptions: [],
            clinicalOptions: [],
            showAvailableData: false,
            modalIsOpen: false,
        });
        this.handleOptionSelect = this.handleOptionSelect.bind(this);
        this.searchGenes = this.searchGenes.bind(this);
        this.updateSearchValue = this.updateSearchValue.bind(this);
        this.geneSearchEnter = this.geneSearchEnter.bind(this);
        this.updateMutationCheckBoxOptions = this.updateMutationCheckBoxOptions.bind(this);
        this.updateMolecularCheckBoxOptions = this.updateMolecularCheckBoxOptions.bind(this);
        this.resetSelected = this.resetSelected.bind(this);
        this.addGenes = this.addGenes.bind(this);
        this.addVariables = this.addVariables.bind(this);
        this.addEnter = this.addEnter.bind(this);
        this.addClinicalVariables = this.addClinicalVariables.bind(this);
    }

    /**
     * creates all selectable options
     * @return {Object[]}
     */
    createOptions() {
        const savedOptions = [];
        this.props.variableManagerStore.savedReferences.forEach((d) => {
            const variable = this.props.variableManagerStore.getById(d);
            const lb = (
                <div
                    style={{ textAlign: 'left' }}
                    key={d}
                >
                    <b>{variable.name}</b>
                    {`: ${variable.description}`}
                </div>
            );
            savedOptions.push({
                value: variable.name + variable.description,
                label: lb,
                object: variable.id,
                type: 'saved',
            });
        });
        const sampleOptions = [];
        const self = this;
        this.props.rootStore.clinicalSampleCategories.forEach((d) => {
            const lb = (
                <div
                    style={{ textAlign: 'left' }}
                    key={d.variable}
                >
                    <b>{d.variable}</b>
                    {`: ${d.description}, variability: ${Number(self.props.rootStore.scoreStore.scoreStructure[d.id]).toPrecision(2)}`}
                </div>
            );
            sampleOptions.push({
                value: d.variable + d.description, label: lb, object: d, type: 'clinSample',
            });
        });
        const patientOptions = [];
        this.props.rootStore.clinicalPatientCategories.forEach((d) => {
            const lb = (
                <div
                    style={{ textAlign: 'left' }}
                    key={d.variable}
                >
                    <b>{d.variable}</b>
                    {`: ${d.description}`}
                </div>
            );
            patientOptions.push({
                value: `${d.variable} ${d.description}`, label: lb, object: d, type: 'clinPatient',
            });
        });
        return [{ label: 'Saved variables', options: savedOptions },
            { label: 'Sample-specific', options: sampleOptions },
            { label: 'Patient-specific', options: patientOptions }];
    }

    /**
     * handle selection of an option
     * @param {Object[]} selectedOptions
     */
    handleOptionSelect(selectedOptions) {
        this.clinicalOptions = selectedOptions;
    }


    /**
     * updates the checkboxes showing the different mutation data types
     * @param {boolean} hasData
     */
    updateMutationCheckBoxOptions(hasData) {
        if (hasData) {
            this.props.rootStore.mutationMappingTypes.forEach((d) => {
                this.mutationOptions.push({ id: d, selected: false });
            });
        }
        this.showAvailableData = true;
    }

    /**
     * updates the checkboxes showing the different molecular profiles
     * @param {string} profile
     * @param {boolean} hasData
     */
    updateMolecularCheckBoxOptions(profile, hasData) {
        if (hasData) {
            if (!this.molecularOptions.map(d => d.id).includes(profile)) {
                this.molecularOptions.push({
                    id: profile,
                    profile,
                    name: this.props.rootStore.availableProfiles
                        .filter(d => d.molecularProfileId === profile)[0].name,
                    selected: false,
                });
            }
        } else if (this.molecularOptions.map(d => d.id).includes(profile)) {
            this.molecularOptions.splice(this.molecularOptions.map(d => d.id).indexOf(profile), 1);
        }
        this.showAvailableData = true;
    }

    /**
     * searches for the genes entered in the search field
     */
    searchGenes() {
        this.molecularOptions = [];
        this.mutationOptions = [];
        const geneList = this.geneListString.replace(/(\r\n\t|\n|\r\t)/gm, '').toUpperCase().split(' ');
        geneList.forEach((d, i) => {
            if (d.includes('ORF')) {
                geneList[i] = d.replace('ORF', 'orf');
            }
        });
        // check for which profiles data is available for the entered HUGOSymbols
        this.props.rootStore.molProfileMapping
            .getDataContainingProfiles(geneList, (dataProfiles) => {
                this.props.rootStore.availableProfiles.forEach((d) => {
                    if (d.molecularAlterationType === 'MUTATION_EXTENDED') {
                        this.updateMutationCheckBoxOptions(dataProfiles
                            .includes(d.molecularProfileId));
                    } else {
                        this.updateMolecularCheckBoxOptions(d.molecularProfileId, dataProfiles
                            .includes(d.molecularProfileId));
                    }
                });
            });
    }

    /**
     * adds Genes to view
     */
    addGenes() {
        this.getOnDemandVariables().forEach((variable) => {
            this.props.variableManagerStore.addVariableToBeDisplayed(variable);
            this.props.variableManagerStore.toggleSelected(variable.id);
        });
        this.geneListString = '';
        this.showAvailableData = false;
    }

    /**
     * updates the value of geneListString with the current content of the search field
     * @param {event} event
     */
    updateSearchValue(event) {
        this.geneListString = event.target.value;
        this.showAvailableData = false;
    }

    /**
     * handles pressing enter after entering genes into the search field
     * @param {event} event
     */
    geneSearchEnter(event) {
        if (TimepointVariableSelector.checkEnterPressed(event)) {
            this.searchGenes();
        }
    }

    addEnter(event) {
        if (TimepointVariableSelector.checkEnterPressed(event)) {
            this.addVariables();
        }
    }

    /**
     * toggles selection of a checkbox
     * @param {number} index
     * @param {boolean} isMutation
     */
    toggleSelect(index, isMutation) {
        if (isMutation) {
            this.mutationOptions[index].selected = !this.mutationOptions[index].selected;
        } else {
            this.molecularOptions[index].selected = !this.molecularOptions[index].selected;
        }
    }


    /**
     * gets the checkboxes for the available genomic data
     * @returns {Form}
     */
    getAvailableCheckBoxes() {
        let checkBoxes = [];
        if (this.mutationOptions.length > 0 || this.molecularOptions.length > 0) {
            checkBoxes.push(<h5 key="header">Available data for gene(s)</h5>);
        } else {
            checkBoxes = 'No data available';
        }
        if (this.mutationOptions.length > 0) {
            const available = [];
            this.mutationOptions.forEach((d, i) => available.push(
                <Checkbox
                    onChange={() => this.toggleSelect(i, true)}
                    checked={d.selected}
                    key={d.id}
                    value={d.id}
                >
                    {d.id}
                </Checkbox>,
            ));
            checkBoxes.push(
                <Col key="Mutations" sm={6}>
                    <ControlLabel>Mutations</ControlLabel>
                    {available}
                </Col>,
            );
        }
        if (this.molecularOptions.length > 0) {
            const available = [];
            this.molecularOptions.forEach((d, i) => available.push(
                <Checkbox
                    onChange={() => this.toggleSelect(i, false)}
                    checked={d.selected}
                    key={d.id}
                    value={d.id}
                >
                    {d.name}
                </Checkbox>,
            ));
            checkBoxes.push(
                <Col key="Molecular" sm={6}>
                    <ControlLabel>Molecular Profiles</ControlLabel>
                    {available}
                </Col>,
            );
        }
        return (
            <Col sm={10} smOffset={2}>
                <Alert>
                    <FormGroup onKeyDown={this.addEnter}>{checkBoxes}</FormGroup>
                </Alert>
            </Col>
        );
    }

    addVariables() {
        this.addClinicalVariables();
        this.addGenes();
    }

    addClinicalVariables() {
        this.getClinicalVariables().forEach((variable) => {
            this.props.variableManagerStore.addVariableToBeDisplayed(variable);
        });
        this.clinicalOptions = [];
    }

    getClinicalVariables() {
        const variables = [];
        this.clinicalOptions.map(d => d.object).forEach((selectedOption) => {
            if (selectedOption.source !== 'derived') {
                variables.push(new OriginalVariable(selectedOption.id, selectedOption.variable, selectedOption.datatype, selectedOption.description, [], [], this.props.rootStore.staticMappers[selectedOption.id], selectedOption.source, 'clinical'));
            } else {
                variables.push(this.props.variableManagerStore.getById(selectedOption));
            }
        });
        return variables;
    }

    /**
     * gets all on-demand variables
     * @return {OriginalVariable[]}
     */
    getOnDemandVariables() {
        const mappingTypes = this.mutationOptions.filter(d => d.selected).map(d => d.id);
        const profiles = this.molecularOptions.filter(d => d.selected).map(d => d.profile);
        return this.props.rootStore.molProfileMapping.getMultipleProfiles(profiles, mappingTypes);
    }

    /**
     * gets all existing derived variables
     * @return {any[]}
     */
    getDerivedVariables() {
        return Object.keys(this.props.variableManagerStore.referencedVariables)
            .map(id => this.props.variableManagerStore.referencedVariables[id])
            .filter(d => d.derived === true);
    }

    /**
     * gets all variables that can be explored
     * @return {any[]}
     */
    getAllVariables() {
        return this.getDerivedVariables()
            .concat(...this.getClinicalVariables()).concat(...this.getOnDemandVariables());
    }

    resetSelected() {
        this.clinicalOptions = [];
        this.geneListString = '';
        this.showAvailableData = false;
    }

    render() {
        const formGroups = [];
        if (this.props.rootStore.clinicalSampleCategories.length > 0
            || this.props.rootStore.clinicalPatientCategories.length > 0) {
            formGroups.push(
                <FormGroup key="clinical">
                    <Col componentClass={ControlLabel} sm={2}>
                        Variables
                    </Col>
                    <Col sm={10}>
                        <Select
                            value={this.clinicalOptions.slice()}
                            type="text"
                            searchable
                            isMulti
                            componentClass="select"
                            placeholder="Select..."
                            searchPlaceholder="Search variable"
                            options={this.createOptions()}
                            onChange={this.handleOptionSelect}
                            onKeyDown={this.addEnter}
                        />
                    </Col>


                </FormGroup>,
            );
        }
        if (this.props.rootStore.availableProfiles.length > 0) {
            formGroups.push(
                <FormGroup key="genetic">
                    <Col componentClass={ControlLabel} sm={2}>
                        Find gene
                    </Col>
                    <Col sm={8} style={{ paddingRight: 0 }}>
                        <FormControl
                            style={{ height: 38 }}
                            type="textarea"
                            placeholder="Enter one or multiple HUGO Gene Symbols (e.g. TP53 IDH1)"
                            onChange={this.updateSearchValue}
                            onKeyDown={this.geneSearchEnter}
                            value={this.geneListString}
                        />
                    </Col>
                    <Col sm={2}>
                        <Button className="pull-right" style={{ height: 38 }} onClick={this.searchGenes}>
                            Search
                        </Button>
                    </Col>
                </FormGroup>,
            );
        }
        return (
            <div>
                <h4>
                    Select Variable
                    <Button
                        bsSize="xsmall"
                        className="pull-right"
                        onClick={() => {
                            this.modalIsOpen = true;
                        }}
                        key="explore"
                    >
                        Explore Variables
                    </Button>
                </h4>
                <Form horizontal>
                    {formGroups}
                    {this.showAvailableData ? this.getAvailableCheckBoxes() : null}
                    <FormGroup>
                        <Col smOffset={11} sm={1}>
                            <Button
                                className="pull-right"
                                onClick={this.addVariables}
                                key="add"
                            >
                                Add
                            </Button>
                        </Col>
                    </FormGroup>
                </Form>
                <VariableExplorer
                    close={() => {
                        this.modalIsOpen = false;
                    }}
                    reset={this.resetSelected}
                    availableCategories={this.props.availableCategories}
                    variables={this.getAllVariables()}
                    modalIsOpen={this.modalIsOpen}
                />
            </div>
        );
    }
}));
export default TimepointVariableSelector;
