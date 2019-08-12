import React from 'react';

import { inject, observer } from 'mobx-react';
import { Button, Grid, Modal, Row } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { extendObservable } from 'mobx';
import LineUpView from './LineUpView';
import OriginalVariable from '../../stores/OriginalVariable';
import MutationSelector from './MutationSelector';


/**
 * Modal for exploring variables with lineUp
 */
const VariableExplorer = inject('rootStore', 'variableManagerStore')(observer(class VariableExplorer extends React.Component {
    constructor(props) {
        super(props);
        extendObservable(this, {
            selected: [],
            modalIsOpen: false,
            onDemandVariables: [],
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
        this.handleAdd = this.handleAdd.bind(this);
        this.addGeneVariables = this.addGeneVariables.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
    }

    /**
     * gets all the variables that should displayed by default
     * in LineUp
     * @return {Buffer | * | T[] | string}
     */
    getInitialVariables() {
        return this.getCurrentVariables().concat(this.getClinicalVariables());
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


    render() {
        // column definitions for LineUp
        const columnDefs = [
            { datatype: 'string', column: 'name', label: 'Name' },
            { datatype: 'string', column: 'description', label: 'Description' },
            {
                datatype: 'categorical',
                column: 'source',
                label: 'Source',
                categories: this.props.availableCategories.map(d => d.name).concat('Derived'),
            },
            {
                datatype: 'categorical',
                column: 'datatype',
                label: 'Datatype',
                categories: ['STRING', 'NUMBER', 'ORDINAL', 'BINARY'],
            },
            {
                datatype: 'number', column: 'changeRate', label: 'ChangeRate', domain: [0, 1],
            },
            {
                datatype: 'number', column: 'modVRacross', label: 'ModVRacross', domain: [0, 1],
            },
            {
                datatype: 'number', column: 'ModVRtpAvg', label: 'ModVRtpAvg', domain: [0, 1],
            },
            {
                datatype: 'number', column: 'ModVRtpMax', label: 'ModVRtpMax', domain: [0, 1],
            },
            {
                datatype: 'number', column: 'ModVRtpMin', label: 'ModVRtpMin', domain: [0, 1],
            },
            {
                datatype: 'number', column: 'CoVAvgTimeLine', label: 'CoVAvgTimeLine', domain: [],
            },
            {
                datatype: 'number', column: 'AvgCoeffUnalikeability', label: 'AvgCoeffUnalikeability', domain: [0, 1],
            },
            {
                datatype: 'number', column: 'AvgCoVTimeLine', label: 'AvgCoVTimeLine', domain: [],
            },
            {
                datatype: 'number', column: 'AvgVarianceTimeLine', label: 'AvgVarianceTimeLine', domain: [],
            },
            {
                datatype: 'number', column: 'range', label: 'range', domain: [],
            },
            {
                datatype: 'number', column: 'numcat', label: 'numcat', domain: [],
            },
            {
                datatype: 'number', column: 'na', label: 'na', domain: [],
            },
            {
                datatype: 'categorical', column: 'inTable', label: 'inTable', categories: ['Yes', 'No'],
            },
        ];
        // visible columns and column order for lineUp
        const visibleColumns = ['name', 'source', 'datatype', 'changeRate', 'modVRacross', 'ModVRtpAvg',
            'ModVRtpMax', 'ModVRtpMin', 'CoVAvgTimeLine', 'AvgCoeffUnalikeability', 'AvgCoVTimeLine',
            'AvgVarianceTimeLine', 'range', 'numcat', 'na', 'inTable'];
        return (
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.props.close}
                dialogClassName="fullSizeModal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Variable Explorer: LineUp</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Grid fluid>
                        <Row>
                            <MutationSelector addGeneVariables={this.addGeneVariables}/>
                        </Row>
                        <Row>
                            <LineUpView
                                data={this.data.slice()}
                                selected={this.selected.slice()}
                                handleSelect={this.handleSelect}
                                availableCategories={this.props.availableCategories}
                                columnDefs={columnDefs}
                                visibleColumns={visibleColumns}
                            />
                        </Row>
                    </Grid>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.close}>Close</Button>
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
