import React from 'react';
import PropTypes from 'prop-types';
import { inject, observer } from 'mobx-react';
import {
    Button, Checkbox, ControlLabel, FormControl, Modal,
} from 'react-bootstrap';
import uuidv4 from 'uuid/v4';
import { extendObservable } from 'mobx';
import DerivedVariable from '../../../stores/DerivedVariable';
import DerivedMapperFunctions from '../../../UtilityClasses/DeriveMapperFunctions';
import BinaryTable from '../VariableTables/BinaryTable';
import OriginalVariable from '../../../stores/OriginalVariable';

/**
 * Modification of a binary variable
 */
const ModifyBinary = inject('variableManagerStore', 'rootStore')(observer(class ModifyBinary extends React.Component {
    constructor(props) {
        super(props);
        extendObservable(this, {
            name: props.derivedVariable !== null
                ? props.derivedVariable.name : props.variable.name, // name of variable
            binaryColors: props.derivedVariable !== null
                ? props.derivedVariable.range : props.variable.range, // color range of variable
            invert: props.derivedVariable !== null, // invert binary categories
            applyToAll: false, // apply modification to all variables of the same profile
        });
        this.toggleInvert = this.toggleInvert.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleApply = this.handleApply.bind(this);
        this.setColors = this.setColors.bind(this);
    }

    /**
     * returns a checkbox if variable that will be modified
     * is part of a molecular profile.
     * Checking the checkbox results in the modifcation
     * being applied to all variables of that profile
     * @return {Checkbox|null}
     */
    getApplyToAll() {
        let checkbox = null;
        const profileIndex = this.props.rootStore.availableProfiles
            .map(d => d.molecularProfileId).indexOf(this.props.variable.profile);
        if (profileIndex !== -1 || this.props.variable.profile === 'Binary') {
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
     * sets the colors for true and false
     * @param {string[]} colors
     */
    setColors(colors) {
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
     * toggles if the variable is inverted
     */
    toggleInvert() {
        this.invert = !this.invert;
    }


    /**
     * handles pressing apply
     * Depending on the way the variable is modified a derived
     * variable is created with different parameters.
     * If the only change is a change in color scale the no derived
     * variable is created but only the range is modified
     */
    handleApply() {
        let returnVariable;
        let profile;
        if (this.props.derivedVariable === null) {
            profile = this.props.variable.profile;
        } else {
            profile = this.props.derivedVariable.profile;
        }
        // case: data has been inverted
        if (this.invert) {
            if (this.props.derivedVariable === null) {
                const newId = uuidv4();
                const modification = {
                    type: 'modifyCategorical',
                    mapping: { true: false, false: true },
                };
                let name = this.name;
                if (this.name === this.props.variable.name && this.props.derivedVariable === null) {
                    name = `${this.name}_INVERTED`;
                }
                const derivedProfile = {};
                returnVariable = new DerivedVariable(
                    newId, name, 'BINARY', this.props.variable.description, [this.props.variable.id],
                    modification, this.binaryColors, [],
                    DerivedMapperFunctions.getModificationMapper(modification,
                        [this.props.variable.mapper]),
                    derivedProfile, this.props.variable.type,
                );
                this.props.variableManagerStore
                    .replaceDisplayedVariable(this.props.variable.id, returnVariable);
                if (this.applyToAll) {
                    this.props.variableManagerStore
                        .applyToEntireProfile(returnVariable, profile, '_INVERTED');
                }
            } else {
                this.props.variableManagerStore
                    .changeVariableRange(this.props.derivedVariable.id, this.binaryColors, false);
                this.props.variableManagerStore
                    .changeVariableName(this.props.derivedVariable.id, this.name);
            }
        } else if (this.props.derivedVariable === null) {
            this.props.variableManagerStore
                .changeVariableRange(this.props.variable.id, this.binaryColors, this.applyToAll);
            this.props.variableManagerStore
                .changeVariableName(this.props.variable.id, this.name);
        } else {
            const oldId = this.props.derivedVariable !== null
                ? this.props.derivedVariable.id : this.props.variable.id;
            // case: inversion has been undone
            if (!this.invert && this.props.derivedVariable !== null) {
                this.props.variableManagerStore
                    .replaceDisplayedVariable(oldId, this.props.variable);
            }
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
                    <Modal.Title>Modify Binary Variable</Modal.Title>
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
                    <BinaryTable
                        mapper={this.props.variable.mapper}
                        binaryColors={this.binaryColors}
                        invert={this.invert}
                        setColors={this.setColors}
                    />
                    <Checkbox onChange={this.toggleInvert} checked={this.invert}>Invert</Checkbox>
                </Modal.Body>
                <Modal.Footer>
                    {this.getApplyToAll()}
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
ModifyBinary.propTypes = {
    variable: PropTypes.instanceOf(OriginalVariable),
    derivedVariable: PropTypes.oneOfType([PropTypes.instanceOf(DerivedVariable), null]),
    modalIsOpen: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
};
export default ModifyBinary;
