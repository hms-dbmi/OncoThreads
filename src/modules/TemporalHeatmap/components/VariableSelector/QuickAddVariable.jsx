import React from 'react';
import { inject, observer } from 'mobx-react';
import {
    Button, Col, Form, FormControl, FormGroup,
} from 'react-bootstrap';
import Select from 'react-select';
import { extendObservable } from 'mobx';
import OriginalVariable from '../../stores/OriginalVariable';
import UtilityFunctions from '../../UtilityClasses/UtilityFunctions';

/**
 * Component for fast selection of variables
 */
const QuickAddVariable = inject('rootStore', 'undoRedoStore')(observer(class QuickAddVariable extends React.Component {
    /**
     * checks if the pressed key is the enter key
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
        extendObservable(this,
            QuickAddVariable.getObservableFields());
        this.geneOptions = this.createGeneOptions();
        this.searchGenes = this.searchGenes.bind(this);
        this.updateSearchValue = this.updateSearchValue.bind(this);
        this.handleEnterPressed = this.handleEnterPressed.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.handleOptionSelect = this.handleOptionSelect.bind(this);
        this.handleProfileSelect = this.handleProfileSelect.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.addVariablesEnter = this.addVariablesEnter.bind(this);
    }

    /**
     * gets initial state
     * @return {{category: string, profile: string, geneListString: string,
     * selectedValues: Object[]}}
     */
    static getObservableFields() {
        return {
            category: 'clinical', // either clinical, computed, gene or any of the event categories
            selectedGeneOption: undefined, // selected molecular profile
            geneListString: '', // text entered in gene search fields
            selectedValues: [], // selected values
        };
    }

    /**
     * gets either a Select component or a text field depending on the currently selected category
     * @return {(Col|Col[])}
     */
    getSearchField() {
        if (this.category === 'clinical' || this.category === 'computed'
            || Object.keys(this.props.rootStore.eventAttributes).includes(this.category)) {
            return (
                <Col sm={9} style={{ padding: 0 }}>
                    <Select
                        value={this.selectedValues.slice()}
                        type="text"
                        isMulti
                        searchable
                        componentClass="select"
                        placeholder="Select..."
                        searchPlaceholder="Search variable"
                        options={this.createOptions()}
                        onChange={this.handleOptionSelect}
                        onKeyDown={this.addVariablesEnter}
                    />
                </Col>
            );
        }
        return ([
            <Col sm={7} style={{ padding: 0 }} key="searchfield">
                <FormControl
                    style={{ height: 38 }}
                    type="textarea"
                    placeholder="Enter one or multiple HUGO Gene Symbols (e.g. TP53 IDH1)"
                    onChange={this.updateSearchValue}
                    onKeyDown={this.handleEnterPressed}
                    value={this.geneListString}
                />
            </Col>,
            <Col sm={2} style={{ padding: 0 }} key="geneoptions">
                <FormControl
                    style={{ height: 38 }}
                    componentClass="select"
                    onChange={this.handleProfileSelect}
                    placeholder="Select Category"
                >
                    {this.geneOptions.map(d => (
                        <option
                            value={d.value}
                            key={d.value}
                        >
                            {d.label}
                        </option>
                    ))}
                </FormControl>
            </Col>,
        ]
        );
    }

    /**
     * creates selectable options for genes
     * @return {object[]}
     */
    createGeneOptions() {
        const options = [];
        if (this.props.rootStore.availableProfiles.map(d => d.molecularAlterationType).includes('MUTATION_EXTENDED')) {
            this.props.rootStore.mutationMappingTypes.forEach((d) => {
                options.push({ label: d, value: d, type: 'mutation' });
            });
        }
        if (this.props.rootStore.availableProfiles.length > 0) {
            this.props.rootStore.availableProfiles.forEach((d) => {
                if (d.molecularAlterationType !== 'MUTATION_EXTENDED') {
                    options.push({ label: d.name, value: d.molecularProfileId, type: 'molecular' });
                }
            });
        }
        return options;
    }

    /**
     * adds an event variable
     */
    addEventVariable() {
        if (this.category !== 'computed') {
            if (this.selectedValues.length > 0) {
                this.selectedValues.forEach((d) => {
                    const variable = new OriginalVariable(d.value, d.label, 'BINARY', `Indicates if event: "${d.label}" has happened between two timepoints`,
                        [], [], this.props.rootStore.eventMappers[d.value], this.category, 'event');
                    this.props.rootStore.dataStore.variableStores
                        .between.addVariableToBeDisplayed(variable);
                });
                this.props.undoRedoStore.saveVariableHistory('ADD', this.selectedValues.map(d => d.label), true);
            }
        } else {
            this.selectedValues.forEach((d) => {
                const variable = new OriginalVariable(d.object.id, d.object.name, d.object.datatype,
                    d.object.description, [], [], this.props.rootStore.staticMappers[d.object.id], 'Computed', 'computed');
                this.props.rootStore.dataStore.variableStores.between
                    .addVariableToBeDisplayed(variable);
            });
            this.props.undoRedoStore.saveVariableHistory('ADD', this.selectedValues.map(d => d.label), true);
        }
        this.selectedValues = [];
    }


    /**
     * creates oprtions for event variables
     * @returns {Object[]}
     */
    createEventOptions() {
        const options = [];
        if (this.category !== 'computed') {
            Object.keys(this.props.rootStore.eventAttributes[this.category])
                .forEach((key) => {
                    const subOptions = this.props.rootStore.eventAttributes[this.category][key]
                        .map(d => ({
                            label: d.name,
                            value: d.id,
                            object: d,
                        }));

                    options.push({ label: UtilityFunctions.toTitleCase(key), options: subOptions });
                });
        } else {
            options.push({
                label: 'Timepoint Distance',
                value: this.props.rootStore.timeDistanceId,
                object: {
                    id: this.props.rootStore.timeDistanceId,
                    name: 'Timepoint Distance',
                    description: 'Time between timepoints',
                    datatype: 'NUMBER',
                },
            });
        }
        return options;
    }

    /**
     * creates options for sample variables
     * @returns {Object[]}
     */
    createTimepointOptions() {
        const sampleOptions = [];
        const self = this;
        this.props.rootStore.clinicalSampleCategories
            .filter(category => !this.props.rootStore.dataStore
                .variableStores.sample.fullCurrentVariables
                .map(d => d.id).includes(category.id)).forEach((d) => {
                const lb = (
                    <div
                        className="wordBreak"
                        style={{ textAlign: 'left' }}
                        key={d.variable}
                    >
                        <b>{d.variable}</b>
                        {`: ${d.description}, variability: ${Number(self.props.rootStore.scoreStore.scoreStructure[d.id]).toPrecision(2)}`}
                    </div>
                );
                sampleOptions.push({
                    value: d.variable + d.description, label: lb, object: d, profile: 'clinSample',
                });
            });
        const patientOptions = [];
        this.props.rootStore.clinicalPatientCategories
            .filter(category => !this.props.rootStore.dataStore
                .variableStores.sample.fullCurrentVariables
                .map(d => d.id).includes(category.id)).forEach((d) => {
                const lb = (
                    <div
                        className="wordBreak"
                        style={{ textAlign: 'left' }}
                        key={d.variable}
                    >
                        <b>{d.variable}</b>
                        {`: ${d.description}`}
                    </div>
                );
                patientOptions.push({
                    value: `${d.variable} ${d.description}`,
                    label: lb,
                    object: d,
                    profile: 'clinPatient',
                });
            });
        return [{ label: 'Sample-specific', options: sampleOptions }, {
            label: 'Patient-specific', options: patientOptions,
        }];
    }

    /**
     * creates selection options
     * @returns {Object[]}
     */
    createOptions() {
        if (this.category !== 'clinical') {
            return this.createEventOptions();
        }

        return this.createTimepointOptions();
    }

    /**
     * handles adding variables when enter is pressed
     * @param {event} e
     */
    addVariablesEnter(e) {
        if (QuickAddVariable.checkEnterPressed(e)) {
            this.handleAdd();
        }
    }

    /**
     * handles adding a variable
     */
    handleAdd() {
        if (this.category === 'clinical') {
            this.addClinicalVariables();
        } else if (this.category === 'genes') {
            this.searchGenes();
        } else {
            this.addEventVariable();
        }
    }

    /**
     * adds a clinical variable
     */
    addClinicalVariables() {
        if (this.selectedValues.length > 0) {
            this.selectedValues.forEach((d) => {
                this.props.rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable(d.object.id, d.object.variable, d.object.datatype, d.object.description, [], [], this.props.rootStore.staticMappers[d.object.id], d.profile, 'clinical'));
            });
            this.props.undoRedoStore.saveVariableHistory('ADD', this.selectedValues.map(d => d.object.variable), true);
            this.selectedValues = [];
        }
    }

    /**
     * handles pressing enter after entering genes into the search field
     * @param {event} event
     */
    handleEnterPressed(event) {
        if (QuickAddVariable.checkEnterPressed(event)) {
            this.searchGenes();
        }
    }

    /**
     * searches for the genes entered in the search field
     */
    searchGenes() {
        const geneList = this.geneListString.replace(/(\r\n\t|\n|\r\t)/gm, '').toUpperCase().split(' ');
        geneList.forEach((d, i) => {
            if (d.includes('ORF')) {
                geneList[i] = d.replace('ORF', 'orf');
            }
        });
        if (this.selectedGeneOption === undefined) {
            this.selectedGeneOption = this.geneOptions[0].value;
        }
        if (this.geneOptions.filter(d => this.selectedGeneOption === d.value)[0].type === 'mutation') {
            this.props.rootStore.molProfileMapping.getMutationProfiles(geneList,
                this.selectedGeneOption, (newVariables) => {
                    this.props.rootStore.dataStore.variableStores.sample
                        .addVariablesToBeDisplayed(newVariables);
                    this.props.undoRedoStore.saveVariableHistory('ADD', geneList, true);
                });
        } else {
            this.props.rootStore.molProfileMapping.getMolecularProfiles(geneList,
                this.selectedGeneOption, (newVariables) => {
                    this.props.rootStore.dataStore.variableStores.sample
                        .addVariablesToBeDisplayed(newVariables);
                    this.props.undoRedoStore.saveVariableHistory('ADD', geneList, true);
                });
        }
        this.geneListString = '';
    }

    /**
     * updates the value of geneListString with the current content of the search field
     * @param {event} event
     */
    updateSearchValue(event) {
        this.geneListString = event.target.value;
    }

    /**
     * handles selecting a category
     * @param {Object} e
     */
    handleSelect(e) {
        let selectedOption = '';
        if (this.geneOptions.length > 0) {
            selectedOption = this.geneOptions[0].value;
        }
        this.category = e.target.value;
        this.selectedValues = [];
        this.geneListString = '';
        this.selectedGeneOption = selectedOption;
    }

    /**
     * handles selecting a molecular profile
     * @param {event} e
     */
    handleProfileSelect(e) {
        this.selectedGeneOption = e.target.value;
    }

    /**
     * handles selecting an option
     * @param {Object[]} selectedOptions
     */
    handleOptionSelect(selectedOptions) {
        if (selectedOptions.length > 0) {
            this.selectedValues = selectedOptions;
        } else {
            this.selectedValues = [];
        }
    }


    render() {
        const options = [];
        if (this.props.rootStore.clinicalSampleCategories.length > 0
            || this.props.rootStore.clinicalPatientCategories.length > 0) {
            options.push(<option key="clinical" value="clinical">Predefined</option>);
        }
        if (this.props.rootStore.availableProfiles.length > 0) {
            options.push(<option key="genes" value="genes">Genomic</option>);
        }

        return (
            <Form horizontal>
                <FormGroup style={{ margin: 0 }}>
                    <Col sm={2} style={{ paddingRight: '0' }}>
                        <FormControl
                            style={{ height: 38 }}
                            componentClass="select"
                            onChange={this.handleSelect}
                            placeholder="Select Category"
                        >
                            <optgroup label="Timepoint Variables">
                                {options}
                            </optgroup>
                            <optgroup label="Event Variables">
                                {Object.keys(this.props.rootStore.eventAttributes).filter(d => d !== 'SPECIMEN').map(d => (
                                    <option
                                        value={d}
                                        key={d}
                                    >
                                        {UtilityFunctions.toTitleCase(d)}
                                    </option>
                                ))}
                                <option value="computed" key="computed">Computed variables</option>
                            </optgroup>
                        </FormControl>
                    </Col>
                    {this.getSearchField()}
                    <Col sm={1} style={{ paddingLeft: 0 }}>
                        <Button style={{ height: 38 }} onClick={this.handleAdd}>
                            Add
                        </Button>
                    </Col>
                </FormGroup>
            </Form>
        );
    }
}));
export default QuickAddVariable;
