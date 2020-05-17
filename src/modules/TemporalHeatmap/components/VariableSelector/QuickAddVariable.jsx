import React from 'react';
import { inject, observer } from 'mobx-react';
import {
    Button, Col, Form, FormControl, FormGroup,
} from 'react-bootstrap';
import Select from 'react-select';
import { extendObservable } from 'mobx';
import OriginalVariable from '../../stores/OriginalVariable';
import {toTitleCase} from '../../UtilityClasses/UtilityFunctions';
import MutationSelector from '../Modals/MutationSelector';

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
        extendObservable(this, this.getObservableFields(props));
        this.addGeneVariables = this.addGeneVariables.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.handleOptionSelect = this.handleOptionSelect.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.addVariablesEnter = this.addVariablesEnter.bind(this);
    }

    /**
     * gets initial state
     * @return {{category: string, profile: string, geneListString: string,
     * selectedValues: Object[]}}
     */
     getObservableFields(props) {
        return {
            category: props.rootStore.hasClinical?'clinical':'genes', // either clinical, computed, gene or any of the event categories
            selectedValues: [], // selected values
        };
    }

    /**
     * gets either a Select component or a text field depending on the currently selected category
     * @return {(Col|Col[])}
     */
    getSearchField() {
        if (this.category === 'genes') {
            return (
                <Col sm={10} style={{ paddingLeft: 0 }}>
                    <MutationSelector addGeneVariables={this.addGeneVariables} noPadding />
                </Col>
            );
        }
        let values = this.selectedValues.slice();
        if (this.category === 'clinical') {
            values = values.map((value) => {
                const copy = value;
                copy.label = value.object.variable;
                return copy;
            });
        }
        return (
            [
                <Col sm={9} style={{ padding: 0 }} key="searchfield">
                    <Select
                        value={values}
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
                </Col>,
                <Col sm={1} style={{ paddingLeft: 0 }} key="button">
                    <Button style={{ height: 38 }} onClick={this.handleAdd}>
                            Add
                    </Button>
                </Col>,
            ]
        );
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
        this.selectedValues.clear();
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

                    options.push({ label: toTitleCase(key), options: subOptions });
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
        this.props.rootStore.clinicalSampleCategories
            .filter(category => !this.props.rootStore.dataStore
                .variableStores.sample.fullCurrentVariables
                .map(d => d.id).includes(category.id)).forEach((d) => {
                const lb = (
                    <div
                        className="wordBreak"
                        style={{ textAlign: 'left' }}
                    >
                        <b>{d.variable}</b>
                        {`: ${d.description}`}
                    </div>
                );
                sampleOptions.push({
                    value: d.variable + d.description,
                    label: lb,
                    object: d,
                    profile: 'clinSample',
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
        if (this.category === 'clinical') {
            return this.createTimepointOptions();
        }
        return this.createEventOptions();
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
                this.props.rootStore.dataStore.variableStores.sample
                    .addVariableToBeDisplayed(new OriginalVariable(d.object.id, d.object.variable,
                        d.object.datatype, d.object.description, [], [],
                        this.props.rootStore.staticMappers[d.object.id], d.profile,
                        'clinical'));
            });
            this.props.undoRedoStore.saveVariableHistory('ADD', this.selectedValues.map(d => d.object.variable), true);
            this.selectedValues.clear();
        }
    }

    /**
     * adds gene variables to data
     * @param {object[]} selectedOptions
     */
    addGeneVariables(selectedOptions) {
        const mappingTypes = selectedOptions.filter(d => d.type === 'mutation').map(d => d.value);
        const profiles = selectedOptions.filter(d => d.type === 'molecular').map(d => d.value);
        this.props.rootStore.dataStore.variableStores.sample
            .addVariablesToBeDisplayed(this.props.rootStore.molProfileMapping
                .getMultipleProfiles(profiles, mappingTypes));
    }

    /**
     * handles selecting a category
     * @param {Object} e
     */
    handleSelect(e) {
        this.category = e.target.value;
        this.selectedValues.clear();
    }

    /**
     * handles selecting an option
     * @param {Object[]} selectedOptions
     */
    handleOptionSelect(selectedOptions) {
        if (selectedOptions !== null) {
            this.selectedValues.replace(selectedOptions);
        } else {
            this.selectedValues.clear();
        }
    }


    render() {
        const options = [];
        if (this.props.rootStore.clinicalSampleCategories.length > 0
            || this.props.rootStore.clinicalPatientCategories.length > 0) {
            options.push(<option key="clinical" value="clinical">Predefined</option>);
        }
        if (this.props.rootStore.hasProfileData) {
            options.push(<option key="genes" value="genes">Genomic</option>);
        }

        return (
            <Form horizontal>
                <FormGroup style={{ margin: 0 }}>
                    <Col sm={2} style={{ paddingRight: '0', paddingLeft: '0' }}>
                        <FormControl
                            style={{ height: 38 }}
                            componentClass="select"
                            onChange={this.handleSelect}
                            placeholder="Select Category"
                        >
                            <optgroup label="Timepoint Features">
                                {options}
                            </optgroup>
                            <optgroup label="Event Features">
                                {Object.keys(this.props.rootStore.eventAttributes).filter(d => d !== 'SPECIMEN').map(d => (
                                    <option
                                        value={d}
                                        key={d}
                                    >
                                        {toTitleCase(d)}
                                    </option>
                                ))}
                                <option value="computed" key="computed">Computed features</option>
                            </optgroup>
                        </FormControl>
                    </Col>
                    {this.getSearchField()}
                </FormGroup>
            </Form>
        );
    }
}));
export default QuickAddVariable;
