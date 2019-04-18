import React from 'react';
import {inject, observer} from 'mobx-react';
import {
    Button,
    ControlLabel,
    DropdownButton,
    Form,
    FormControl,
    FormGroup,
    Glyphicon,
    Label,
    MenuItem,
    OverlayTrigger,
    Table,
    Tooltip
} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import ModifyCategorical from "./ModifySingleVariable/ModifyCategorical";
import ModifyContinuous from "./ModifySingleVariable/ModifyContinuous";
import ModifyBinary from "./ModifySingleVariable/ModifyBinary";
import SaveVariableDialog from "../Modals/SaveVariableDialog";
import CombineModal from "./CombineVariables/CombineModal";

/**
 * Component for displaying and modifying current variables in a table
 */
const VariableTable = inject("variableManagerStore", "rootStore")(observer(class VariableTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            // controlling visibility of modals
            modifyCategoricalIsOpen: false,
            modifyContinuousIsOpen: false,
            modifyBinaryIsOpen: false,
            saveVariableIsOpen: false,
            currentVariable: '', // non-modified variable selected for modification
            derivedVariable: '', // modified variable selected for modification
            combineVariables: [], // variables selected for combination
            callback: '', // callback for saving a variable
        };
        this.handleCogWheelClick = this.handleCogWheelClick.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.combineSelected = this.combineSelected.bind(this);
    }


    /**
     * closes all modals
     */
    closeModal() {
        this.setState({
            modifyCategoricalIsOpen: false,
            modifyContinuousIsOpen: false,
            modifyBinaryIsOpen: false,
            saveVariableIsOpen: false,
            combineVariablesIsOpen: false
        });

    }

    /**
     * opens modal to modify variable
     * @param {OriginalVariable} originalVariable
     * @param {DerivedVariable} derivedVariable
     * @param {string} datatype
     */
    openModifyModal(originalVariable, derivedVariable, datatype) {
        this.setState({
            modifyContinuousIsOpen: datatype === "NUMBER",
            modifyCategoricalIsOpen: datatype === "STRING" || datatype === "ORDINAL",
            modifyBinaryIsOpen: datatype === "BINARY",
            derivedVariable: derivedVariable,
            currentVariable: originalVariable,
        });
    }

    /**
     * opens modal to combine variables
     * @param {OriginalVariable[]} variables
     * @param {DerivedVariable} derivedVariable
     */
    openCombineModal(variables, derivedVariable) {
        this.setState({
            combineVariables: variables,
            derivedVariable: derivedVariable,
            combineVariablesIsOpen: true,
        })
    }

    /**
     * opens modal to save variable
     * @param {DerivedVariable} variable
     * @param callback
     */
    openSaveVariableModal(variable, callback) {
        this.setState({
            currentVariable: variable,
            saveVariableIsOpen: true,
            callback: callback
        });
    }


    /**
     * handles a cogwheelClick
     * @param {event} event
     * @param {string} id
     */
    handleCogWheelClick(event, id) {
        let variable = this.props.variableManagerStore.getById(id);
        if (variable.originalIds.length === 1) {
            let originalVariable;
            let derivedVariable = null;
            if (variable.derived) {
                originalVariable = this.props.variableManagerStore.getById(variable.originalIds[0]);
                derivedVariable = variable;
            }
            else {
                originalVariable = variable;
            }
            this.openModifyModal(originalVariable, derivedVariable, originalVariable.datatype);
        }
        else {
            this.openCombineModal(variable.originalIds.map(d => this.props.variableManagerStore.getById(d)), variable);
        }
    }

    /**
     * removes a variable
     * @param {(OriginalVariable|DerivedVariable)} variable
     */
    removeVariable(variable) {
        if (variable.derived) {
            this.openSaveVariableModal(variable, save => {
                this.props.variableManagerStore.updateSavedVariables(variable.id, save);
                this.props.variableManagerStore.removeVariable(variable.id);
            });
        }
        else {
            this.props.variableManagerStore.removeVariable(variable.id);
        }
    }

    /**
     * displays the currently selected variables
     * @returns {Table}
     */
    showCurrentVariables() {
        let elements = [];
        this.props.variableManagerStore.currentVariables.forEach((d, i) => {
            let fullVariable = this.props.variableManagerStore.getById(d.id);
            const tooltip = <Tooltip id="tooltip">
                {fullVariable.description}
            </Tooltip>;
            let label = null;
            if (fullVariable.derived) {
                label = <Label bsStyle="info">
                    Modified
                </Label>
            }
            let newLabel = null;
            if (d.isNew) {
                newLabel = <Label bsStyle="info">New</Label>
            }
            let bgColor = null;
            if (d.isSelected) {
                bgColor = "lightgray"
            }
            elements.push(
                <tr key={d.id} style={{backgroundColor: bgColor}}
                    onClick={(e) => {
                        if (e.target.nodeName === "TD") {
                            this.props.variableManagerStore.toggleSelected(d.id)
                        }
                    }}>
                    <td>
                        {i}
                        <Button bsSize="xsmall" onClick={(e) => this.moveSingle(true, false, i)}><Glyphicon
                            glyph="chevron-up"/></Button>
                        <Button bsSize="xsmall" onClick={(e) => this.moveSingle(false, false, i)}><Glyphicon
                            glyph="chevron-down"/></Button>
                    </td>
                    <OverlayTrigger placement="top" overlay={tooltip}>
                        <td>
                            {fullVariable.name}
                        </td>
                    </OverlayTrigger>
                    <td>
                        {newLabel} {label}
                    </td>
                    <td>
                        {fullVariable.datatype}
                    </td>
                    <td>{!fullVariable.derived ? this.props.availableCategories.filter(d => d.id === fullVariable.profile)[0].name : "Derived"}</td>
                    <td>
                        <FontAwesome onClick={(e) => this.handleCogWheelClick(e, d.id)}
                                     name="cog"/>
                        {"\t"}
                        <FontAwesome onClick={() => {
                            this.removeVariable(fullVariable);
                        }} name="times"/>
                    </td>
                </tr>);
        });
        return <Table condensed hover>
            <thead>
            <tr>
                <th>Position</th>
                <th>Variable</th>
                <th/>
                <th>Datatype</th>
                <th>Source</th>
                <th>Actions</th>
            </tr>
            </thead>
            <tbody>
            {elements}</tbody>
        </Table>;
    }


    /**
     * creates the modal for modification
     * @returns {(ModifyBinary|ModifyContinuous|ModifyBinary|SaveVariableDialog|CombineModal)}
     */
    getModal() {
        let modal = null;
        if (this.state.modifyContinuousIsOpen) {
            modal = <ModifyContinuous modalIsOpen={this.state.modifyContinuousIsOpen}
                                      variable={this.state.currentVariable}
                                      derivedVariable={this.state.derivedVariable}
                                      setColorRange={this.setColorRange}
                                      closeModal={this.closeModal}/>
        }
        else if (this.state.modifyCategoricalIsOpen) {
            modal = <ModifyCategorical modalIsOpen={this.state.modifyCategoricalIsOpen}
                                       variable={this.state.currentVariable}
                                       derivedVariable={this.state.derivedVariable}
                                       closeModal={this.closeModal}/>
        }
        else if (this.state.modifyBinaryIsOpen) {
            modal = <ModifyBinary modalIsOpen={this.state.modifyBinaryIsOpen}
                                  variable={this.state.currentVariable}
                                  derivedVariable={this.state.derivedVariable}
                                  closeModal={this.closeModal}/>
        }
        else if (this.state.saveVariableIsOpen) {
            modal = <SaveVariableDialog modalIsOpen={this.state.saveVariableIsOpen}
                                        variable={this.state.currentVariable}
                                        callback={this.state.callback}
                                        closeModal={this.closeModal}/>
        }
        else if (this.state.combineVariablesIsOpen) {
            modal = <CombineModal modalIsOpen={this.state.combineVariablesIsOpen}
                                  variables={this.state.combineVariables}
                                  derivedVariable={this.state.derivedVariable}
                                  closeModal={this.closeModal}/>
        }
        return (
            modal
        )
    }


    /**
     * sorts current variables
     * @param {Object} e
     */
    handleSort(e) {
        if (e.target.value === "source") {
            this.props.variableManagerStore.sortBySource(this.props.availableCategories.map(d => d.id));
        }
        else if (e.target.value === "addOrder") {
            this.props.variableManagerStore.sortByAddOrder();
        }
        else if (e.target.value === "alphabet") {
            this.props.variableManagerStore.sortAlphabetically();
        }
        else {
            this.props.variableManagerStore.sortByDatatype();
        }
    }

    /**
     * Opens modal for combining selected variables
     */
    combineSelected() {
        let selectedVar = this.props.variableManagerStore.getSelectedVariables();
        let isBinary = true;
        if (selectedVar.length > 1) {
            for (let i = 1; i < selectedVar.length; i++) {
                if (selectedVar[i].datatype !== "BINARY") {
                    isBinary = false;
                    break;
                }
            }
            if (!isBinary) {
                alert("Please select two binary variables");
            }
            else {
                this.openCombineModal(this.props.variableManagerStore.getSelectedVariables(), null);
            }
        }
        else {
            alert("Please select at least two variables");
        }
    }

    /**
     * moves selected variables
     * @param {boolean} isUp
     * @param {boolean} toExtreme
     */
    moveSelected(isUp, toExtreme) {
        let indices = this.props.variableManagerStore.getSelectedIndices();
        this.props.variableManagerStore.move(isUp, toExtreme, indices);
    }

    /**
     * moves single variable
     * @param {boolean} isUp
     * @param {boolean} toExtreme
     * @param {number} index
     */
    moveSingle(isUp, toExtreme, index) {
        this.props.variableManagerStore.move(isUp, toExtreme, [index]);
    }

    /**
     * check if variable has changed
     * @param {(OriginalVariable|DerivedVariable)} oldVariable
     * @param {DerivedVariable} newVariable
     * @returns {boolean}
     */
    static variableChanged(oldVariable, newVariable) {
        //case: datatype changed?
        if (oldVariable.datatype !== newVariable.datatype) {
            return true;
        }
        else {
            //case: domain changed?
            if (!oldVariable.domain.every((d, i) => d === newVariable.domain[i])) {
                return true
            }
            else if (!oldVariable.range.every((d, i) => d === newVariable.range[i])) {
                return true
            }
            //case: mapper changed?
            else {
                for (let sample in oldVariable.mapper) {
                    if (oldVariable.mapper[sample] !== newVariable.mapper[sample]) {
                        return true;
                    }
                }
            }
        }
    }


    render() {
        return (
            <div>
                <h4>Current Variables</h4>
                <Form inline>
                    <FormGroup>
                        <ControlLabel>Sort by</ControlLabel>
                        <FormControl componentClass="select"
                                     onChange={this.handleSort}
                                     placeholder="Select Category">
                            <option value="addOrder">add order</option>
                            <option value="source">data source</option>
                            <option value="alphabet">alphabet</option>
                            <option value="datatype">datatype</option>
                        </FormControl>
                        <DropdownButton
                            title={"Move selected..."}
                            id={"MoveSelected"}
                        >
                            <MenuItem onClick={() => this.moveSelected(true, false)} eventKey="1">Up</MenuItem>
                            <MenuItem onClick={() => this.moveSelected(false, false)} eventKey="2">Down</MenuItem>
                            <MenuItem divider/>
                            <MenuItem onClick={() => this.moveSelected(true, true)} eventKey="3">to top</MenuItem>
                            <MenuItem onClick={() => this.moveSelected(false, true)} eventKey="4">to bottom</MenuItem>
                        </DropdownButton>
                    </FormGroup>
                </Form>
                <div style={{maxHeight: 400, overflowY: "scroll"}}>
                    {this.showCurrentVariables()}
                </div>
                <Button onClick={this.combineSelected}>Combine Selected</Button>
                {this.getModal()}
            </div>

        )
    }
}));
export default VariableTable;
