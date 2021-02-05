import React from 'react';
import { PropTypes } from 'prop-types';
import { inject, observer, PropTypes as MobxPropTypes, Provider } from 'mobx-react';
import { Button, Checkbox, ControlLabel, FormControl, FormGroup, Modal, Radio } from 'react-bootstrap';
import uuidv4 from 'uuid/v4';
import { extendObservable } from 'mobx';
import DerivedVariable from '../../../stores/DerivedVariable';
import DerivedMapperFunctions from '../../../../UtilityClasses/DeriveMapperFunctions';
import ColorScales from '../../../../UtilityClasses/ColorScales';
import CategoryStore from '../VariableTables/CategoryStore';
import CategoricalTable from '../VariableTables/CategoricalTable';
import BinaryTable from '../VariableTables/BinaryTable';

/**
 * Component for combining variables
 */
const BinaryCombine = inject('variableManagerStore')(observer(class BinaryCombine extends React.Component {
    constructor(props) {
        super(props);
        extendObservable(this, this.initializeObservable());
        this.categoryStore = this.createCategoryStore();
        this.setModification = this.setModification.bind(this);
        this.setBinaryColors = this.setBinaryColors.bind(this);
        this.handleApply = this.handleApply.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
    }

    /**
     * returns the component corresponding to the modificationType
     * @return {*[]}
     */
    getModificationPanel() {
        // depending on the datatype of the combined variable display
        // either the table for binary categories or the table showing categorical categories
        if (this.modification.datatype === 'BINARY') {
            return [<ControlLabel key="label">Result</ControlLabel>,
                <BinaryTable
                    key="table"
                    mapper={DerivedMapperFunctions.createBinaryCombinedMapper(this.props.variables
                        .map(d => d.mapper), this.modification)}
                    binaryColors={this.binaryColors}
                    invert={false}
                    setColors={this.setBinaryColors}
                />];
        }

        return [<ControlLabel key="label">Result</ControlLabel>,
            <Provider categoryStore={this.categoryStore} key="table"><CategoricalTable/></Provider>];
    }

    /**
     * creates current variable categories for a derived variable
     * @returns {Object[]}
     */
    getCurrentDataOfDerivedVariable() {
        const currentVarCategories = [];
        this.props.derivedVariable.domain.forEach((d) => {
            let categories = [];
            if (!this.props.derivedVariable.modification.mapping) {
                categories = [d];
            } else {
                Object.keys(this.props.derivedVariable.modification.mapping).forEach((key) => {
                    if (this.props.derivedVariable.modification.mapping[key] === d) {
                        categories.push(key);
                    }
                });
            }
            currentVarCategories.push({
                selected: false,
                name: d,
                categories,
            });
        });
        return currentVarCategories;
    }

    /**
     * sets the current modification type and corresponding currentVarCategories and colors
     * @param {Object} modification
     */
    setModification(modification) {
        this.modification = modification;
    }


    /**
     * sets colors for the combined variable
     * @param {string[]} colors
     */
    setBinaryColors(colors) {
        this.binaryColors = colors;
    }

    /**
     * handles the name change
     * @param {Object} event
     */
    handleNameChange(event) {
        this.name = event.target.value;
    }


    /**
     * gets the initial state
     * @return {{name: string, modification: {operator: string,
     * datatype: string}, variableRange: string[],
      * keep: boolean, isOrdinal: boolean, currentVarCategories: Object[]}}
     */
    initializeObservable() {
        let name; // name of combined variable
        let modification = { operator: 'or', datatype: 'BINARY' }; // way of modification
        let binaryColors = ColorScales.defaultBinaryRange;
        // if the variable is already combined base parameters on this variable
        if (this.props.derivedVariable !== null) {
            modification = this.props.derivedVariable.modification;
            name = this.props.derivedVariable.name;
            if (this.props.derivedVariable.modification.datatype !== 'STRING') {
                binaryColors = this.props.derivedVariable.range;
            }
        } else {
            name = `BINARY COMBINE: ${this.props.variables.map(d => d.name)}`;
        }
        return {
            name,
            modification,
            binaryColors,
            keep: true,
        };
    }


    /**
     * applies combination of variables
     */
    handleApply() {
        let datatype;
        let range;
        let
            description;
        this.modification.variableNames = this.props.variables.map(d => d.name);
        this.modification.type = 'binaryCombine';
        let mapper = DerivedMapperFunctions.createBinaryCombinedMapper(
            this.props.variables.map(d => d.mapper), this.modification,
        );
        if (this.modification.datatype === 'BINARY') {
            datatype = 'BINARY';
            range = this.binaryColors;
            description = `Binary combination of ${this.props.variables.map(d => d.name)}`;
            this.modification.mapping = false;
        } else {
            if (this.categoryStore.isOrdinal) {
                datatype = 'ORDINAL';
            } else {
                datatype = 'STRING';
            }
            description = `Binary combination of ${this.props.variables.map(d => d.name)}`;
            mapper = DerivedMapperFunctions.createModifyCategoriesMapper(
                mapper, this.categoryStore.categoryMapping,
            );
            this.modification.mapping = this.categoryStore.categoryMapping;
            range = this.categoryStore.currentCategories.map(d => d.color);
        }
        const newVariable = new DerivedVariable(uuidv4(), this.name, datatype, description, this.props.variables.map(d => d.id), this.modification, range, [], mapper, uuidv4(), 'combined');
        if (this.props.derivedVariable === null) {
            this.props.variableManagerStore.addVariableToBeDisplayed(newVariable, this.keep);
        } else if (this.props.variableManagerStore
            .variableChanged(this.props.derivedVariable.id, newVariable)) {
            this.props.variableManagerStore
                .replaceDisplayedVariable(this.props.derivedVariable.id, newVariable);
        } else {
            this.props.variableManagerStore
                .changeVariableRange(this.props.derivedVariable.id, newVariable.range, false);
            this.props.variableManagerStore
                .changeVariableName(this.props.derivedVariable.id, this.name);
        }
        if (!this.keep) {
            this.props.variables.forEach((d) => {
                this.props.variableManagerStore.removeVariable(d.id);
            });
        }
        this.props.closeModal();
    }

    /**
     * creates a store for creation of combined categories
     * @return {CategoryStore}
     */
    createCategoryStore() {
        let currentCategories;
        let isOrdinal;
        let allValues;
        let
            colorRange;
        if (this.props.derivedVariable === null || this.props.derivedVariable.modification.datatype !== 'STRING') {
            const mapper = DerivedMapperFunctions
                .createBinaryCombinedMapper(this.props.variables.map(d => d.mapper), {
                    operator: 'or',
                    datatype: 'STRING',
                    variableNames: this.props.variables.map(d => d.name),
                });
            currentCategories = Array.from(new Set(Object.values(mapper))).map(d => ({
                selected: false,
                name: d,
                categories: [d],
            }));
            isOrdinal = false;
            allValues = Object.values(mapper);
            colorRange = ColorScales.defaultCategoricalRange;
        } else if (this.props.derivedVariable !== null && this.props.derivedVariable.modification.datatype === 'STRING') {
            currentCategories = this.getCurrentDataOfDerivedVariable();
            isOrdinal = this.props.derivedVariable.datatype === 'ORDINAL';
            allValues = Object.values(this.props.derivedVariable.mapper);
            colorRange = this.props.derivedVariable.range;
        }
        return new CategoryStore(currentCategories, isOrdinal, allValues, colorRange);
    }

    render() {
        return (
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.props.closeModal}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Combine Variables</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ minHeight: '400px' }}>
                    <ControlLabel>Variable name</ControlLabel>
                    <FormControl
                        type="text"
                        value={this.name}
                        onChange={this.handleNameChange}
                    />
                    <FormGroup>
                        Select binary operator
                        <Radio
                            onChange={() => this.setModification({ operator: 'or', datatype: 'BINARY' })}
                            checked={this.modification.operator === 'or' && this.modification.datatype === 'BINARY'}
                            name="binaryCombine"
                        >
                            OR (binary)
                        </Radio>
                        <Radio
                            onChange={() => this.setModification({ operator: 'and', datatype: 'BINARY' })}
                            checked={this.modification.operator === 'and' && this.modification.datatype === 'BINARY'}
                            name="binaryCombine"
                        >
                            AND (binary)
                        </Radio>
                        <Radio
                            onChange={() => this.setModification({
                                operator: 'or',
                                datatype: 'STRING',
                            })}
                            checked={this.modification.operator === 'or' && this.modification.datatype === 'STRING'}
                            name="binaryCombine"
                        >
                            Create combined categories
                        </Radio>
                    </FormGroup>
                    {this.getModificationPanel()}
                </Modal.Body>
                <Modal.Footer>
                    <Checkbox
                        disabled={this.props.derivedVariable !== null}
                        onChange={() => {
                            this.keep = !this.keep;
                        }}
                        checked={!this.keep}
                    >
                        Discard original variables
                    </Checkbox>
                    <Button onClick={this.props.closeModal}>
                        Cancel
                    </Button>
                    <Button onClick={this.handleApply}>
                        Apply
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}));
BinaryCombine.propTypes = {
    variables: MobxPropTypes.observableArray.isRequired,
    derivedVariable: PropTypes.instanceOf(DerivedVariable),
    modalIsOpen: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
};
BinaryCombine.defaultProps = {
    derivedVariable: null,
};
export default BinaryCombine;
