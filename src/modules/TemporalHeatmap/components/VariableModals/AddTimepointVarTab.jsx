import React from 'react';
import {observer} from 'mobx-react';
import {toJS} from "mobx"
import {
    Button,
    ControlLabel,
    Form,
    FormControl,
    FormGroup,
    Label,
    OverlayTrigger,
    Table,
    Tooltip
} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import ModifyCategorical from "./ModifyCategorical";
import OriginalVariable from "../../OriginalVariable";
import ModifyContinuous from "./ModifyContinuous";
import VariableSelector from "./VariableSelector";
import VariableManagerStore from "./VariableManagerStore";
import UndoRedoStore from "../../UndoRedoStore";


const AddTimepointVarTab = observer(class AddVarModal extends React.Component {

    constructor(props) {
        super(props);
        this.variableManagerStore = new VariableManagerStore(UndoRedoStore.serializeVariables(props.referencedVariables), props.currentVariables.slice());
        this.state = {
            modifyCategoricalIsOpen: false,
            modifyContinuousIsOpen: false,
            currentVariable: '',
            derivedVariable: '',
            callback: ''
        };
        this.variableOptions = props.store.rootStore.availableProfiles;
        this.addOrder = props.currentVariables.slice();

        this.handleVariableAddRemove = this.handleVariableAddRemove.bind(this);
        this.handleGeneSelect = this.handleGeneSelect.bind(this);
        this.handleCogWheelClick = this.handleCogWheelClick.bind(this);
        this.closeCategoricalModal = this.closeCategoricalModal.bind(this);
        this.closeContinuousModal = this.closeContinuousModal.bind(this);
        this.changeRange = this.changeRange.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.combineSelected=this.combineSelected.bind(this);
    }

    changeRange(range, id) {
        this.variableManagerStore.referencedVariables[id].range = range;
        this.props.setTimepointData(this.variableManagerStore.currentVariables,this.variableManagerStore.referencedVariables)
    }

    modifyVariable(originalVariable, derivedVariable, isContinuous) {
        this.openModifyModal(originalVariable, derivedVariable, isContinuous, newVariable => {
            if (derivedVariable !== null) {
                this.variableManagerStore.replaceDisplayedVariable(derivedVariable.id, newVariable);
            }
            else {
                this.variableManagerStore.replaceDisplayedVariable(originalVariable.id, newVariable);
            }
            this.props.setTimepointData(toJS(this.variableManagerStore.currentVariables), this.variableManagerStore.referencedVariables);
        });

    }


    /**
     * closes the categorical modal
     */
    closeCategoricalModal() {
        this.setState({modifyCategoricalIsOpen: false});

    }

    openModifyModal(variable, derivedVariable, isContinuous, callback) {
        this.setState({
            modifyContinuousIsOpen: isContinuous,
            modifyCategoricalIsOpen: !isContinuous,
            derivedVariable: derivedVariable,
            currentVariable: variable,
            callback: callback
        });
    }

    /**
     * closes the categorical modal
     */
    closeContinuousModal() {
        this.setState({modifyContinuousIsOpen: false});

    }

    /**
     * adds/removes variable to/from selectedVariables list
     * @param variable
     * @param category
     * @param select
     */
    handleVariableAddRemove(variable, category, select) {
        if (select) {
            if (!(this.variableManagerStore.currentVariables.includes(variable.id))) {
                this.variableManagerStore.addVariableToBeDisplayed(new OriginalVariable(variable.id, variable.variable, variable.datatype, variable.description, [], [], this.props.store.rootStore.staticMappers[variable.id], category));
                this.addOrder.push(variable.id);
            }
        }
        if (!select) {
            this.variableManagerStore.removeVariable(variable.id);
            this.addOrder.splice(this.addOrder.indexOf(variable.id), 1);
        }
        this.props.setTimepointData(toJS(this.variableManagerStore.currentVariables), this.variableManagerStore.referencedVariables);
    }

    /**
     * handles a cogwheelClick
     * @param id
     */
    handleCogWheelClick(event,id) {
        event.stopPropagation();
        let variable = this.variableManagerStore.getById(id);
        let originalVariable;
        let derivedVariable = null;
        if (variable.derived && variable.originalIds.length === 1) {
            originalVariable = this.variableManagerStore.getById(variable.originalIds[0]);
            derivedVariable = variable;
        }
        else {
            originalVariable = variable;
        }
        this.modifyVariable(originalVariable, derivedVariable, originalVariable.datatype === "NUMBER");
    }

    /**
     * displays the currently selected variables
     * @returns {Array}
     */
    showCurrentVariables() {
        let elements = [];
        this.variableManagerStore.currentVariables.forEach((d, i) => {
            let fullVariable = this.variableManagerStore.getById(d.id);
            const tooltip = <Tooltip id="tooltip">
                {fullVariable.description}
            </Tooltip>;
            let label = null;
            let typeIcon;
            if (fullVariable.profile === "clinPatient") {
                typeIcon = <FontAwesome name="user"/>
            }
            else {
                typeIcon = <FontAwesome name="flask"/>
            }
            if (d.isModified) {
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
                    onClick={() => this.variableManagerStore.toggleSelected(d.id)}>
                    <td>
                        {i}
                    </td>
                    <OverlayTrigger placement="top" overlay={tooltip}>
                        <td>
                            {typeIcon}
                            {fullVariable.name}
                        </td>
                    </OverlayTrigger>
                    <td>
                        {newLabel} {label}
                    </td>
                    <td>
                        {fullVariable.datatype}
                    </td>
                    <td>
                        <FontAwesome onClick={(e) => this.handleCogWheelClick(e,d.id)}
                                     name="cog"/>
                        {"\t"}
                        <FontAwesome onClick={(e) => {
                            e.stopPropagation();
                            this.handleVariableAddRemove(fullVariable, "", false)
                        }} name="times"/>
                    </td>
                </tr>);
        });
        return <Table condensed hover className="fixed_header">
            <thead>
            <tr>
                <th>Position</th>
                <th>Variable</th>
                <th/>
                <th>Datatype</th>
                <th>Actions</th>
            </tr>
            </thead>
            <tbody>
            {elements}</tbody>
        </Table>;
    }


    /**
     * creates the modal for categoxrical modification
     * @returns {*}
     */
    getCategoricalModal() {
        let modal = null;
        if (this.state.modifyCategoricalIsOpen) {
            modal = <ModifyCategorical modalIsOpen={this.state.modifyCategoricalIsOpen}
                                       variable={this.state.currentVariable}
                                       callback={this.state.callback}
                                       derivedVariable={this.state.derivedVariable}
                                       changeRange={this.changeRange}
                                       closeModal={this.closeCategoricalModal}/>
        }
        return (
            modal
        )
    }

    /**
     * creates the modal for continuous modification
     * @returns {*}
     */
    getContinuousModal() {
        let modal = null;
        if (this.state.modifyContinuousIsOpen) {
            modal = <ModifyContinuous modalIsOpen={this.state.modifyContinuousIsOpen}
                                      variable={this.state.currentVariable}
                                      callback={this.state.callback}
                                      derivedVariable={this.state.derivedVariable}
                                      changeRange={this.changeRange}
                                      availableProfiles={this.variableOptions}
                                      closeModal={this.closeContinuousModal}/>
        }
        return (
            modal
        )
    }


    handleGeneSelect(variable) {
        this.variableManagerStore.addVariableToBeDisplayed(variable);
        this.addOrder.push(variable.id);
        this.props.setTimepointData(toJS(this.variableManagerStore.currentVariables), this.variableManagerStore.referencedVariables);
    }

    handleSort(e) {
        if (e.target.value === "source") {
            this.variableManagerStore.sortBySource(this.props.store.rootStore.availableProfiles.map(d => d.id));
        }
        else if (e.target.value === "addOrder") {
            this.variableManagerStore.sortByAddOrder(this.addOrder);
        }
        else if (e.target.value === "alphabet") {
            this.variableManagerStore.sortAlphabetically();
        }
        else {
            this.variableManagerStore.sortByDatatype();
        }
        this.props.setTimepointData(this.variableManagerStore.currentVariables, this.variableManagerStore.referencedVariables);
    }

    combineSelected() {
        let selectedVar = this.variableManagerStore.getSelectedVariables();
        let isOfOneDatatype = true;
        if (selectedVar.length > 1) {
            let datatype = selectedVar[0].datatype;
            for (let i = 1; i < selectedVar.length; i++) {
                if ((selectedVar[i].datatype !== "NUMBER" && datatype === "NUMBER") ||
                    (selectedVar[i].datatype === "NUMBER" && datatype !== "NUMBER")) {
                    isOfOneDatatype = false;
                    break;
                }
            }
            if (!isOfOneDatatype) {
                alert("Cannot combine numerical with non-numerical variables");
            }
            else{

            }
        }
        else{
            alert("Please select at least two variables");
        }
    }


    render() {
        return (
            <div>
                <h4>Select variable</h4>
                <VariableSelector {...this.props} handleVariableAddRemove={this.handleVariableAddRemove}
                                  handleGeneSelect={this.handleGeneSelect} variableOptions={this.variableOptions}/>
                <h4>Current Variables</h4>
                <Form inline>
                    <FormGroup>
                        <ControlLabel>Sort by</ControlLabel>
                        <FormControl style={{height: 38}} componentClass="select"
                                     onChange={this.handleSort}
                                     placeholder="Select Category">
                            <option value="addOrder">add order</option>
                            <option value="source">data source</option>
                            <option value="alphabet">alphabet</option>
                            <option value="datatype">datatype</option>
                        </FormControl>
                    </FormGroup>
                </Form>
                {this.showCurrentVariables()}
                <Button onClick={this.combineSelected}>Combine Selected</Button>
                {this.getCategoricalModal()}
                {this.getContinuousModal()}
            </div>

        )
    }
});
export default AddTimepointVarTab;
