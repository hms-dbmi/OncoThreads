import React from 'react';

import { inject, observer } from 'mobx-react';
import { Button, Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { extendObservable } from 'mobx';
import LineUpView from './LineUpView';
import OriginalVariable from '../../stores/OriginalVariable';


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
        } else {
            newEntry.range = NaN;
            newEntry.numcat = variable.domain.length;
            newEntry.categories = variable.domain.toString();
        }
        if (variable.profile === 'clinSample') {
            newEntry.score = this.props.rootStore.scoreStore.scoreStructure[variable.id];
        }
        newEntry.na = [].concat(...Object.values(this.props.rootStore.sampleStructure))
            .map(d => variable.mapper[d])
            .filter(d => d === undefined).length;
        newEntry.changeRate = this.props.rootStore.scoreStore
            .getChangeRate(variable.mapper, variable.datatype);
        newEntry.inTable = this.props.variableManagerStore.isInTable(variable.id) ? 'Yes' : 'No';
        newEntry.modVRacross = NaN;
        newEntry.AvgModVRtp = NaN; //average modVR from modVR of all timepoints
        newEntry.MaxModVRtp = NaN; //max of all timepoints
        newEntry.MinModVRtp = NaN; //min of all timepoints
        newEntry.AvgCoeffUnalikeability = NaN;

        newEntry.AvgCoVTimeLine = NaN;

        if (variable.datatype !== 'NUMBER') { //treat string, binary the same way for now
            newEntry.modVRacross = this.props.rootStore.scoreStore
                .getModVRAcross(variable.datatype, variable.mapper);
            const wt = this.props.rootStore.scoreStore
                .gerModVRWithin(variable.datatype, variable.mapper);

            let sum = 0; //sum of modVr of all timepoints

            const tp_length = this.props.rootStore.timepointStructure.length;
            wt.forEach((d, i) => {
                // newEntry['ModVRtp' + i]=d;
                sum += d;
            });
            newEntry.AvgModVRtp = sum / tp_length;
            newEntry.MaxModVRtp = Math.max(...wt);
            newEntry.MinModVRtp = Math.min(...wt);


            sum=0;

            const wtu = this.props.rootStore.scoreStore
            .getCoeffUnalikeability(variable.datatype, variable.mapper);

            //console.log(wtu);

            wtu.forEach((d, i) => {
                // newEntry['ModVRtp' + i]=d;
                sum += d;
            });

            newEntry.AvgCoeffUnalikeability = sum / tp_length;

            //console.log(newEntry.AvgCoeffUnalikeability);

        } else if (variable.datatype === 'NUMBER') {
            const covt = this.props.rootStore.scoreStore
                .getCoeffientOfVarTimeLine(variable.datatype, variable.mapper);
            let sum = 0;
            const tp_length = this.props.rootStore.timepointStructure.length;
            covt.forEach((d) => { sum += d; });
            newEntry.CoVAvgTimeLine = sum / tp_length;
            // variance
            const variance = this.props.rootStore.scoreStore
                .getVarianceTimeLine(variable.datatype, variable.mapper);
            sum = 0;
            variance.forEach((d) => { sum += d; });
            newEntry.AvgVarianceTimeLine = sum / tp_length;
        }
        return newEntry;
    }

    /**
     * handles adding the selected variables
     */
    handleAdd() {
        this.variables.forEach((variable, i) => {
            if (this.selected.includes(i)) {
                this.props.variableManagerStore.addVariableToBeDisplayed(variable);
            }
        });
        this.props.reset();
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
                    <LineUpView
                        data={this.data.slice()}
                        selected={this.selected.slice()}
                        handleSelect={this.handleSelect}
                        addGeneVariables={this.addGeneVariables}
                        availableCategories={this.props.availableCategories}
                    />
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
    reset: PropTypes.func.isRequired,
    modalIsOpen: PropTypes.bool.isRequired,
    availableCategories: PropTypes.arrayOf(PropTypes.object).isRequired,
};
export default VariableExplorer;
