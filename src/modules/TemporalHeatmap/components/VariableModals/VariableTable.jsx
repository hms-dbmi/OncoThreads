import React from 'react';
import {observer} from 'mobx-react';
import {toJS} from "mobx"
import {
    Button,
    ControlLabel, DropdownButton,
    Form,
    FormControl,
    FormGroup, Glyphicon,
    Label, MenuItem,
    OverlayTrigger,
    Table,
    Tooltip
} from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import ModifyCategorical from "./ModifyCategorical";
import ModifyContinuous from "./ModifyContinuous";
import ModifyBinary from "./ModifyBinary";

const VariableTable = observer(class VariableTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            modifyCategoricalIsOpen: false,
            modifyContinuousIsOpen: false,
            modifyBinaryIsOpen:false,
            currentVariable: '',
            derivedVariable: '',
            callback: ''
        };
        this.handleCogWheelClick = this.handleCogWheelClick.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.combineSelected = this.combineSelected.bind(this);
    }


    /**
     * opens modal to modify a variable or change an existing modification
     * @param originalVariable
     * @param derivedVariable
     * @param type
     */
    modifyVariable(originalVariable, derivedVariable, type) {
        this.openModifyModal(originalVariable, derivedVariable, type, newVariable => {
            if (derivedVariable !== null) {
                this.props.variableManagerStore.replaceDisplayedVariable(derivedVariable.id, newVariable);
            }
            else {
                this.props.variableManagerStore.replaceDisplayedVariable(originalVariable.id, newVariable);
            }
            this.props.setData(toJS(this.props.variableManagerStore.currentVariables), this.props.variableManagerStore.referencedVariables);
        });

    }


    /**
     * closes the categorical modal
     */
    closeModal() {
        this.setState({modifyCategoricalIsOpen: false, modifyContinuousIsOpen: false,modifyBinaryIsOpen:false});

    }

    /**
     * opens modal to modify variable
     * @param variable
     * @param derivedVariable
     * @param type
     * @param callback
     */
    openModifyModal(variable, derivedVariable, type, callback) {
        this.setState({
            modifyContinuousIsOpen: type==="NUMBER",
            modifyCategoricalIsOpen: type==="STRING"||type==="ORDINAL",
            modifyBinaryIsOpen: type==="BINARY",
            derivedVariable: derivedVariable,
            currentVariable: variable,
            callback: callback
        });
    }


    /**
     * handles a cogwheelClick
     * @param event
     * @param id
     */
    handleCogWheelClick(event, id) {
        let variable = this.props.variableManagerStore.getById(id);
        let originalVariable;
        let derivedVariable = null;
        if (variable.derived && variable.originalIds.length === 1) {
            originalVariable = this.props.variableManagerStore.getById(variable.originalIds[0]);
            derivedVariable = variable;
        }
        else {
            originalVariable = variable;
        }
        this.modifyVariable(originalVariable, derivedVariable, originalVariable.datatype);
    }

    /**
     * displays the currently selected variables
     * @returns {Array}
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
                        <Button bsSize="xsmall" onClick={(e) => this.moveSingle(true,false,i)}><Glyphicon
                        glyph="chevron-up"/></Button>
                    <Button bsSize="xsmall" onClick={(e) => this.moveSingle(false,false,i)}><Glyphicon
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
                    <td>{this.props.availableCategories[this.props.availableCategories.map(d => d.id).indexOf(fullVariable.profile)].name}</td>
                    <td>
                        <FontAwesome onClick={(e) => this.handleCogWheelClick(e, d.id)}
                                     name="cog"/>
                        {"\t"}
                        <FontAwesome onClick={() => {
                            this.props.removeVariable(d.id)
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
     * @returns {*}
     */
    getModal() {
        let modal = null;
        if (this.state.modifyContinuousIsOpen) {
            modal = <ModifyContinuous modalIsOpen={this.state.modifyContinuousIsOpen}
                                      variable={this.state.currentVariable}
                                      callback={this.state.callback}
                                      derivedVariable={this.state.derivedVariable}
                                      closeModal={this.closeModal}/>
        }
        else if (this.state.modifyCategoricalIsOpen) {
            modal = <ModifyCategorical modalIsOpen={this.state.modifyCategoricalIsOpen}
                                       variable={this.state.currentVariable}
                                       callback={this.state.callback}
                                       derivedVariable={this.state.derivedVariable}
                                       closeModal={this.closeModal}/>
        }
        else if(this.state.modifyBinaryIsOpen){
            modal=<ModifyBinary modalIsOpen={this.state.modifyBinaryIsOpen}
                                variable={this.state.currentVariable}
                                callback={this.state.callback}
                                derivedVariable={this.state.derivedVariable}
                                closeModal={this.closeModal}/>
        }
        return (
            modal
        )
    }


    /**
     * sorts current variables
     * @param e
     */
    handleSort(e) {
        if (e.target.value === "source") {
            this.props.variableManagerStore.sortBySource(this.props.availableCategories.map(d => d.id));
        }
        else if (e.target.value === "addOrder") {
            this.props.variableManagerStore.sortByAddOrder(this.props.addOrder);
        }
        else if (e.target.value === "alphabet") {
            this.props.variableManagerStore.sortAlphabetically();
        }
        else {
            this.props.variableManagerStore.sortByDatatype();
        }
        this.props.setData(this.props.variableManagerStore.currentVariables, this.props.variableManagerStore.referencedVariables);
    }

    /**
     * Opens modal for combining selected variables
     * TODO: implement combine modal
     */
    combineSelected() {
        let selectedVar = this.props.variableManagerStore.getSelectedVariables();
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
            else {
                //open combine modal
            }
        }
        else {
            alert("Please select at least two variables");
        }
    }

    /**
     * moves selected variables
     * @param isUp
     * @param toExtreme
     */
    moveSelected(isUp,toExtreme){
        let indices=this.props.variableManagerStore.getSelectedIndices();
        this.props.variableManagerStore.move(isUp,toExtreme,indices);
        this.props.setData(this.props.variableManagerStore.currentVariables, this.props.variableManagerStore.referencedVariables);
    }

    /**
     * moves single variable
     * @param isUp
     * @param toExtreme
     * @param index
     */
    moveSingle(isUp,toExtreme,index){
        this.props.variableManagerStore.move(isUp,toExtreme,[index]);
        this.props.setData(this.props.variableManagerStore.currentVariables, this.props.variableManagerStore.referencedVariables);
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
                    <MenuItem onClick={()=>this.moveSelected(true,false)} eventKey="1">Up</MenuItem>
                    <MenuItem onClick={()=>this.moveSelected(false,false)} eventKey="2">Down</MenuItem>
                          <MenuItem divider />
                    <MenuItem onClick={()=>this.moveSelected(true,true)} eventKey="3">to top</MenuItem>
                    <MenuItem onClick={()=>this.moveSelected(false,true)} eventKey="4">to bottom</MenuItem>
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
});
export default VariableTable;
