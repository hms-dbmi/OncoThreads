import React from 'react';
import {observer} from 'mobx-react';
import {Button, Col, Label, Modal, OverlayTrigger, Row, Tooltip} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';

import Select from 'react-select';
import ModifyCategorical from "./ModifyCategorical";
import OriginalVariable from "../../OriginalVariable";


const AddVarModal = observer(class AddVarModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isChecked: [],
            modifyCategoricalIsOpen: false,
            currentVariable: '',
            mapper: {},
            callback: '',
            selectedVariables: []
        };
        this.combinedList = [];
        this.referencedVariables = [];
        this.derivedVariables = [];

        this.handleSelect = this.handleSelect.bind(this);
        this.handleCogWheelClick = this.handleCogWheelClick.bind(this);
        this.handleAddButton = this.handleAddButton.bind(this);
        this.closeCategoricalModal = this.closeCategoricalModal.bind(this);
        this.bin = this.bin.bind(this);
    }


    /**
     * creates a searchable list of clinical attributes
     * @returns {Array}
     */
    createOptions() {
        let options = [];
        const _self = this;
        this.combinedList.forEach(function (d) {
            const tooltip = <Tooltip id="tooltip">
                {d.description}
            </Tooltip>;
            let lb = (
                <OverlayTrigger placement="top" overlay={tooltip}>
                    <div className="wordBreak" style={{textAlign: "left"}} onClick={() => _self.handleSelect(d, true)}
                         key={d.id}>
                        {d.variable}
                    </div>
                </OverlayTrigger>);
            options.push({value: d.id, label: lb})
        });
        return options;
    }

    /**
     * opens the binning modal
     * 1. creates the original variable (without adding it in the variable store)
     * 2. creates a derived variable (without adding it in the variable store)
     * 3. adds the variables to the referenced variables and displayed variables arrays
     *    (the arrays will be added to the variable store later)
     * @param index
     */
    bin(index) {
        const _self = this;
        let variable = this.getOriginalVariable(index);
        let modifiedId=this.state.selectedVariables[index].id;
        this.props.openBinningModal(variable, "sample", newVariable => {
            _self.modifyVarList(index,newVariable);
            if (this.derivedVariables.map(d => d.id).includes(modifiedId)) {
                this.derivedVariables.splice(this.derivedVariables.map(d => d.id).indexOf(modifiedId), 1)
            }
            else {
                this.referencedVariables.push(variable);
            }
            this.derivedVariables.push(newVariable);
        });
    }

    /**
     * opens the modal to modify a categorical variable
     * 1. creates the original variable (without adding it in the variable store)
     * 2. creates a derived variable (without adding it in the variable store)
     * 3. adds the variables to the referenced variables and displayed variables arrays
     *    (the arrays will be added to the variable store later)
     * @param index
     */
    modifyCategorical(index) {
        let originalVariable = this.getOriginalVariable(index);
        const derivedVariable = this.getDerivedVariable(index);
        this.openCategoricalModal(originalVariable, derivedVariable, newVar => {
            this.modifyVarList(index,newVar);
            if (derivedVariable !== null) {
                this.derivedVariables.splice(this.derivedVariables.map(d => d.id).indexOf(derivedVariable.id), 1, newVar)
            }
            else {
                this.derivedVariables.push(newVar);
            }
            if (!this.referencedVariables.map(d => d.id).includes(originalVariable.id)) {
                this.referencedVariables.push(originalVariable);
            }
        });
    }

    /**
     * gets a variable. If already referenced, get the variable from the referenced variable, else create it
     * @returns {*}
     * @param index
     */
    getOriginalVariable(index) {
        const referencedIndex = this.referencedVariables.map(d => d.id).indexOf(this.state.selectedVariables[index].id);
        if (referencedIndex !== -1) {
            return this.referencedVariables[referencedIndex];
        }
        else {
            const originalEntry = this.combinedList.filter(d => d.id === this.state.selectedVariables[index].originalId)[0];
            return new OriginalVariable(originalEntry.id, originalEntry.variable, "STRING", originalEntry.description, [], [], this.props.store.rootStore.staticMappers[originalEntry.id]);
        }
    }

    /**
     * gets the derived variable at the index of the selected variables. returns null if it does not exist
     * @param index
     * @returns {*}
     */
    getDerivedVariable(index) {
        if (this.state.selectedVariables[index].modified) {
            if (this.derivedVariables.map(d => d.id).includes(this.state.selectedVariables[index].id)) {
                return this.derivedVariables.filter(d => d.id === this.state.selectedVariables[index].id)[0];
            }
            else {
                return this.store.getById(this.state.selectedVariables[index].id);
            }
        }
        else return null;
    }

    /**
     * modifies an entry of the current variable list and adds variables to arrays
     * @param index
     * @param newVariable
     */
    modifyVarList(index,newVariable) {
        let varList = this.state.selectedVariables;
        varList[index].modified = true;
        varList[index].datatype = newVariable.datatype;
        varList[index].name = newVariable.name;
        varList[index].description = newVariable.description;
        varList[index].id = newVariable.id;
        this.setState({selectedVariables: varList});
    }

    /**
     * opens the modal for modification of categorical variables
     * @param variable
     * @param derivedVariable
     * @param callback
     */
    openCategoricalModal(variable, derivedVariable, callback) {
        this.setState({
            modifyCategoricalIsOpen: true,
            derivedVariable: derivedVariable,
            currentVariable: variable,
            callback: callback
        });
    }

    /**
     * closes the categorical modal
     */
    closeCategoricalModal() {
        this.setState({modifyCategoricalIsOpen: false});

    }

    /**
     * adds/removes variable to/from selectedVariables list
     * @param variable
     * @param select
     */
    handleSelect(variable, select) {
        let selectedVariables = this.state.selectedVariables.slice();
        if (select) {
            if (!(selectedVariables.map(d => d.id).includes(variable.id))) {
                selectedVariables.push({
                    id: variable.id,
                    name: variable.variable,
                    datatype: variable.datatype,
                    description: variable.description,
                    modified: false,
                    originalId: variable.id
                });
            }
        }
        if (!select) {
            const index = selectedVariables.map(d => d.id).indexOf(variable.id);
            if (variable.modified) {
                let derivedIndex = this.derivedVariables.map(d => d.id).indexOf(variable.id);
                let referenceIndex = this.referencedVariables.map(d => d.id).indexOf(this.derivedVariables[derivedIndex].originalIds[0]);
                this.referencedVariables.splice(referenceIndex, 1);
                this.derivedVariables.splice(referenceIndex, 1);
            }
            selectedVariables.splice(index, 1);
        }
        this.setState({selectedVariables: selectedVariables});
    }

    /**
     * handles a cogwheelClick
     * @param index
     */
    handleCogWheelClick(index) {
        switch (this.state.selectedVariables[index].datatype) {
            case "NUMBER":
                //this.bin(index);
                break;
            default:
                this.modifyCategorical(index);
                break;
        }

    }

    /**
     * displays the currently selected variables
     * @returns {Array}
     */
    showSelected() {
        let checked = [];
        const _self = this;
        this.state.selectedVariables.forEach(function (d, i) {
            const tooltip = <Tooltip id="tooltip">
                {d.description}
            </Tooltip>;
            let label = null;
            if (d.modified) {
                label = <Label bsStyle="warning">
                    Modified
                </Label>
            }
            let datatypeLabel;
            switch (d.datatype) {
                case "STRING":
                    datatypeLabel = "C";
                    break;
                case "BINNED":
                    datatypeLabel = "O";
                    break;
                case "BINARY":
                    datatypeLabel = "B";
                    break;
                default:
                    datatypeLabel = "N";
            }
            checked.push(
                <Row key={d.originalId}>
                    <OverlayTrigger placement="top" overlay={tooltip}>
                        <Col sm={7} md={7}>
                            {d.name}
                        </Col>
                    </OverlayTrigger>

                    <Col sm={2} md={2}>
                        {label}
                    </Col>
                    <Col sm={1} md={1}>
                        {datatypeLabel}
                    </Col>
                    <Col sm={1} md={1}>
                        <FontAwesome onClick={() => _self.handleCogWheelClick(i)}
                                     name="cog"/>
                    </Col>
                    <Col sm={1} md={1}>
                        <FontAwesome onClick={() => _self.handleSelect(d, false)}
                                     name="times"/>
                    </Col>
                </Row>)

        });
        if (checked.length === 0) {
            checked = "-";
        }
        return checked;

    }

    /**
     * renders the select window
     * @returns {*}
     */
    renderList() {
        return (
            <div>
                <Row>
                    <Col sm={9}>
                        <h3>Features </h3>
                        <Select
                            type="text"
                            searchable={true}
                            componentClass="select" placeholder="Select..."
                            searchPlaceholder="Search variable"
                            options={this.createOptions()}
                        />
                        <h3>Currently selected</h3>
                        {this.showSelected()}
                    </Col>
                    <Col sm={3}>


                        <p> C: Categorical </p>

                        <p> O: Ordinal </p>

                        <p> N: Numerical </p>

                        <p> B: Binary </p>


                    </Col>
                </Row>
            </div>

        )
    }

    /**
     * handles clicking the add button
     */
    handleAddButton() {
        const _self = this;
        this.state.selectedVariables.forEach(function (d) {
            if (!d.modified) {
                let variable = new OriginalVariable(d.id, d.name, d.datatype, d.description, [], [], _self.props.store.rootStore.staticMappers[d.id]);
                _self.props.store.addVariableToBeReferenced(variable);
                _self.props.store.addVariableToBeDisplayed(variable);
            }
        });
        this.referencedVariables.forEach(d => this.props.store.addVariableToBeReferenced(d));
        this.derivedVariables.forEach(d => this.props.store.addVariableToBeDisplayed(d));
        this.props.closeAddModal();
    }

    /**
     * creates the modal for categorical modification
     * @returns {*}
     */
    getCategoricalModal() {
        let modal = null;
        if (this.state.modifyCategoricalIsOpen) {
            modal = <ModifyCategorical modalIsOpen={this.state.modifyCategoricalIsOpen}
                                       variable={this.state.currentVariable}
                                       callback={this.state.callback}
                                       derivedVariable={this.state.derivedVariable}
                                       closeModal={this.closeCategoricalModal}/>
        }
        return (
            modal
        )
    }

    render() {
        this.combinedList = this.props.varList.concat({
            variable: "Mutation Count",
            id: this.props.store.rootStore.mutationCountId,
            datatype: "NUMBER",
            description: "Sum of all mutations"
        });
        return (
            <Modal backdrop={"static"}
                   show={this.props.addModalIsOpen}
                   onHide={this.props.closeAddModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Variables</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{minHeight: "400px"}}>
                    {this.renderList()}
                    {this.getCategoricalModal()}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.closeAddModal}>
                        Close
                    </Button>
                    <Button disabled={true}>
                        Combine
                    </Button>
                    <Button onClick={this.handleAddButton}>
                        Add
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
});
export default AddVarModal;