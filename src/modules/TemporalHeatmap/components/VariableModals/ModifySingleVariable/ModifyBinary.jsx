import React from 'react';
import { inject, observer } from 'mobx-react';
import { Button, Checkbox, ControlLabel, FormControl, Modal } from 'react-bootstrap';
import uuidv4 from "uuid/v4"
import DerivedVariable from "../../../stores/DerivedVariable";
import DerivedMapperFunctions from "../../../UtilityClasses/DeriveMapperFunctions";
import BinaryTable from "../VariableTables/BinaryTable";

/**
 * Modification of a binary variable
 */
const ModifyBinary = inject("variableManagerStore", "rootStore")(observer(class ModifyBinary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.derivedVariable !== null ? props.derivedVariable.name : props.variable.name, // name of variable
      binaryColors: props.derivedVariable !== null ? props.derivedVariable.range : props.variable.range, // color range of variable
      invert: props.derivedVariable !== null, // invert binary categories
      applyToAll: false //apply modification to all variables of the same profile
    };
    this.toggleInvert = this.toggleInvert.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleApply = this.handleApply.bind(this);
    this.setColors = this.setColors.bind(this);

  }

  /**
   * handles the name change
   * @param {Object} event
   */
  handleNameChange(event) {
    this.setState({ name: event.target.value });
  }

  /**
   * handles pressing apply
   * Depending on the way the variable is modified a derived variable is created with different parameters.
   * If the only change is a change in color scale the no derived variable is created but only the range is modified
   */
  handleApply() {
    let returnVariable;
    //case: data has been inverted
    let profile;
    if (this.props.derivedVariable === null) {
      profile = this.props.variable.profile;
    }
    else {
      profile = this.props.derivedVariable.profile;
    }
    if (this.state.invert) {
      if (this.props.derivedVariable === null) {
        let newId = uuidv4();
        let modification = {
          type: "modifyCategorical",
          mapping: { true: false, false: true }
        };
        let name = this.state.name;
        if (this.state.name === this.props.variable.name && this.props.derivedVariable === null) {
          name = this.state.name + "_INVERTED";
        }
        const derivedProfile = {};
        returnVariable = new DerivedVariable(
          newId, name, "BINARY", this.props.variable.description, [this.props.variable.id],
          modification, this.state.binaryColors, [],
          DerivedMapperFunctions.getModificationMapper(modification, [this.props.variable.mapper]),
          derivedProfile, this.props.variable.type,
        );
        this.props.variableManagerStore.replaceDisplayedVariable(this.props.variable.id, returnVariable);
        if (this.state.applyToAll) {
          this.props.variableManagerStore.applyToEntireProfile(returnVariable, profile, "_INVERTED")
        }
      } else {
        this.props.variableManagerStore.changeVariableRange(this.props.derivedVariable.id, this.state.binaryColors, false);
      }
    }
    else {
      if (this.props.derivedVariable === null) {
        this.props.variableManagerStore.changeVariableRange(this.props.variable.id, this.state.binaryColors, this.state.applyToAll);
      }
      else {
        const oldId = this.props.derivedVariable !== null ? this.props.derivedVariable.id : this.props.variable.id;
        //case: inversion has been undone
        if (!this.state.invert && this.props.derivedVariable !== null) {
          this.props.variableManagerStore.replaceDisplayedVariable(oldId, this.props.variable);
        }
      }
    }
    this.props.closeModal();
  }

  /**
   * toggles if the variable is inverted
   */
  toggleInvert() {
    this.setState({ invert: !this.state.invert });
  }

  /**
   * sets the colors for true and false
   * @param {string[]} colors
   */
  setColors(colors) {
    this.setState({ binaryColors: colors });
  }

  /**
   * returns a checkbox if variable that will be modified is part of a molecular profile.
   * Checking the checkbox results in the modifcation being applied to all variables of that profile
   * @return {Checkbox|null}
   */
  getApplyToAll() {
    let checkbox = null;
    let profileIndex = this.props.rootStore.availableProfiles.map(d => d.molecularProfileId).indexOf(this.props.variable.profile);
    if (profileIndex !== -1 || this.props.variable.profile === "Binary") {
      checkbox =
        <Checkbox checked={this.state.applyToAll} value={this.state.applyToAll}
                  onChange={() => this.setState({ applyToAll: !this.state.applyToAll })}>{"Apply action to all variables of this type"}</Checkbox>
    }
    return checkbox;

  }


  render() {
    return (
      <Modal show={this.props.modalIsOpen}
             onHide={this.props.closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>Modify Binary Variable</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ minHeight: "400px" }}>
          <form>
            <ControlLabel>Variable name</ControlLabel>
            <FormControl
              type="text"
              value={this.state.name}
              onChange={this.handleNameChange}/>
          </form>
          <h5>Description</h5>
          <p>{this.props.variable.description}</p>
          <BinaryTable mapper={this.props.variable.mapper} binaryColors={this.state.binaryColors}
                       invert={this.state.invert} setColors={this.setColors}/>
          <Checkbox onChange={this.toggleInvert} checked={this.state.invert}>Invert</Checkbox>
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
    )
  }
}));
export default ModifyBinary;
