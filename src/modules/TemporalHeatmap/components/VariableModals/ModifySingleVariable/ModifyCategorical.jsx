import React from 'react';
import { inject, observer, Provider } from 'mobx-react';
import {
    Button, Checkbox, ControlLabel, FormControl, FormGroup, Modal, Radio,
} from 'react-bootstrap';
import uuidv4 from 'uuid/v4';
import { extendObservable } from 'mobx';
import PropTypes from 'prop-types';
import DerivedVariable from '../../../stores/DerivedVariable';
import DerivedMapperFunctions from '../../../UtilityClasses/DeriveMapperFunctions';
import ColorScales from '../../../UtilityClasses/ColorScales';
import CategoricalTable from '../VariableTables/CategoricalTable';
import ConvertBinaryTable from '../VariableTables/ConvertBinaryTable';
import CategoryStore from '../VariableTables/CategoryStore';
import OriginalVariable from '../../../stores/OriginalVariable';

/**
 * Modification of a categorical variable
 */
const ModifyCategorical = inject('variableManagerStore', 'rootStore')(observer(class ModifyCategorical extends React.Component {
    constructor(props) {
        super(props);
        this.categoryStore = new CategoryStore(this.createCurrentCategoryData(),
            this.props.derivedVariable === null ? this.props.variable.datatype === 'ORDINAL' : this.props.derivedVariable.datatype === 'ORDINAL',
            Object.values(this.props.variable.mapper),
            this.props.derivedVariable === null
                ? this.props.variable.range : this.props.derivedVariable.range);
        extendObservable(this, this.initializeObservable());
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleApply = this.handleApply.bind(this);
        this.toggleConvertBinary = this.toggleConvertBinary.bind(this);
        this.setBinaryMapping = this.setBinaryMapping.bind(this);
        this.setBinaryColors = this.setBinaryColors.bind(this);
    }

    /**
     * gets the table showing modifications on the current categories or binary conversion
     * @return {ConvertBinaryTable|CategoricalTable} category table
     */
    getTable() {
        if (this.convertBinary) {
            return (
                <ConvertBinaryTable
                    variableDomain={this.props.variable.domain}
                    mapper={this.props.variable.mapper}
                    binaryColors={this.binaryColors}
                    binaryMapping={this.binaryMapping}
                    setBinaryMapping={this.setBinaryMapping}
                    setBinaryColors={this.setBinaryColors}
                />
            );
        }

        return (
            <Provider categoryStore={this.categoryStore}>
                <CategoricalTable />
            </Provider>
        );
    }


    /**
     * returns a checkbox if variable that will be modified is part of a molecular profile.
     * Checking the checkbox results in the modifcation
     * being applied to all variables of that profile
     * @return {Checkbox|null}
     */
    getApplyToAll() {
        let checkbox = null;
        const profileIndex = this.props.rootStore.availableProfiles
            .map(d => d.molecularProfileId).indexOf(this.props.variable.profile);
        if (this.props.variable.profile === 'Mutation type' || profileIndex !== -1) {
            checkbox = (
                <Checkbox
                    checked={this.applyToAll}
                    value={this.applyToAll}
                    onChange={() => {
                        this.applyToAll = !this.applyToAll;
                    }}
                >
                    {'Apply action to all variables of this type'}
                </Checkbox>
            );
        }
        return checkbox;
    }


    /**
     * gets the variable corresponding to the modifications that were made
     * @return {DerivedVariable}
     */
    getReturnVariable() {
        const newId = uuidv4();
        let name = this.name;
        let datatype = this.props.variable.datatype;
        let range = [];
        let domain = [];
        let modification;
        // case: no binary conversion
        if (!this.convertBinary) {
            // case: isOrdinal color scale
            if (this.categoryStore.isOrdinal) {
                datatype = 'ORDINAL';
                range = [this.categoryStore.colorScale(0), this.categoryStore.colorScale(1)];
            } else {
                datatype = 'STRING';
                range = this.categoryStore.currentCategories.map(d => d.color);
            }
            domain = this.categoryStore.currentCategories.map(d => d.name);
            modification = { type: 'categoricalTransform', mapping: this.categoryStore.categoryMapping };
            // case: binary conversion
        } else {
            datatype = 'BINARY';
            range = this.binaryColors;
            modification = { type: 'categoricalTransform', mapping: this.binaryMapping };
        }
        const derivedProfile = uuidv4();
        if (this.name === this.props.variable.name && this.props.derivedVariable === null) {
            name = this.name + this.getNameEnding();
        }
        return new DerivedVariable(newId, name, datatype, this.props.variable.description,
            [this.props.variable.id], modification, range, domain, DerivedMapperFunctions
                .getModificationMapper(modification, [this.props.variable.mapper]),
            derivedProfile, this.props.variable.type);
    }

    /**
     * gets name ending fitting the modified variable
     * @return {string}
     */
    getNameEnding() {
        if (this.convertBinary) {
            return '_BINARY';
        }

        return '_MODIFIED';
    }


    /**
     * sets binary mapping
     * @param {Object} mapping
     */
    setBinaryMapping(mapping) {
        this.binaryMapping = mapping;
    }

    /**
     * sets binary colors
     * @param {string[]} colors
     */
    setBinaryColors(colors) {
        this.binaryColors = colors;
    }

    /**
     * change between binary conversion and category customization
     */
    toggleConvertBinary() {
        this.convertBinary = !this.convertBinary;
    }

    /**
     * gets mapping of variable categories to binary categories.
     * If there already is a binary modification,
     * the mapping is created using the modification object of the derived variable
     * return {Object} binary mapping
     */
    createBinaryMapping() {
        let binaryMapping = {};
        if (this.props.derivedVariable !== null && this.props.derivedVariable.datatype === 'BINARY') {
            binaryMapping = this.props.derivedVariable.modification.mapping;
        } else {
            this.props.variable.domain.forEach((d) => {
                binaryMapping[d] = true;
            });
        }
        return binaryMapping;
    }

    /**
     * creates the initial list of current categories.
     * If the variable is already modified, the list of current categories
     * has to be created using the modifcation object to get information
     * on how the categories have already been modified
     * @returns {Object[]} current categories
     */
    createCurrentCategoryData() {
        const currentData = [];
        if (this.props.derivedVariable !== null && this.props.derivedVariable.datatype !== 'BINARY') {
            this.props.derivedVariable.domain.forEach((d) => {
                Object.keys(this.props.derivedVariable.modification.mapping).forEach((key) => {
                    if (this.props.derivedVariable.modification.mapping[key] === d) {
                        if (!(currentData.map(entry => entry.name).includes(d))) {
                            currentData.push({
                                selected: false,
                                name: d,
                                categories: [],
                            });
                        }
                        currentData[currentData.map(entry => entry.name)
                            .indexOf(d)].categories.push(key);
                    }
                });
            });
        } else {
            this.props.variable.domain.forEach((d) => {
                currentData.push({
                    selected: false,
                    name: d.toString(),
                    categories: [d.toString()],
                });
            });
        }
        return currentData;
    }

    /**
     * handles pressing apply
     * Depending on the way the variable is modified a
     * derived variable is created with different parameters.
     * If the only change is a change in color scale the
     * no derived variable is created but only the range is modified
     */
    handleApply() {
        const returnVariable = this.getReturnVariable();
        if (this.props.derivedVariable === null) {
            if (this.props.variableManagerStore
                .variableChanged(this.props.variable.id, returnVariable)) {
                this.props.variableManagerStore
                    .replaceDisplayedVariable(this.props.variable.id, returnVariable);
            } else {
                this.props.variableManagerStore
                    .changeVariableRange(this.props.variable.id, returnVariable.range, false);
                this.props.variableManagerStore
                    .changeVariableName(this.props.variable.id, this.name);
            }
        } else if (!this.props.variableManagerStore
            .variableChanged(this.props.variable.id, returnVariable)) {
            this.props.variableManagerStore
                .changeVariableRange(this.props.variable.id, returnVariable.range, false);
            this.props.variableManagerStore
                .replaceDisplayedVariable(this.props.derivedVariable.id, this.props.variable);
        } else if (this.props.variableManagerStore
            .variableChanged(this.props.derivedVariable.id, returnVariable)) {
            this.props.variableManagerStore
                .replaceDisplayedVariable(this.props.derivedVariable.id, returnVariable);
            if (this.applyToAll) {
                this.props.variableManagerStore.applyToEntireProfile(
                    returnVariable, this.props.derivedVariable.profile, this.getNameEnding(),
                );
            }
        } else {
            this.props.variableManagerStore.changeVariableRange(
                this.props.derivedVariable.id, returnVariable.range, this.applyToAll,
            );
            this.props.variableManagerStore
                .changeVariableName(this.props.derivedVariable.id, this.name);
        }
        this.props.closeModal();
    }

    /**
     * handles changing the name of the modified variable
     * @param {event} event
     */
    handleNameChange(event) {
        this.name = event.target.value;
    }

    /**
     * The initial state depends on if the input variable
     * is already modified (derivedVariable !== null)
     * @return {Object} - of modified variable.
     */
    initializeObservable() {
        if (this.props.derivedVariable === null) {
            return {
                convertBinary: false, // current datatype
                // mapping of categories to binary values for binary conversion
                binaryMapping: this.createBinaryMapping(),
                // colors of binary values for binary conversion
                binaryColors: ColorScales.defaultBinaryRange,
                name: this.props.variable.name, // name of modified variable
                applyToAll: false, // should modification be applied to entire profile
            };
        }

        return {
            convertBinary: this.props.derivedVariable.datatype === 'BINARY', // current datatype
            // mapping of categories to binary values for binary conversion
            binaryMapping: this.createBinaryMapping(),
            binaryColors: this.props.derivedVariable.datatype === 'BINARY' ? this.props.derivedVariable.range : ColorScales.defaultBinaryRange, // colors of binary values for binary conversion
            name: this.props.derivedVariable.name, // name of modified variable
            applyToAll: false, // should modification be applied to entire profile
        };
    }

    render() {
        return (
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.props.closeModal}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Modify Categorical Variable</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ minHeight: '400px' }}>
                    <form>
                        <ControlLabel>Variable name</ControlLabel>
                        <FormControl
                            type="text"
                            value={this.name}
                            onChange={this.handleNameChange}
                        />
                    </form>
                    <h5>Description</h5>
                    <p>{this.props.variable.description}</p>
                    <FormGroup>
                        <Radio
                            onChange={this.toggleConvertBinary}
                            name="radioGroup"
                            checked={!this.convertBinary}
                        >
                            Customize categories
                        </Radio>
                        {' '}
                        <Radio onChange={this.toggleConvertBinary} name="radioGroup" checked={this.convertBinary}>
                            Convert to binary
                        </Radio>
                        {' '}
                    </FormGroup>
                    {this.getTable()}
                </Modal.Body>
                <Modal.Footer>
                    {this.getApplyToAll()}
                    <Button onClick={this.props.closeModal}>
                        Cancel
                    </Button>
                    <Button
                        disabled={!this.convertBinary && !this.categoryStore.uniqueCategories}
                        onClick={this.handleApply}
                    >
                        Apply
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}));
ModifyCategorical.propTypes = {
    variable: PropTypes.instanceOf(OriginalVariable),
    derivedVariable: PropTypes.oneOf([PropTypes.instanceOf(DerivedVariable), null]),
    modalIsOpen: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
};
export default ModifyCategorical;
