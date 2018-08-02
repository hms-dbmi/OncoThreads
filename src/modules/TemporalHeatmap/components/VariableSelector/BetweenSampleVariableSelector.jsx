import React from "react";
import {observer} from "mobx-react";
import FontAwesome from 'react-fontawesome';
import {
    Alert,
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
    Radio
} from 'react-bootstrap';


/*
creates the selector for between variables (left side of main view, bottom)
 */
const BetweenSampleVariableSelector = observer(class BetweenSampleVariableSelector extends React.Component {
    constructor() {
        super();
        this.state = {
            addCombined: true,
            modalIsOpen: false,
            buttonClicked: "",
            selectedKey: "",
            name: "",
            defaultName: "",
            disabled: {},
            selectedValues: [],
            showUniqueNameAlert: false,
            showEmptySelectionAlert: false,
            eventIcon: "caret-down",
            timepointDistanceIcon: "caret-right"
        };
        this.toggleEventIcon = this.toggleEventIcon.bind(this);
        this.toggleTimepointDistanceIcon = this.toggleTimepointDistanceIcon.bind(this);
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.addTimeDistance = this.addTimeDistance.bind(this);
        this.handleCombineClick = this.handleCombineClick.bind(this);
    }

    handleCombineClick(addCombined) {
        this.setState({
            addCombined: addCombined
        })
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

    addEventVariable() {
        if (this.state.addCombined) {
            this.addORVariable();
        }
        else {
            this.addVariablesSeperate();
        }
        this.closeModal();
    }

    /**
     * adds a variable to the view
     */
    addORVariable() {
        this.setState({showUniqueNameAlert: false, showEmptySelectionAlert: false});
        let name = this.state.name;
        if (this.state.name === "") {
            name = this.state.defaultName;
        }
        if (this.props.currentVariables.map(function (d) {
            return d.variable
        }).includes(name)) {
            this.setState({showUniqueNameAlert: true});
        }
        else if (this.state.selectedValues.length === 0) {
            this.setState({showEmptySelectionAlert: true});
        }
        else {
            this.props.store.addORVariable(this.state.buttonClicked, this.state.selectedValues, this.state.selectedKey, name);
        }
    }

    addVariablesSeperate() {
        this.props.store.addVariablesSeperate(this.state.buttonClicked, this.state.selectedValues, this.state.selectedKey);
    }

    addTimeDistance(id) {
        this.props.store.addTimepointDistance(id)
    }

    /**
     * handles the click on one of the checkboxes
     * @param event
     * @param type
     * @param variable
     */
    handleCheckBoxClick(event, type, variable) {
        let selected = this.state.selectedValues.slice();
        if (event.target.checked) {
            selected.push(variable);
        }
        else {
            let index = selected.map(function (d) {
                return d.id
            }).indexOf(variable.id);
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
            selectedValues: selected,
            selectedKey: type,
            disabled: disabled,
            defaultName: this.createCompositeName(selected)
        });
    }

    createCompositeName(selectedValues) {
        let name = "";
        selectedValues.forEach(function (d, i) {
            if (i !== 0) {
                name += "/";
            }
            name += d.name;
        });
        return (name);
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
                    <Checkbox key={d.id} disabled={_self.state.disabled[key]}
                              onClick={(e) => _self.handleCheckBoxClick(e, key, d)}>{d.name}</Checkbox>)
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
                buttons.push(<Button style={{textAlign: "left"}} bsSize="xsmall" value={d}
                                     onClick={() => _self.openModal(d)}
                                     key={d}>{BetweenSampleVariableSelector.toTitleCase(d)} <FontAwesome
                    name="plus"/></Button>)
            }
        });
        return buttons;
    }

    createTimepointDistanceButton() {
        return (<Button style={{textAlign: "left"}} bsSize="xsmall"
                        onClick={() => this.addTimeDistance(this.props.store.rootStore.timeDistanceId)}
                        key={"timepointdistance"}>Time between timepoints</Button>)
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
        this.setState({
            modalIsOpen: false,
            buttonClicked: "",
            selectedKey: "",
            name: "",
            defaultName: "",
            disabled: {},
            selectedValues: [],
            showUniqueNameAlert: false,
            showEmptySelectionAlert: false,
        });
    }

    getUniqueNameAlert() {
        if (this.state.showUniqueNameAlert) {
            return (
                <Alert bsStyle="warning">
                    Please use a unique name for your variable
                </Alert>
            )
        }
        else {
            return null;
        }
    }

    getEmptySelectionAlert() {
        if (this.state.showEmptySelectionAlert) {
            return (
                <Alert bsStyle="warning">
                    Please select at least one transition variable
                </Alert>
            )
        }
        else {
            return null;
        }
    }

    static toggleIcon(icon) {
        if (icon === "caret-down") {
            return "caret-right"
        }
        else {
            return "caret-down"
        }
    }

    toggleEventIcon() {
        this.setState({eventIcon: BetweenSampleVariableSelector.toggleIcon(this.state.eventIcon)});
    }

    toggleTimepointDistanceIcon() {
        this.setState({timepointDistanceIcon: BetweenSampleVariableSelector.toggleIcon(this.state.timepointDistanceIcon)});
    }

    render() {
        let namefield = <Col sm={8}/>;
        if (this.state.addCombined) {
            namefield = [<Col componentClass={ControlLabel} key="text" sm={4}>
                New Variable name:
            </Col>,
                <Col key="input" sm={4}>
                    <FormControl
                        type="text" className="form-control" id="name"
                        placeholder={this.state.defaultName}
                        onChange={(e) => this.handleNameChange(e)}/>
                </Col>]
        }
        return (
            <div className="mt-2">
                <h4>Event variables</h4>
                <Panel defaultExpanded>
                    <Panel.Heading>
                        <Panel.Title toggle>
                            <div onClick={this.toggleEventIcon}> Events <FontAwesome name={this.state.eventIcon}/></div>
                        </Panel.Title>
                    </Panel.Heading>
                    <Panel.Collapse>
                        <Panel.Body>
                            <ButtonGroup vertical block>
                                {this.createBetweenVariablesList()}
                            </ButtonGroup>
                        </Panel.Body>
                    </Panel.Collapse>
                </Panel>
                <Panel>
                    <Panel.Heading>
                        <Panel.Title toggle>
                            <div onClick={this.toggleTimepointDistanceIcon}> Derived Variables <FontAwesome
                                name={this.state.timepointDistanceIcon}/></div>
                        </Panel.Title>
                    </Panel.Heading>
                    <Panel.Collapse>
                        <Panel.Body>
                            <ButtonGroup vertical block>
                                {this.createTimepointDistanceButton()}
                            </ButtonGroup>
                        </Panel.Body>
                    </Panel.Collapse>
                </Panel>
                <Modal
                    show={this.state.modalIsOpen}
                    onHide={this.closeModal}
                >
                    <Modal.Header>
                        <Modal.Title>
                            Add Event Variable
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <FormGroup>
                            {this.createCheckboxes(this.state.buttonClicked)}
                        </FormGroup>
                    </Modal.Body>
                    <Modal.Footer>
                        {this.getUniqueNameAlert()}
                        {this.getEmptySelectionAlert()}
                        <FormGroup>
                            <Radio name="radioGroup" inline checked={this.state.addCombined}
                                   onChange={() => this.handleCombineClick(true)}>
                                Combine
                            </Radio>{' '}
                            <Radio name="radioGroup" inline checked={!this.state.addCombined}
                                   onChange={() => this.handleCombineClick(false)}>
                                Add as separate rows
                            </Radio>{' '}
                        </FormGroup>
                        <Form horizontal>
                            <FormGroup>
                                {namefield}
                                <Col sm={4}>
                                    <Button onClick={() => this.addEventVariable()}>Add</Button>
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