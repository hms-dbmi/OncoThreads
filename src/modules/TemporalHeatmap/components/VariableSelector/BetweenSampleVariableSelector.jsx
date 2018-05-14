import React from "react";
import {observer} from "mobx-react";
import FontAwesome from 'react-fontawesome';
import {Panel,Button, ButtonGroup, Checkbox, Col, ControlLabel, Form, FormControl, FormGroup, Modal} from 'react-bootstrap';


/*
creates the selector for between variables (left side of main view, bottom)
 */
const BetweenSampleVariableSelector = observer(class BetweenSampleVariableSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            modalIsOpen: false,
            buttonClicked: "",
            selectedKey: "",
            name: "",
            selectedValues: [],
            defaultValue: ""
        };
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }

    openModal(event) {
        this.setState({modalIsOpen: true, buttonClicked: event.target.value, selectedKey: "", selectedValues: []});
    }

    /**
     * adds a variable to the view
     */
    addVariable() {
        if (this.props.currentVariables.length === 0) {
            this.props.store.initialize(this.state.name);
        }
        this.props.store.addVariable(this.state.buttonClicked, this.state.selectedValues, this.state.selectedKey, this.state.name);
        this.closeModal();
    }

    /**
     * handles the click on one of the checkboxes
     * @param event
     * @param type
     * @param value
     */
    handleCheckBoxClick(event, type, value) {
        let selected = this.state.selectedValues.slice();
        if (event.target.checked) {
            selected.push(value);
        }
        else {
            let index = selected.indexOf(value);
            selected.splice(index, 1);
        }
        this.setState({
            defaultValue: value,
            selectedValues: selected,
            selectedKey: type
        });
    }

    /**
     * creates checkboxes for the different event types in modal window
     * @param event
     * @returns {Array}
     */
    createCheckboxes(event) {
        let elements = [];
        const _self = this;
        const attributes = this.props.eventAttributes[event];
        for (let key in attributes) {
            let checkboxes=[];
            attributes[key].forEach(function (d) {
                checkboxes.push(
                    <Checkbox key={d}
                              onClick={(e) => _self.handleCheckBoxClick(e, key, d)}>{d}</Checkbox>)
            });
            elements.push(<Panel key={key}>
                <Panel.Heading>
                    {key}
                </Panel.Heading>
                <Panel.Body>
                    {checkboxes}
                </Panel.Body>
            </Panel>)
        }
        return elements;
    }

    static toTitleCase(str) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    /**
     * creates the buttons for the variables for the betweenTimepoints
     * @returns {Array}
     */
    createBetweenVariablesList() {
        let buttons = [];
        const _self = this;
        this.props.eventCategories.forEach(function (d) {
            if (d !== "SPECIMEN") {
                buttons.push(<Button value={d} onClick={_self.openModal}
                                     key={d}>{BetweenSampleVariableSelector.toTitleCase(d)} <FontAwesome
                    name="plus"/></Button>)
            }
        });
        return buttons;
    }

    /**
     * updates state when the name of the textfield is changed
     * @param event
     */
    handleNameChange(event) {
        this.setState({
            name: event.target.value
        })
    }

    closeModal() {
        this.setState({modalIsOpen: false, buttonClicked: "", selectedValues: [], selectedKey: "", name: ""});
    }


    render() {
        return (
            <div className="mt-2">
                <h4>Transition variables</h4>
                <ButtonGroup vertical block>
                    {this.createBetweenVariablesList()}
                </ButtonGroup>
                <Modal
                    show={this.state.modalIsOpen}
                    onHide={this.closeModal}
                >
                    <Modal.Header>
                        <Modal.Title>
                            Add Transition Variable
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <FormGroup>
                            {this.createCheckboxes(this.state.buttonClicked)}
                        </FormGroup>
                    </Modal.Body>
                    <Modal.Footer>
                        <Form horizontal>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={4}>
                                    New Variable name:
                                </Col>
                                <Col sm={5}>
                                    <FormControl
                                        type="text" className="form-control" id="name"
                                        onChange={(e) => this.handleNameChange(e)}/></Col>
                                <Col sm={3}>
                                    <Button onClick={() => this.addVariable()}>Add</Button>
                                    <Button onClick={this.closeModal}>Close</Button>
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
});
export default BetweenSampleVariableSelector;