import React from "react";
import {observer} from "mobx-react";
import FontAwesome from 'react-fontawesome';
import {
    Button,
    ButtonGroup,
    Checkbox,
    Col,
    ControlLabel,
    Form,
    FormControl,
    FormGroup,
    Modal,
    Panel,
    Alert
} from 'react-bootstrap';


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
            defaultName:"",
            disabled: {},
            selectedValues: [],
            defaultValue: "",
            showAlert:false
        };
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }

    openModal(buttonClicked) {
        let disabled = {};
        Object.keys(this.props.eventAttributes[buttonClicked]).forEach(function (d) {
            disabled[d] = false;
        });
        this.setState({
            buttonClicked: buttonClicked,
            selectedKey: "",
            selectedValues: [],
            modalIsOpen: true,
            disabled: disabled
        });
    }

    /**
     * adds a variable to the view
     */
    addVariable() {
        let name = this.state.name;
        if (this.state.name === "") {
            name = this.state.defaultName;
        }
        if(this.props.currentVariables.map(function(d){return d.variable}).includes(name)){
            this.setState({showAlert:true});
        }
        else {
            if (this.props.currentVariables.length === 0) {
                this.props.store.initialize(name);
            }
            this.props.store.addVariable(this.state.buttonClicked, this.state.selectedValues, this.state.selectedKey, name);
            this.closeModal();
        }
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
        let disabled = Object.assign({}, this.state.disabled);
        if (selected.length > 0) {
            for (let k in disabled) {
                if (k !== type) {
                    disabled[k] = true;
                }
            }
        }
        else {
            for (let k in disabled) {
                disabled[k] = false;
            }
        }
        this.setState({
            defaultValue: value,
            selectedValues: selected,
            selectedKey: type,
            disabled: disabled,
            defaultName:this.createCompositeName(selected)
        });
    }
    createCompositeName(selectedValues){
        let name="";
        selectedValues.forEach(function (d,i) {
            if(i!==0){
                name+="/";
            }
            name+=d;
        });
        return(name);
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
            let checkboxes = [];
            attributes[key].forEach(function (d) {
                checkboxes.push(
                    <Checkbox key={d} disabled={_self.state.disabled[key]}
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
                buttons.push(<Button value={d} onClick={() => _self.openModal(d)}
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
    getAlert(){
        if(this.state.showAlert){
            return(
                <Alert bsStyle="warning">
                    Please use a unique name for your variable
                </Alert>
            )
        }
        else{
            return null;
        }
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
                        {this.getAlert()}
                        <Form horizontal>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={4}>
                                    New Variable name:
                                </Col>
                                <Col sm={5}>
                                    <FormControl
                                        type="text" className="form-control" id="name"
                                        placeholder={this.state.defaultName}
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