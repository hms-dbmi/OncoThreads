import React from 'react';
import {observer} from 'mobx-react';
import {ControlLabel, Form, FormControl, FormGroup, Label, OverlayTrigger, Table, Tooltip} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import ModifyCategorical from "./ModifyCategorical";
import OriginalVariable from "../../OriginalVariable";
import ModifyContinuous from "./ModifyContinuous";
import VariableSelector from "./VariableSelector";
import ReducedVariableStore from "./ReducedVariableStore";
import UndoRedoStore from "../../UndoRedoStore";


const AddTimepointVarTab = observer(class AddVarModal extends React.Component {

    constructor(props) {
        super(props);
        this.reducedVariableStore = new ReducedVariableStore(UndoRedoStore.serializeVariables(props.referencedVariables), props.currentVariables.slice());
        this.state = {
            modifyCategoricalIsOpen: false,
            modifyContinuousIsOpen: false,
            currentVariable: '',
            derivedVariable: '',
            callback: ''
        };
        this.allVariables = [];
        this.variableOptions = props.store.rootStore.availableProfiles;

        this.handleVariableSelect = this.handleVariableSelect.bind(this);
        this.handleGeneSelect = this.handleGeneSelect.bind(this);
        this.handleCogWheelClick = this.handleCogWheelClick.bind(this);
        this.closeCategoricalModal = this.closeCategoricalModal.bind(this);
        this.closeContinuousModal = this.closeContinuousModal.bind(this);
        this.changeRange = this.changeRange.bind(this);
        this.handleSort = this.handleSort.bind(this);
    }

    changeRange(range, id) {
        this.reducedVariableStore.getById(id).range = range;
    }

    modifyVariable(originalVariable, derivedVariable, isContinuous) {
        this.openModifyModal(originalVariable, derivedVariable, isContinuous, newVariable => {
            if (derivedVariable !== null) {
                this.reducedVariableStore.replaceDisplayedVariable(derivedVariable.id, newVariable);
            }
            else {
                this.reducedVariableStore.replaceDisplayedVariable(originalVariable.id, newVariable);
            }
            this.props.setTimepointData(this.reducedVariableStore.currentVariables, this.reducedVariableStore.referencedVariables);
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
    handleVariableSelect(variable, category, select) {
        if (select) {
            if (!(this.reducedVariableStore.currentVariables.includes(variable.id))) {
                this.reducedVariableStore.addVariableToBeDisplayed(new OriginalVariable(variable.id, variable.variable, variable.datatype, variable.description, [], [], this.props.store.rootStore.staticMappers[variable.id], category));
            }
        }
        if (!select) {
            this.reducedVariableStore.removeVariable(variable.id)
        }
        this.props.setTimepointData(this.reducedVariableStore.currentVariables, this.reducedVariableStore.referencedVariables);
    }

    /**
     * handles a cogwheelClick
     * @param id
     */
    handleCogWheelClick(id) {
        let variable = this.reducedVariableStore.getById(id);
        let originalVariable;
        let derivedVariable = null;
        if (variable.derived && variable.originalIds.length === 1) {
            originalVariable = this.reducedVariableStore.getById(variable.originalIds[0]);
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
    showSelected() {
        let elements = [];
        this.reducedVariableStore.currentVariables.forEach((d, i) => {
            let fullVariable=this.reducedVariableStore.getById(d.id);
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
                    Data modified
                </Label>
            }
            let backgroundColor = "white";
            if (d.isNew) {
                backgroundColor = "#e6f9ff"
            }
            elements.push(
                <tr key={d.id} style={{backgroundColor: backgroundColor}}>
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
                        {label}
                    </td>
                    <td>
                        {fullVariable.datatype}
                    </td>
                    <td>
                        <FontAwesome onClick={() => this.handleCogWheelClick(d.id)}
                                     name="cog"/>
                    </td>
                    <td>
                        <FontAwesome onClick={() => this.handleVariableSelect(fullVariable, "", false)}
                                     name="times"/>
                    </td>
                </tr>);
        });
        return <Table>
            <tr>
                <th>Position</th>
                <th colSpan={2}>Variable</th>
                <th>Datatype</th>
                <th colSpan={2}>Actions</th>
            </tr>
            {elements}</Table>;
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
                                       changeRange={this.props.changeRange}
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
                                      changeRange={this.props.changeRange}
                                      closeModal={this.closeContinuousModal}/>
        }
        return (
            modal
        )
    }


    handleGeneSelect(variable) {
        this.reducedVariableStore.addVariableToBeDisplayed(variable);
        console.log(variable);
        this.props.setTimepointData(this.reducedVariableStore.currentVariables, this.reducedVariableStore.referencedVariables);
    }

    handleSort(e) {
        if (e.target.value === "source") {
            this.reducedVariableStore.sortBySource(this.props.store.rootStore.availableProfiles.map(d => d.id));
        }
    }


    render() {
        return (
            <div>
                <h5>Select variable</h5>
                <VariableSelector {...this.props} handleVariableSelect={this.handleVariableSelect}
                                  handleGeneSelect={this.handleGeneSelect} variableOptions={this.variableOptions}
                                  changeRange={this.changeRange}/>
                <h5>Current Variables</h5>
                <Form inline>
                    <FormGroup>
                        <ControlLabel>Sort by</ControlLabel>
                        <FormControl style={{height: 38}} componentClass="select"
                                     onChange={this.handleSort}
                                     placeholder="Select Category">
                            <option value="source">add order</option>
                            <option value="source">data source</option>
                            <option value="alphabet">alphabet</option>
                            <option value="datatype">datatype</option>
                        </FormControl>
                    </FormGroup>
                </Form>
                {this.showSelected()}
                {this.getCategoricalModal()}
                {this.getContinuousModal()}
            </div>

        )
    }
});
export default AddTimepointVarTab;
