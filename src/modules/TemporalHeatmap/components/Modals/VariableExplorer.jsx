import React from 'react';

import { inject, observer } from 'mobx-react';
import {
    Button,
    Checkbox,
    Col,
    ControlLabel,
    Form,
    FormGroup,
    Grid,
    Label,
    Modal,
    OverlayTrigger,
    Popover,
    Row,
} from 'react-bootstrap';
import PropTypes from 'prop-types';
import { extendObservable, toJS } from 'mobx';
import Select from 'react-select';
import LineUpView from './LineUpView';
import OriginalVariable from '../../stores/OriginalVariable';
import MutationSelector from './MutationSelector';


/**
 * Modal for exploring timepoint variables with lineUp
 */
const VariableExplorer = inject('rootStore', 'variableManagerStore')(observer(class VariableExplorer extends React.Component {
    constructor(props) {
        super(props);
        extendObservable(this, {
            selected: [],
            modalIsOpen: false,
            onDemandVariables: [],
            selectedScores: [],
            addedScores: [],
            addedColumns: [],
            get variables() {
                return this.getInitialVariables().concat(...this.onDemandVariables);
            },
            get profileDomains() {
                return this.updateVariableRanges();
            },
            get data() {
                return this.createData();
            },
        });
        /**
         * Definition of score columns.
         * column has to be identical to the keys used in the data.
         * label should be a descriptive name for score selection and column labeling
         * description should be short and concise
         * domain should be the actual numerical range of the score as a numerical array
         * leave empty if not defined.
         * @type {{column: string, label: string, description: string, domain: number[]}[]}
         */
        this.scores = [
            {
                column: 'changeRate',
                label: 'Rate of change',
                description: 'Percentage of values that change over time. For continuous variables big changes lead to higher scores.',
                domain: [0, 1],
                type: "across",
            },
            {
                column: 'modVRacross',
                label: 'modVRacross',
                description: 'ModVR implies Variation around the mode for categorical data. Low values of ModVR correspond to small amount of variation in data, and high values to larger amounts of variation. ModVRacross is calculated taking into account the ModVR of every patient (column scores), and taking their average.',
                domain: [0, 1],
                type: "across",
            },
            {
                column: 'AvgModVRtp',
                label: 'AvgModVRtp',
                description: 'ModVR implies Variation around the mode for categorical data. AvgModVRtp is calculated by computing ModVR for every timepoint, and taking their average.',
                domain: [0, 1],
                type: 'within',
            },
            {
                column: 'MaxModVRtp',
                label: 'MaxModVRtp',
                description: 'ModVR implies Variation around the mode for categorical data. MaxModVRtp is calculated by computing ModVR for every timepoint, and taking their maximum.',
                domain: [0, 1],
                type: 'within',
            },
            {
                column: 'MinModVRtp',
                label: 'MinModVRtp',
                description: 'ModVR implies Variation around the mode for categorical data. MinModVRtp is calculated by computing ModVR for every timepoint, and taking their minimum.',
                domain: [0, 1],
                type: 'within',
            },
            {
                column: 'AvgCoVTimeLine',
                label: 'AvgCoVTimeLine',
                description: 'Average Coefficient of Variation over all timepoints',
                domain: [],
                type: 'within',
            },
            {
                column: 'AvgCoeffUnalikeability',
                label: 'AvgCoeffUnalikeability',
                description: 'Focuses on how often observations differ - the higher the value, the more unalike the data are. ',
                domain: [0, 1],
                type: 'within',
            },
            {
                column: 'AvgVarianceTimeLine',
                label: 'AvgVarianceTimeLine',
                description: 'Average of Variance over timepoints',
                domain: [],
                type: 'within',
            }];
        this.addScore = this.addScore.bind(this);
        this.handleEnterAdd = this.handleEnterAdd.bind(this);
        this.removeColumn = this.removeColumn.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.addGeneVariables = this.addGeneVariables.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.toggleDesciptionColumn = this.toggleDesciptionColumn.bind(this);
    }

    /**
     * gets all the variables that should displayed by default
     * in LineUp
     * @return {Buffer | * | T[] | string}
     */
    getInitialVariables() {
        return this.getCurrentVariables().concat(this.getClinicalVariables()).concat(this.getSavedVariables());
    }

    /**
     * gets all the variables that are currently displayed in the table
     * @return { (DerivedVariable|OriginalVariable)[]}
     */
    getCurrentVariables() {
        return this.props.variableManagerStore.currentVariables
            .map(variable => this.props.variableManagerStore.referencedVariables[variable.id]);
    }

    /**
     * gets all clinical variables that are not yet displayed in the table
     * @return {OriginalVariable[]}
     */
    getClinicalVariables() {
        return this.props.rootStore.clinicalSampleCategories
            .concat(this.props.rootStore.clinicalPatientCategories)
            .filter(variable => !this.props.variableManagerStore.isInTable(variable.id))
            .map(variable => new OriginalVariable(variable.id, variable.variable,
                variable.datatype, variable.description, [], [], this.props.rootStore.staticMappers[variable.id], variable.source, 'clinical'));
    }

    getSavedVariables(){
        return this.props.variableManagerStore.savedReferences
            .filter(variableId => !this.props.variableManagerStore.isInTable(variableId))
            .map(variableId => this.props.variableManagerStore.referencedVariables[variableId]);
    }

    /**
     * gets selector for scores
     * @return {Select}
     */
    getScoreSelector() {
        let values = toJS(this.selectedScores);
        values = values.map((value) => {
            const copy = value;
            copy.label = value.name;
            return copy;
        });
        const transformToOption = scores => scores.map(score => ({
            label: (
                <div
                    style={{ textAlign: 'left' }}
                >
                    <b>{score.label}</b>
                    <br/>
                    {`Description: ${score.description}`}
                    <br/>
                    {`Range: ${score.domain.length === 2 ? `[${score.domain}]` : 'any'}`}
                </div>
            ),
            value: score.column,
            name: score.label,
        }));
        let options = [
            {
                label: "Across Time",
                options: transformToOption(this.scores.filter(score => score.type === 'across')),
            },
            {
                label: "Within Timepoints",
                options: transformToOption(this.scores.filter(score => score.type === 'within')),
            }];
        return (
            <Select
                searchable
                isMulti
                value={values}
                options={options}
                onChange={(s) => {
                    if (s !== null) {
                        this.selectedScores.replace(s);
                    } else {
                        this.selectedScores.clear();
                    }
                }}
                onKeyDown={this.handleEnterAdd}
            />
        );
    }

    /**
     * updates shared range of variables of the same profile (e.g. expression data)
     */
    updateVariableRanges() {
        const profileDomains = {};
        // only variables that are associated with a molecular profile and have a numerical range
        const profileVariables = this.variables.filter(variable => variable.type === 'molecular' && variable.datatype === 'NUMBER');
        profileVariables.forEach((variable) => {
            const domain = variable.getDefaultDomain();
            if (!(variable.profile in profileDomains)) {
                profileDomains[variable.profile] = domain;
            } else {
                profileDomains[variable.profile][0] = Math.min(domain[0],
                    profileDomains[variable.profile][0]);
                profileDomains[variable.profile][1] = Math.max(domain[1],
                    profileDomains[variable.profile][1]);
            }
        });
        return profileDomains;
    }

    /**
     * creates all selectable options
     * @return {Object[]}
     */
    createData() {
        return this.variables.map(variable => this.transformData(variable));
    }

    /**
     * transforms data to the format required by lineUp
     * @return {Object[]}
     */
    transformData(variable) {
        const newEntry = {};
        const values = Object.values(variable.mapper).filter(d => d !== undefined);
        newEntry.name = variable.name;
        newEntry.score = NaN;
        newEntry.description = variable.description;
        newEntry.datatype = variable.datatype;
        newEntry.source = !variable.derived ? this.props.availableCategories
            .filter(category => category.id === variable.profile)[0].name : 'Derived';
        if (variable.datatype === 'NUMBER') {
            newEntry.range = Math.max(...values) - Math.min(...values);
            newEntry.categories = [];
            newEntry.numcat = NaN;
            let range = variable.domain[1] - variable.domain[0];
            if (variable.type === 'molecular') {
                range = this.profileDomains[variable.profile][1]
                    - this.profileDomains[variable.profile][0];
            } else if (variable.profile === 'Variant allele frequency') {
                range = 1;
            }
            newEntry.changeRate = this.props.rootStore.scoreStore
                .getNumericalChangeRate(variable.mapper, range);
        } else {
            newEntry.range = NaN;
            newEntry.numcat = variable.domain.length;
            newEntry.categories = variable.domain.toString();
            newEntry.changeRate = this.props.rootStore.scoreStore
                .getCategoricalChangeRate(variable.mapper);
        }
        if (variable.profile === 'clinSample') {
            newEntry.score = this.props.rootStore.scoreStore.scoreStructure[variable.id];
        }
        newEntry.na = [].concat(...Object.values(this.props.rootStore.sampleStructure))
            .map(d => variable.mapper[d])
            .filter(d => d === undefined).length;
        newEntry.inTable = this.props.variableManagerStore.isInTable(variable.id) ? 'Yes' : 'No';
        newEntry.modVRacross = 0;
        newEntry.AvgModVRtp = 0; // average modVR from modVR of all timepoints
        newEntry.MaxModVRtp = 0; // max of all timepoints
        newEntry.MinModVRtp = 0; // min of all timepoints
        newEntry.AvgCoeffUnalikeability = 0;

        newEntry.AvgCoVTimeLine = 0;

        newEntry.AvgVarianceTimeLine = 0;

        if (variable.datatype !== 'NUMBER') { // treat string, binary the same way for now
            newEntry.modVRacross = this.props.rootStore.scoreStore
                .getModVRAcross(variable.datatype, variable.id, variable.mapper);
            const wt = this.props.rootStore.scoreStore
                .gerModVRWithin(variable.datatype, variable.mapper);

            var sum = 0; // sum of modVr of all timepoints

            var tp_length = this.props.rootStore.timepointStructure.length;
            wt.forEach((d, i) => {
                // newEntry['ModVRtp' + i]=d;
                sum += d;
            });
            newEntry.AvgModVRtp = sum / tp_length;
            newEntry.MaxModVRtp = Math.max(...wt);
            newEntry.MinModVRtp = Math.min(...wt);


            sum = 0;

            const wtu = this.props.rootStore.scoreStore
                .getCoeffUnalikeability(variable.datatype, variable.mapper);

            // console.log(wtu);

            wtu.forEach((d, i) => {
                // newEntry['ModVRtp' + i]=d;
                sum += d;
            });

            newEntry.AvgCoeffUnalikeability = sum / tp_length;

            // console.log(newEntry.AvgCoeffUnalikeability);
        } else if (variable.datatype === 'NUMBER') {
            const covt = this.props.rootStore.scoreStore
                .getCoeffientOfVarTimeLine(variable.datatype, variable.mapper);
            sum = 0;
            tp_length = this.props.rootStore.timepointStructure.length;
            covt.forEach((d) => {
                sum += d;
            });
            newEntry.AvgCoVTimeLine = sum / tp_length;
            // variance
            const variance = this.props.rootStore.scoreStore
                .getVarianceTimeLine(variable.datatype, variable.mapper);
            sum = 0;
            // console.log(variable);
            // console.log(variance);
            variance.forEach((d) => {
                sum += d;
            });
            newEntry.AvgVarianceTimeLine = sum / tp_length;

            // console.log(newEntry.AvgVarianceTimeLine);

            if (newEntry.AvgVarianceTimeLine === undefined) {
                console.log(variable);
            }
        }
        return newEntry;
    }

    /**
     * handles adding the selected variables
     */
    handleAdd() {
        this.props.variableManagerStore.addVariablesToBeDisplayed(this.selected
            .map(index => this.variables[index]));
        this.selected = [];
        this.onDemandVariables = [];
        this.props.close();
    }

    /**
     * selects rows in the data
     * @param {number[]} selected
     */
    handleSelect(selected) {
        this.selected.replace(selected);
    }

    /**
     * adds gene variables to data
     * @param {object[]} selectedOptions
     */
    addGeneVariables(selectedOptions) {
        const mappingTypes = selectedOptions.filter(d => d.type === 'mutation').map(d => d.value);
        const profiles = selectedOptions.filter(d => d.type === 'molecular').map(d => d.value);
        this.onDemandVariables.push(...this.props.rootStore.molProfileMapping
            .getMultipleProfiles(profiles, mappingTypes));
    }


    /**
     * removes a score from added scores
     * @param desc
     */
    removeColumn(desc) {
        if (this.addedColumns.includes(desc)) {
            this.addedColumns.splice(this.addedColumns.indexOf(desc), 1);
        }
    }

    /**
     * sets added scores to selected scores
     */
    addScore() {
        this.selectedScores.map(d => d.value).forEach((score) => {
            if (!this.addedColumns.includes(score)) {
                this.addedColumns.push(score);
            }
        });
        this.selectedScores.clear();
    }

    toggleDesciptionColumn() {
        if (this.addedColumns.includes('description')) {
            this.removeColumn('description');
        } else {
            this.addedColumns.push('description');
        }
    }

    /**
     * add selected scores using enter key
     * @param {event} event
     */
    handleEnterAdd(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.addScore();
        }
    }

    render() {
        // column definitions for LineUp
        const columnDefs = [
            { datatype: 'string', column: 'name', label: 'Name' },
            { datatype: 'string', column: 'description', label: 'Description' },
            {
                datatype: 'categorical',
                column: 'datatype',
                label: 'Datatype',
                categories: ['STRING', 'NUMBER', 'ORDINAL', 'BINARY'],
            },
            {
                datatype: 'categorical',
                column: 'source',
                label: 'Source',
                categories: this.props.availableCategories.map(d => d.name).concat('Derived'),
            },
            {
                datatype: 'number', column: 'range', label: 'Range (Max - Min)', domain: [],
            },
            {
                datatype: 'number', column: 'numcat', label: 'Categories', domain: [],
            },
            {
                datatype: 'number', column: 'na', label: 'N/A Values', domain: [],
            },
            {
                datatype: 'categorical', column: 'inTable', label: 'Current Variable', categories: ['Yes', 'No'],
            },
        ].concat(this.scores.map(d => ({
            datatype: 'number', column: d.column, label: d.label, domain: d.domain,
        })));
        // visible columns and column order for lineUp
        const visibleColumns = ['name', 'datatype', 'source', 'range', 'numcat', 'na', 'inTable'];
        const popoverRight = (
            <Popover id="popover-positioned-right" title="Variable Explorer">
                {'With the Variable explorer all variables of a data set can be explored and ranked. Gene variables can be added on demand. Add score columns to rank the variables by different measures of variability. Select variables in the exploration and click \'Add Selected\' to add them to the current set of displayed variables.'}
            </Popover>
        );
        return (
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.props.close}
                dialogClassName="fullSizeModal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {'Variable Explorer '}
                        <OverlayTrigger trigger={['hover', 'focus']} placement="right" overlay={popoverRight}>
                            <Label bsStyle="info">i</Label>
                        </OverlayTrigger>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Grid fluid>
                        <Row>
                            <Form horizontal>
                                <FormGroup>
                                    {this.props.rootStore.hasProfileData
                                        ? ([
                                            <Col sm={3} key="geneAdd">
                                                <ControlLabel>Add Gene Variable</ControlLabel>
                                            </Col>,
                                            <Col sm={3} style={{ paddingLeft: 0 }} key="datatypeAdd">
                                                <ControlLabel>Select Data Type</ControlLabel>
                                            </Col>,
                                        ])
                                        : null}
                                    <Col sm={6}>
                                        <ControlLabel>Add Score</ControlLabel>

                                    </Col>
                                </FormGroup>
                                <FormGroup>
                                    {this.props.rootStore.hasProfileData
                                        ? (
                                            <Col sm={6}>
                                                <MutationSelector
                                                    addGeneVariables={this.addGeneVariables}
                                                    noPadding
                                                />
                                            </Col>
                                        ) : null}

                                    <Col sm={5} style={{ paddingRight: 0 }}>
                                        {this.getScoreSelector()}
                                    </Col>
                                    <Col sm={1} style={{ padding: 0 }}>
                                        <Button
                                            style={{ height: 38 }}
                                            onClick={this.addScore}
                                        >
                                            Add
                                        </Button>
                                    </Col>
                                </FormGroup>
                                <FormGroup>
                                    <Col sm={6} smOffset={this.props.rootStore.hasProfileData ? 6 : 0}>
                                        <Checkbox onChange={this.toggleDesciptionColumn}
                                                  checked={this.addedColumns.includes('description')}>
                                            Show variable description column
                                        </Checkbox>
                                    </Col>
                                </FormGroup>
                            </Form>
                        </Row>
                        <Row>
                            <LineUpView
                                data={this.data.slice()}
                                selected={this.selected.slice()}
                                handleSelect={this.handleSelect}
                                addedColumns={this.addedColumns.slice()}
                                removeColumn={this.removeColumn}
                                columnDefs={columnDefs}
                                visibleColumns={visibleColumns}
                            />
                        </Row>
                    </Grid>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.close}>Cancel</Button>
                    <Button onClick={this.handleAdd}>Add Selected</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}));
VariableExplorer.propTypes = {
    close: PropTypes.func.isRequired,
    modalIsOpen: PropTypes.bool.isRequired,
    availableCategories: PropTypes.arrayOf(PropTypes.object).isRequired,
};
export default VariableExplorer;
