import React from 'react';
import {observer} from 'mobx-react';
import {Label, OverlayTrigger, Panel, Table, Tooltip} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import ModifyCategorical from "./ModifyCategorical";
import OriginalVariable from "../../OriginalVariable";
import ModifyContinuous from "./ModifyContinuous";
import VariableSelector from "./VariableSelector";


const AddTimepointVarTab = observer(class AddVarModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            modifyCategoricalIsOpen: false,
            modifyContinuousIsOpen: false,
            currentVariable: '',
            derivedVariable: '',
            callback: ''
        };
        this.variableOptions = this.getTimepointVariableOptions();

        this.handleVariableSelect = this.handleVariableSelect.bind(this);
        this.handleGeneSelect = this.handleGeneSelect.bind(this);
        this.handleCogWheelClick = this.handleCogWheelClick.bind(this);
        this.handleAddButton = this.handleAddButton.bind(this);
        this.closeCategoricalModal = this.closeCategoricalModal.bind(this);
        this.closeContinuousModal = this.closeContinuousModal.bind(this);
    }

    getTimepointVariableOptions() {
        let options = [{id: "clinSample", name: "Clinical Sample Data"}, {
            id: "clinPatient",
            name: "Clinical Patient Data"
        }];
        return options.concat(this.props.molecularProfiles.map(d => {
            return {id: d.molecularProfileId, name: d.name}
        }));
    }


    modifyVariable(index, isContinuous) {
        let originalVariables = this.props.originalVariables.slice();
        let modifiedVariables = this.props.modifiedVariables.slice();
        let originalVariable = this.getOriginalVariable(index);
        const derivedVariable = this.getDerivedVariable(index);
        this.openModifyModal(originalVariable, derivedVariable, isContinuous, newVariable => {
            this.modifyVarList(index, newVariable);
            if (derivedVariable !== null) {
                modifiedVariables.splice(this.props.modifiedVariables.map(d => d.id).indexOf(derivedVariable.id), 1, newVariable)
            }
            else {
                modifiedVariables.push(newVariable);
            }
            if (!originalVariables.map(d => d.id).includes(originalVariable.id)) {
                originalVariables.push(originalVariable);
            }
        });
        this.props.setTimepointData(this.props.selectedVariables, originalVariables, modifiedVariables)
    }

    /**
     * gets a variable. If already referenced, get the variable from the referenced variable, else create it
     * @returns {*}
     * @param index
     */
    getOriginalVariable(index) {
        if (this.props.originalVariables.map(d => d.id).includes(this.props.selectedVariables[index].originalId)) {
            return this.props.originalVariables.filter(d => d.id === this.props.selectedVariables[index].originalId)[0];
        }
        else {
            return this.store.getById(this.props.selectedVariables[index].id);
        }
    }

    /**
     * gets the derived variable at the index of the selected variables. returns null if it does not exist
     * @param index
     * @returns {*}
     */
    getDerivedVariable(index) {
        if (this.props.selectedVariables[index].modified) {
            if (this.props.modifiedVariables.map(d => d.id).includes(this.props.selectedVariables[index].id)) {
                return this.props.modifiedVariables.filter(d => d.id === this.props.selectedVariables[index].id)[0];
            }
            else {
                return this.store.getById(this.props.selectedVariables[index].id);
            }
        }
        else return null;
    }

    /**
     * modifies an entry of the current variable list and adds variables to arrays
     * @param index
     * @param newVariable
     */
    modifyVarList(index, newVariable) {
        let varList = this.props.selectedVariables;
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
     * opens the modal for modification of categorical variables
     * @param variable
     * @param derivedVariable
     * @param callback
     */
    openContinuousModal(variable, derivedVariable, callback) {
        this.setState({
            modifyContinuousIsOpen: true,
            derivedVariable: derivedVariable,
            currentVariable: variable,
            callback: callback
        });
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
        let selectedVariables = this.props.selectedVariables.slice();
        let originalVariables = this.props.originalVariables.slice();
        let modifiedVariables = this.props.modifiedVariables.slice();
        if (select) {
            if (!(selectedVariables.map(d => d.id).includes(variable.id))) {
                selectedVariables.push({
                    id: variable.id,
                    modified: false,
                    originalId: variable.id,
                    category: category
                });
            }
            originalVariables.push(new OriginalVariable(variable.id, variable.variable, variable.datatype, variable.description, [], [], this.props.store.rootStore.staticMappers[variable.id]))
        }
        if (!select) {
            const index = selectedVariables.map(d => d.id).indexOf(variable.id);
            if (variable.modified) {
                let derivedIndex = this.props.modifiedVariables.map(d => d.id).indexOf(variable.id);
                let referenceIndex = this.props.originalVariables.map(d => d.id).indexOf(this.props.modifiedVariables[derivedIndex].originalIds[0]);
                originalVariables.splice(referenceIndex, 1);
                modifiedVariables.splice(referenceIndex, 1);
            }
            else {
                originalVariables.splice(originalVariables.map(d => d.id).indexOf(variable.id), 1)
            }
            selectedVariables.splice(index, 1);
        }
        this.props.setTimepointData(selectedVariables, originalVariables, modifiedVariables);
    }

    /**
     * handles a cogwheelClick
     * @param id
     */
    handleCogWheelClick(id) {
        let originalDatatype;
        let index = this.props.selectedVariables.map(d => d.id).indexOf(id);
        if (this.props.store.isReferenced(this.props.selectedVariables[index].originalId)) {
            originalDatatype = this.props.store.getById(this.props.selectedVariables[index].originalId);
        }
        else {
            originalDatatype = this.props.originalVariables.filter(d => d.id === this.props.selectedVariables[index].originalId)[0].datatype
        }
        switch (originalDatatype) {
            case "NUMBER":
                this.modifyVariable(index, true);
                break;
            default:
                this.modifyVariable(index, false);
                break;
        }

    }

    /**
     * displays the currently selected variables
     * @returns {Array}
     */
    showSelected() {
        let elements = [];
        let panels = {};
        const _self = this;
        this.props.selectedVariables.forEach((d, i) => {
            if (!(d.category in panels)) {
                panels[d.category] = [];
            }
            panels[d.category].push(d);
        });
        this.variableOptions.forEach((d) => {
            let panelContent = [];
            if (d.id in panels) {
                panels[d.id].forEach((f) => {
                    let fullVariable = f.modified ? this.props.modifiedVariables.filter(g => g.id === f.id)[0] : this.props.originalVariables.filter(g => g.id === f.id)[0];
                    const tooltip = <Tooltip id="tooltip">
                        {fullVariable.description}
                    </Tooltip>;
                    let label = null;
                    if (f.modified) {
                        label = <Label bsStyle="warning">
                            Data modified
                        </Label>
                    }
                    panelContent.push(
                        <tr key={f.id}>
                            <OverlayTrigger placement="top" overlay={tooltip}>
                                <td>
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
                                <FontAwesome onClick={() => _self.handleCogWheelClick(f.id)}
                                             name="cog"/>
                            </td>
                            <td>
                                <FontAwesome onClick={() => _self.handleVariableSelect(f, "", false)}
                                             name="times"/>
                            </td>
                        </tr>)

                });
                elements.push(<Panel id={d.id} defaultExpanded>
                    <Panel.Heading>
                        <Panel.Title toggle>
                            {d.name}
                        </Panel.Title>
                    </Panel.Heading>
                    <Panel.Collapse>
                        <Panel.Body style={{padding: 0}}>
                            <Table style={{margin: 0}} hover>{panelContent}</Table>
                        </Panel.Body>
                    </Panel.Collapse>
                </Panel>);
            }
        });
        return elements;
    }


    /**
     * handles clicking the add button
     */
    handleAddButton() {
        const _self = this;
        this.props.selectedVariables.forEach(d => {
            if (!d.modified) {
                _self.props.store.addVariableToBeDisplayed(this.props.originalVariables.filter(f => f.id === d.id)[0]);
            }
            else {
                _self.props.store.addVariableToBeReferenced(this.props.originalVariables.filter(f => f.id === d.originalId)[0]);
            }
        });
        this.props.modifiedVariables.forEach(d => this.props.store.addVariableToBeDisplayed(d));
        this.props.closeAddModal();
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


    handleGeneSelect(variable, category) {
        let selectedVariables = this.props.selectedVariables.slice();
        selectedVariables.push({
            id: variable.id,
            modified: false,
            originalId: variable.id,
            category: category
        });

        this.props.setTimepointData(selectedVariables, this.props.originalVariables.slice().concat(variable), this.props.modifiedVariables);
    }


    render() {
        return (
            <div>
                <h5>Select variable</h5>
                <VariableSelector {...this.props} handleVariableSelect={this.handleVariableSelect}
                                  handleGeneSelect={this.handleGeneSelect} variableOptions={this.variableOptions}/>
                <h5>Variables to add</h5>
                {this.showSelected()}
                {this.getCategoricalModal()}
                {this.getContinuousModal()}
            </div>

        )
    }
});
/*
<Col sm={3}>
                        <p> C: Categorical </p>
                        <p> O: Ordinal </p>
                        <p> N: Numerical </p>
                        <p> B: Binary </p>
                    </Col>
 */
export default AddTimepointVarTab;
