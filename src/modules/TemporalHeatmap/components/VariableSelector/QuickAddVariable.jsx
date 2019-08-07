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
            QuickAddVariable.getInitialState(props));
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
    static getInitialState(props) {
        let profile = '';
        if (props.rootStore.availableProfiles.length > 0) {
            profile = props.rootStore.availableProfiles[0].molecularProfileId;
        }
        return {
            category: 'clinical', // either clinical, computed, gene or any of the event categories
            profile, // selected molecular profile
            geneListString: '', // text entered in gene search fiels
            selectedValues: [], // selected values
        };
    }

    /**
     * gets either a Select component or a text field depending on the currently selected category
     * @return {(Select|FormControl)}
     */
    getSearchField() {
        if (this.category === 'clinical' || this.category === 'computed' || this.props.rootStore.eventCategories.includes(this.category)) {
            return (
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
            );
        }

        return (
            <FormControl
                style={{ height: 38 }}
                type="textarea"
                placeholder="Enter one or multiple HUGO Gene Symbols (e.g. TP53 IDH1)"
                onChange={this.updateSearchValue}
                onKeyDown={this.handleEnterPressed}
                value={this.geneListString}
            />
        );
    }

    /**
     * adds an event variable
     */
    addEventVariable() {
        if (this.category !== 'computed') {
            if (this.selectedValues.length > 0) {
                this.addVariablesSeperate();
                this.props.undoRedoStore.saveVariableHistory('ADD', this.selectedValues.map(d => d.label), true);
            }
        } else {
            this.selectedValues.forEach((d) => {
                const variable = new OriginalVariable(d.object.id, d.object.name, d.object.datatype, d.object.description, [], [], this.props.rootStore.staticMappers[d.object.id], 'Computed', 'computed');
                this.props.rootStore.dataStore.variableStores.between
                    .addVariableToBeDisplayed(variable);
            });
            this.props.undoRedoStore.saveVariableHistory('ADD', this.selectedValues.map(d => d.label), true);
        }
        this.selectedValues = [];
    }

    /**
     * adds variables as separate rows
     */
    addVariablesSeperate() {
        this.selectedValues.forEach(d => this.props.rootStore.dataStore.variableStores.between.addVariableToBeDisplayed(new OriginalVariable(d.value, d.label, 'BINARY', `Indicates if event: "${d.label}" has happened between two timepoints`, [], [], this.props.rootStore.getSampleEventMapping(this.category, d.object), this.category, 'event')));
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
                    const subOptions = [];
                    this.props.rootStore.eventAttributes[this.category][key].forEach((d) => {
                        const option = {
                            label: d.name,
                            value: d.id,
                            object: d,
                        };
                        subOptions.push(option);
                    });
                    options.push({ label: key, options: subOptions });
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
        this.props.rootStore.molProfileMapping.getProfileData(this.profile,
            geneList, 'Binary', (newVariables) => {
                this.props.rootStore.dataStore.variableStores.sample
                    .addVariablesToBeDisplayed(newVariables);
                this.props.undoRedoStore.saveVariableHistory('ADD', geneList, true);
            });
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
        let profile = '';
        if (this.props.rootStore.availableProfiles.length > 0) {
            profile = this.props.rootStore.availableProfiles[0].molecularProfileId;
        }
        this.category = e.target.value;
        this.geneListString = '';
        this.profile = profile;
    }

    /**
     * handles selecting a molecular profile
     * @param {event} e
     */
    handleProfileSelect(e) {
        const profile = this.props.rootStore.availableProfiles
            .filter(d => d.molecularProfileId === e.target.value)[0];
        this.profile = profile.molecularProfileId;
    }

    /**
     * handles selecting a sample variable option
     * @param {Object[]} selectedOptions
     */
    handleTimepointOptionSelect(selectedOptions) {
        if (selectedOptions.length > 0) {
            this.selectedValues = selectedOptions;
        } else {
            this.selectedValues = [];
        }
    }

    /**
     * handles selecting an event variable option
     * @param {Object[]} selectedOptions
     */
    handleEventOptionSelect(selectedOptions) {
        if (selectedOptions.length > 0) {
            this.selectedValues = selectedOptions;
        } else {
            this.selectedValues = [];
        }
    }

    /**
     * handles selecting an option
     * @param {Object[]} selectedOptions
     */
    handleOptionSelect(selectedOptions) {
        if (this.category !== 'clinical') {
            this.handleEventOptionSelect(selectedOptions);
        } else {
            this.handleTimepointOptionSelect(selectedOptions);
        }
    }


    render() {
        let selectMappingType = null;
        let colSize = 0;
        if (this.category === 'genes') {
            colSize = 2;
            selectMappingType = (
                <Col sm={colSize} style={{ padding: 0 }}>
                    <FormControl
                        style={{ height: 38 }}
                        componentClass="select"
                        onChange={this.handleProfileSelect}
                        placeholder="Select Category"
                    >
                        {this.props.rootStore.availableProfiles.map(d => (
                            <option
                                value={d.molecularProfileId}
                                key={d.molecularProfileId}
                            >
                                {d.name}
                            </option>
                        ))}
                    </FormControl>
                </Col>
            );
        }
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
                                {this.props.rootStore.eventCategories.filter(d => d !== 'SPECIMEN').map(d => (
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
                    <Col sm={9 - colSize} style={{ padding: 0 }}>
                        {this.getSearchField()}
                    </Col>
                    {selectMappingType}
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
