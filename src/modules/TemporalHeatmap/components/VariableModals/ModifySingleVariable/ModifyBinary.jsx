import React from 'react';
import {observer} from 'mobx-react';
import {Button, Checkbox, ControlLabel, FormControl, Modal} from 'react-bootstrap';
import uuidv4 from "uuid/v4"
import DerivedVariable from "../../../DerivedVariable";
import DerivedMapperFunctions from "../../../DeriveMapperFunctions";
import ColorScales from "../../../ColorScales";
import BinaryTable from "../VariableTables/BinaryTable";


const ModifyBinary = observer(class ModifyBinary extends React.Component {

    constructor(props) {
        super(props);
        this.state =
            {
                name: props.derivedVariable !== null ? props.derivedVariable.name : props.variable.name,
                binaryColors: props.derivedVariable !== null ? props.derivedVariable.range : ColorScales.defaultBinaryRange,
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
        if (this.state.invert && this.props.derivedVariable === null) {
            let newId = uuidv4();
            let modification = {true: false, false: true};
            returnVariable = new DerivedVariable(newId, this.state.name, "BINARY", this.props.variable.description, [this.props.variable.id], {type:"invertBinary", mapping:modification}, this.state.binaryColors, [], DerivedMapperFunctions.getModificationMapper("modifyCategorical", modification.mapping, [this.props.variable.mapper]), this.props.variable.profile);
            if (this.state.name === this.props.variable.name && this.props.derivedVariable === null) {
                returnVariable.name = this.state.name + "_INVERTED";
            }
        }
        else {
            returnVariable = this.props.derivedVariable !== null ? this.props.derivedVariable : this.props.variable;
            returnVariable.range = this.state.binaryColors;

        }
        console.log(returnVariable);
        this.props.callback(returnVariable);
        this.props.closeModal();
    }


    static handleOverlayClick(event) {
        document.body.click();
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
});
export default ModifyBinary;
