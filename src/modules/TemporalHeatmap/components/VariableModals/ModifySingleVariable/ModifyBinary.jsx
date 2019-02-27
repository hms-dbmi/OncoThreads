import React from 'react';
import {inject, observer} from 'mobx-react';
import {Button, Checkbox, ControlLabel, FormControl, Modal} from 'react-bootstrap';
import uuidv4 from "uuid/v4"
import DerivedVariable from "../../../stores/DerivedVariable";
import DerivedMapperFunctions from "../../../UtilityClasses/DeriveMapperFunctions";
import BinaryTable from "../VariableTables/BinaryTable";


const ModifyBinary = inject("variableManagerStore")(observer(class ModifyBinary extends React.Component {

    constructor(props) {
        super(props);
        this.state =
            {
                name: props.derivedVariable !== null ? props.derivedVariable.name : props.variable.name,
                binaryColors: props.derivedVariable !== null ? props.derivedVariable.range : props.variable.range,
                invert: props.derivedVariable !== null
            };
        this.toggleInvert = this.toggleInvert.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleApply = this.handleApply.bind(this);
        this.setColors = this.setColors.bind(this);

    }

    /**
     * handles the name change
     * @param event
     */
    handleNameChange(event) {
        this.setState({name: event.target.value});
    }

    /**
     * handles pressing apply
     */
    handleApply() {
        let returnVariable;
        //case: data has been inverted
        if (this.state.invert && this.props.derivedVariable === null) {
            let newId = uuidv4();
            let modification = {
                    type: "modifyCategorical",
                    mapping: {true: false, false: true}
                };
            let name=this.state.name;
            if (this.state.name === this.props.variable.name && this.props.derivedVariable === null) {
                name = this.state.name + "_INVERTED";
            }
            returnVariable = new DerivedVariable(newId, name, "BINARY", this.props.variable.description, [this.props.variable.id], modification, this.state.binaryColors, [], DerivedMapperFunctions.getModificationMapper(modification, [this.props.variable.mapper]), this.props.variable.profile);
            this.props.variableManagerStore.replaceDisplayedVariable(this.props.variable.id, returnVariable);
        }
        else {
            const oldId = this.props.derivedVariable !== null ? this.props.derivedVariable.id : this.props.variable.id;
            //case: inversion has been undone
            if (!this.state.invert && this.props.derivedVariable !== null) {
                this.props.variableManagerStore.getById(this.props.variable.id).changeRange(this.state.binaryColors);
                this.props.variableManagerStore.replaceDisplayedVariable(oldId, this.props.variableManagerStore.getById(this.props.variable.id));
            }
            else {
                //case: only color changed
                this.props.variableManagerStore.getById(oldId).changeRange(this.state.binaryColors);
            }
        }
        this.props.closeModal();
    }

    toggleInvert() {
        this.setState({invert: !this.state.invert});
    }

    setColors(colors) {
        this.setState({binaryColors: colors});
    }


    render() {
        return (
            <Modal show={this.props.modalIsOpen}
                   onHide={this.props.closeModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Modify Binary Variable</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{minHeight: "400px"}}>
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
