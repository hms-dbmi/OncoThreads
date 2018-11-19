import React from "react";
import {observer} from "mobx-react";
import FontAwesome from 'react-fontawesome';
import uuidv4 from 'uuid/v4';

import {
    Alert,
    Button,
    ButtonGroup,
    ButtonToolbar,
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
import OriginalVariable from "../../OriginalVariable";
import EventVariable from "../../EventVariable";
import DerivedVariable from "../../DerivedVariable";
import MapperCombine from "../../MapperCombineFunctions";


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
            orOperator: true,
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


    /**
     * opens the binning modal
     * @param id
     * @param name
     * @param description
     */
    bin(id, name, description) {
        let variable = new OriginalVariable(id, name, "NUMBER", description, [], [], this.props.store.rootStore.staticMappers[id]);
        this.props.store.addVariableToBeReferenced(variable);
        this.props.openBinningModal(variable, "between", newVariable => this.props.store.addVariableToBeDisplayed(newVariable));
    }

    /**
     * handles click on combine radio button
     * @param addCombined
     */
    handleCombineClick(addCombined) {
        let disabled = Object.assign({}, this.state.disabled);
        if (!addCombined) {
            for (let checkbox in disabled) {
                disabled[checkbox] = false;
            }
            this.setState({
                disabled: disabled,
                addCombined: addCombined

            });
        }
        else {
            this.setState({
                buttonClicked: this.state.buttonClicked,
                selectedValues: [],
                selectedKey: '',
                addCombined: addCombined,
                defaultName: ""
            });
        }
    }

    handleOperatorSelection(orOperator) {
        this.setState({
            orOperator: orOperator,
            defaultName: this.createCompositeName(this.state.selectedValues, orOperator)
        });
    }

    /**
     * opens modal corresponding to the clicked button
     * @param buttonClicked
     */
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
     * calls functions to add a variable
     */
    addEventVariable() {
        if (this.state.selectedValues.length > 0) {
            if (this.state.addCombined && this.state.selectedValues.length > 1) {
                let name = this.state.name;
                if (this.state.name === "") {
                    name = this.state.defaultName;
                }
                if (this.props.currentVariables.map(function (d) {
                    return d.name
                }).includes(name)) {
                    this.setState({showUniqueNameAlert: true});
                }
                else {
                    this.addCombinedVariable(name);
                }
            }
            else {
                this.addVariablesSeperate();
            }
        }
        else {
            this.setState({showEmptySelectionAlert: true});
        }
    }


    /**
     * adds a variable to the view
     */
    addCombinedVariable(name) {
        this.setState({showUniqueNameAlert: false, showEmptySelectionAlert: false});
        const operator=this.state.orOperator ? "or" : "and";
        let originalVariables = this.state.selectedValues.map(d => new EventVariable(d.id, d.name, this.state.buttonClicked, d.eventType, [], this.props.store.rootStore.getSampleEventMapping(this.state.buttonClicked, d)));
        originalVariables.forEach(d => this.props.store.addVariableToBeReferenced(d));
        this.props.store.addVariableToBeDisplayed(new DerivedVariable(uuidv4(), name, "BINARY", "Binary combination of variables: " + this.state.defaultName, this.state.selectedValues.map(d => d.id), "binaryCombine", operator, [], [], MapperCombine.createBinaryCombinedMapper(originalVariables.map(d => d.mapper), operator)));
        this.closeModal();
    }

    /**
     * adds variables as separate rows
     */
    addVariablesSeperate() {
        this.state.selectedValues.forEach(d => this.props.store.addVariableToBeDisplayed(new EventVariable(d.id, d.name, this.state.buttonClicked, d.eventType, [], this.props.store.rootStore.getSampleEventMapping(this.state.buttonClicked, d))));
        this.closeModal();
    }

    /**
     * adds the time distance variable
     * @param id
     */
    addTimeDistance(id) {
        this.props.store.addVariableToBeDisplayed(new OriginalVariable(id, "Timepoint Distance", "NUMBER", "Time between timepoints", [], [], this.props.store.rootStore.staticMappers["timeGapMapping"]));
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
            this.setState({showEmptySelectionAlert: false});
        }
        else {
            let index = selected.map(function (d) {
                return d.id
            }).indexOf(variable.id);
            selected.splice(index, 1);
        }
        let disabled = Object.assign({}, this.state.disabled);
        if (this.state.addCombined) {
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
        }
        this.setState({
            selectedValues: selected,
            selectedKey: type,
            disabled: disabled,
            defaultName: this.createCompositeName(selected, this.state.orOperator)
        });
    }

    /**
     * Selects all values of a profile
     * @param event
     * @param key
     */
    handleSelectAllInCatergory(event, key) {
        const attributes = this.props.eventAttributes[this.state.buttonClicked];
        let selected = this.state.selectedValues.slice();
        let disabled = Object.assign({}, this.state.disabled);

        if (event.target.checked) {
            for (let element in attributes) {
                if (element === key) {
                    attributes[key].forEach(function (d) {
                        if (!(selected.map(variable => variable.id).includes(d.id))) {
                            selected.push(d)
                        }
                    })
                }
            }
        }
        else {
            for (let element in attributes) {
                if (element === key) {
                    attributes[key].forEach(function (d) {
                        let deleteIndex = selected.map(el => el.id).indexOf(d.id);
                        selected.splice(deleteIndex, 1);
                    })
                }
            }
        }
        if (this.state.addCombined) {
            if (selected.length > 0) {
                for (let k in disabled) {
                    if (k !== key) {
                        disabled[k] = true;
                    }
                }
            }
            else {
                for (let k in disabled) {
                    disabled[k] = false;
                }
            }
        }
        this.setState({
            selectedValues: selected,
            selectedKey: key,
            disabled: disabled,
            defaultName: this.createCompositeName(selected, this.state.orOperator)
        });
    }

    /**
     * selects all values
     * @param e
     */
    handleSelectAll(e) {
        const attributes = this.props.eventAttributes[this.state.buttonClicked];
        let selected = this.state.selectedValues.slice();
        if (e.target.checked) {
            for (let element in attributes) {
                for (let i = 0; i < attributes[element].length; i++) {
                    if (!(selected.map(variable => variable.id).includes(attributes[element][i].id))) {
                        selected.push(attributes[element][i])
                    }
                }
            }
        }
        else {
            selected = []
        }
        this.setState({
            selectedValues: selected,
        });
    }

    /**
     * Creates a name using the combined values
     * @param selectedValues
     * @returns {string}
     */
    createCompositeName(selectedValues, operator) {
        let name = "";
        let operatorSymbol = "-or-";
        if (!operator) {
            operatorSymbol = "-and-";
        }
        selectedValues.forEach(function (d, i) {
            if (i !== 0) {
                name += operatorSymbol;
            }
            name += d.name;
        });
        return (name);
    }

    /**
     * creates checkboxes for the different event types in modal window
     * @returns {Array}
     */
    createCheckboxes() {
        let elements = [];
        const _self = this;
        const attributes = this.props.eventAttributes[this.state.buttonClicked];
        if (!this.state.addCombined) {
            elements.push(<Checkbox key="selectAll"
                                    onChange={(e) => this.handleSelectAll(e)}>Select all</Checkbox>);
        }

        for (let key in attributes) {
            let checkboxes = [];
            let allSelected = true;
            attributes[key].forEach(function (d) {
                let isSelected = _self.state.selectedValues.map(variable => variable.id).includes(d.id);
                if (!isSelected) {
                    allSelected = false;
                }
                checkboxes.push(
                    <Checkbox key={d.id} disabled={_self.state.disabled[key]} checked={isSelected}
                              onChange={(e) => _self.handleCheckBoxClick(e, key, d)}>{d.name}</Checkbox>)
            });

            elements.push(<Panel key={key}>
                <Panel.Heading>
                    {key}
                    <Checkbox key="selectAllInCategory" disabled={_self.state.disabled[key]} checked={allSelected}
                              onChange={(e) => this.handleSelectAllInCatergory(e, key)}>Select all</Checkbox>
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
        return (<ButtonToolbar>
                <ButtonGroup bsSize="xsmall">
                    <Button>
                        <FontAwesome
                            onClick={() => this.bin(this.props.store.rootStore.timeDistanceId, "Timepoint Distance", "Time between timepoints")
                            } name="cog"/>
                    </Button>
                    <Button style={{textAlign: "left"}}
                            onClick={() => this.addTimeDistance(this.props.store.rootStore.timeDistanceId)}
                            key={this.props.store.rootStore.timeDistanceId}> Timepoint Distance
                    </Button>
                </ButtonGroup>
            </ButtonToolbar>
        );
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
                    Please select at least one variable
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
                            {this.createCheckboxes()}
                        </FormGroup>
                    </Modal.Body>
                    <Modal.Footer>
                        {this.getUniqueNameAlert()}
                        {this.getEmptySelectionAlert()}
                        <Form horizontal>
                            <FormGroup>
                                <Radio name="radioGroup" inline checked={this.state.addCombined}
                                       onChange={() => this.handleCombineClick(true)}>
                                    Add Combined
                                </Radio>{' '}
                                <Radio name="radioGroup" inline checked={!this.state.addCombined}
                                       onChange={() => this.handleCombineClick(false)}>
                                    Add as separate rows
                                </Radio>{' '}
                            </FormGroup>
                        </Form>
                        <Form horizontal style={{display: !this.state.addCombined ? "none" : ""}}>
                            <FormGroup>
                                <Radio name="radioGroup" inline checked={this.state.orOperator}
                                       onChange={() => this.handleOperatorSelection(true)}>
                                    OR operator
                                </Radio>{' '}
                                <Radio name="radioGroup" inline checked={!this.state.orOperator}
                                       onChange={() => this.handleOperatorSelection(false)}>
                                    AND operator
                                </Radio>{' '}
                            </FormGroup>
                        </Form>
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