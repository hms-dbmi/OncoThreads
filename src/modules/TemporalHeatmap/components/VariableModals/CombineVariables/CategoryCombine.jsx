import React from 'react';
import { inject, observer, PropTypes as MobxPropTypes, Provider } from 'mobx-react';
import { Button, Checkbox, ControlLabel, FormControl, Modal } from 'react-bootstrap';
import uuidv4 from 'uuid/v4';
import { extendObservable } from 'mobx';
import { PropTypes } from 'prop-types';
import DerivedVariable from '../../../stores/DerivedVariable';
import DerivedMapperFunctions from '../../../UtilityClasses/DeriveMapperFunctions';
import ColorScales from '../../../UtilityClasses/ColorScales';
import CategoryStore from '../VariableTables/CategoryStore';
import CategoricalTable from '../VariableTables/CategoricalTable';

/**
 * Component for combining variables
 */
const CategoryCombine = inject('variableManagerStore')(observer(class CategoryCombine extends React.Component {
    constructor(props) {
        super(props);
        extendObservable(this, this.initializeObservable());
        this.categoryStore = this.createCategoryStore();
        this.handleApply = this.handleApply.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
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
     * creates a store for creation of combined categories
     * @return {CategoryStore}
     */
    createCategoryStore() {
        let currentCategories;
        let isOrdinal;
        let allValues;
        let
            colorRange;
        if (this.props.derivedVariable === null) {
            const mapper = DerivedMapperFunctions
                .createCategoryCombinedMapper(this.props.variables.map(d => d.mapper));
            currentCategories = Array.from(new Set(Object.values(mapper))).map(d => ({
                selected: false,
                name: d,
                categories: [d],
            }));
            isOrdinal = false;
            allValues = Object.values(mapper);
            colorRange = ColorScales.defaultCategoricalRange;
        } else {
            currentCategories = this.getCurrentDataOfDerivedVariable();
            isOrdinal = this.props.derivedVariable.datatype === 'ORDINAL';
            allValues = Object.values(this.props.derivedVariable.mapper);
            colorRange = this.props.derivedVariable.range;
        }
        return new CategoryStore(currentCategories, isOrdinal, allValues, colorRange);
    }

    initializeObservable() {
        let name;
        let
            nameChanged; // name of combined variable
        // if the variable is already combined base parameters on this variable
        if (this.props.derivedVariable !== null) {
            name = this.props.derivedVariable.name;
            nameChanged = true;
        } else {
            name = `CATEGORY COMBINE: ${this.props.variables.map(d => d.name)}`;
            nameChanged = false; // has the name been changed
        }
        return {
            name,
            nameChanged,
            keep: true,
        };
    }


    /**
     * handles the name change
     * @param {Object} event
     */
    handleNameChange(event) {
        this.name = event.target.value;
        this.nameChanged = true;
    }


    /**
     * applies combination of variables
     */
    handleApply() {
        let datatype;
        let mapper = DerivedMapperFunctions
            .createCategoryCombinedMapper(this.props.variables.map(d => d.mapper));
        if (this.categoryStore.isOrdinal) {
            datatype = 'ORDINAL';
        } else {
            datatype = 'STRING';
        }
        const description = `Category combination of ${this.props.variables.map(d => d.name)}`;
        mapper = DerivedMapperFunctions
            .createModifyCategoriesMapper(mapper, this.categoryStore.categoryMapping);
        const newVariable = new DerivedVariable(
            uuidv4(), this.name, datatype, description, this.props.variables.map(d => d.id),
            { type: 'categoryCombine', mapping: this.categoryStore.categoryMapping },
            this.categoryStore.range, [], mapper, uuidv4(), 'combined',
        );
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
                    <ControlLabel key="label">Result</ControlLabel>
                    ,
                    {' '}
                    <Provider categoryStore={this.categoryStore} key="table"><CategoricalTable/></Provider>
                </Modal.Body>
                <Modal.Footer>
                    <Checkbox
                        disabled={this.props.derivedVariable !== null}
                        onChange={() => {
                            this.keep = !this.keep;
                        }}
                        checked={!this.keep}
                    >
                        Discard
                        original variables
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
CategoryCombine.propTypes = {
    variables: MobxPropTypes.observableArray.isRequired,
    derivedVariable: PropTypes.instanceOf(DerivedVariable),
    modalIsOpen: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
};
CategoryCombine.defaultProps = {
    derivedVariable: null,
};
export default CategoryCombine;
