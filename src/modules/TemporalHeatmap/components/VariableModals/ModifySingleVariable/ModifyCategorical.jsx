import React from 'react';
import {inject, observer} from 'mobx-react';
import {Button, Checkbox, ControlLabel, FormControl, FormGroup, Modal, Radio} from 'react-bootstrap';
import uuidv4 from "uuid/v4"
import DerivedVariable from "../../../stores/DerivedVariable";
import DerivedMapperFunctions from "../../../UtilityClasses/DeriveMapperFunctions";
import * as d3 from "d3";
import ColorScales from "../../../UtilityClasses/ColorScales";
import CategoricalTable from "../VariableTables/CategoricalTable";
import ConvertBinaryTable from "../VariableTables/ConvertBinaryTable";
import VariableTable from "../VariableTable";

/**
 * Modification of a categorical variable
 */
const ModifyCategorical = inject("variableManagerStore", "rootStore")(observer(class ModifyCategorical extends React.Component {

    constructor(props) {
        super(props);
        this.state = this.getInitialState();
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleApply = this.handleApply.bind(this);
        this.toggleConvertBinary = this.toggleConvertBinary.bind(this);
        this.setCurrentCategories = this.setCurrentCategories.bind(this);
        this.setColorScale = this.setColorScale.bind(this);
        this.setOrdinal = this.setOrdinal.bind(this);
        this.setBinaryMapping = this.setBinaryMapping.bind(this);
        this.setBinaryColors = this.setBinaryColors.bind(this)
    }

    /**
     * The initial state depends on if the input variable is already modified (derivedVariable !== null)
     * @return {Object} - state of modified variable.
     */
    getInitialState() {
        if (this.props.derivedVariable === null) {
            return {
                colorScale: d3.scaleOrdinal().range(this.props.variable.range), // currently used color scale for categories
                convertBinary: false, // current datatype
                currentCategories: this.createCurrentCategoryData(), // current categories of the modified variable
                binaryMapping: this.createBinaryMapping(), // mapping of categories to binary values for binary conversion
                binaryColors: ColorScales.defaultBinaryRange, // colors of binary values for binary conversion
                name: this.props.variable.name, //name of modified variable
                isOrdinal: this.props.variable.datatype === "ORDINAL", // is modified variable isOrdinal
                applyToAll: false // should modification be applied to entire profile
            }
        }
        else {
            return {
                colorScale: d3.scaleOrdinal().range(this.props.derivedVariable.range), // currently used color scale for categories
                convertBinary: this.props.derivedVariable.datatype === "BINARY", // current datatype
                currentCategories: this.createCurrentCategoryData(), // current categories of the modified variable
                binaryMapping: this.createBinaryMapping(), // mapping of categories to binary values for binary conversion
                binaryColors: this.props.derivedVariable.modification.type === "convertBinary" ? this.props.derivedVariable.range : ColorScales.defaultBinaryRange, // colors of binary values for binary conversion
                name: this.props.derivedVariable.name, //name of modified variable
                isOrdinal: this.props.derivedVariable.datatype === "ORDINAL",
                applyToAll: false // should modification be applied to entire profile
            }
        }
    }


    /**
     * handles changing the name of the modified variable
     * @param {event} event
     */
    handleNameChange(event) {
        this.setState({name: event.target.value});
    }


    /**
     * handles pressing apply
     * Depending on the way the variable is modified a derived variable is created with different parameters.
     * If the only change is a change in color scale the no derived variable is created but only the range is modified
     */
    handleApply() {
        let returnVariable;
        const newId = uuidv4();
        let name = this.state.name;
        let datatype = this.props.variable.datatype;
        let range = [];
        let domain = [];
        let modification;
        if (this.state.name === this.props.variable.name && this.props.derivedVariable === null) {
            name = this.state.name + "_MODIFIED";
        }
        //case: no binary conversion
        if (!this.state.convertBinary) {
            let categoryMapping = {};
            this.props.variable.domain.forEach((d) => {
                this.state.currentCategories.forEach(f => {
                    if (f.categories.includes(d.toString())) {
                        categoryMapping[d] = f.name;
                    }
                });
            });
            //case: isOrdinal color scale
            if (this.state.isOrdinal) {
                datatype = "ORDINAL";
            }
            else {
                datatype = "STRING"
            }
            range = this.state.currentCategories.map(d => d.color);
            domain = this.state.currentCategories.map(d => d.name);
            modification = {type: "modifyCategorical", mapping: categoryMapping};
        }
        //case: binary conversion
        else {
            datatype = "BINARY";
            range = this.state.binaryColors;
            modification = {type: "convertBinary", mapping: this.state.binaryMapping};
        }
        const derivedProfile = uuidv4();
        returnVariable = new DerivedVariable(newId, name, datatype, this.props.variable.description, [this.props.variable.id], modification, range, domain, DerivedMapperFunctions.getModificationMapper(modification, [this.props.variable.mapper]), derivedProfile, this.props.variable.type);
        const oldVariable = this.props.derivedVariable !== null ? this.props.derivedVariable : this.props.variable;
        let profile = this.props.derivedVariable === null ? this.props.variable.profile : this.props.derivedVariable.profile;
        if (VariableTable.variableChanged(oldVariable, returnVariable)) {
            this.props.variableManagerStore.replaceDisplayedVariable(oldVariable.id, returnVariable);
            if (this.state.applyToAll) {
                this.props.variableManagerStore.applyToEntireProfile(profile, derivedProfile, datatype, modification, domain, range)
            }
        }
        else {
            if (this.state.applyToAll) {
                this.props.variableManagerStore.applyRangeToEntireProfile(profile, range);
            }
            else {
                oldVariable.changeRange(range);
            }

        }
        this.props.closeModal();
    }

    /**
     * creates the initial list of current categories.
     * If the variable is already modified, the list of current categories has to be created using the modifcation object to get information on how the categories have already been modified
     * @returns {Object[]} current categories
     */
    createCurrentCategoryData() {
        let currentData = [];
        if (this.props.derivedVariable !== null && this.props.derivedVariable.modification.type !== "convertBinary") {
            this.props.derivedVariable.domain.forEach((d, i) => {
                for (let key in this.props.derivedVariable.modification.mapping) {
                    if (this.props.derivedVariable.modification.mapping[key] === d) {
                        if (!(currentData.map(d => d.name).includes(d))) {
                            currentData.push({
                                selected: false,
                                name: d,
                                categories: [],
                                color: this.props.derivedVariable.range[i % this.props.derivedVariable.range.length]
                            })
                        }
                        currentData[currentData.map(d => d.name).indexOf(d)].categories.push(key);
                    }
                }
            });
        }
        else {
            this.props.variable.domain.forEach((d, i) => {
                currentData.push({
                    selected: false,
                    name: d.toString(),
                    categories: [d.toString()],
                    color: this.props.variable.colorScale(d)
                })
            });
        }
        return currentData;
    }

    /**
     * gets mapping of variable categories to binary categories. If there already is a binary modification,
     * the mapping is created using the modification object of the derived variable
     * return {Object} binary mapping
     */
    createBinaryMapping() {
        let binaryMapping = {};
        if (this.props.derivedVariable !== null && this.props.derivedVariable.modification.type === "convertBinary") {
            binaryMapping = this.props.derivedVariable.modification.mapping;
        }
        else {
            this.props.variable.domain.forEach(d => binaryMapping[d] = true);
        }
        return binaryMapping;
    }

    /**
     * change between binary conversion and category customization
     */
    toggleConvertBinary() {
        this.setState({convertBinary: !this.state.convertBinary});
    }

    /**
     * sets current categories to a modified set of categories
     * @param {Object[]} currentCategories
     */
    setCurrentCategories(currentCategories) {
        this.setState({currentCategories: currentCategories})
    }

    /**
     * sets colorScale state
     * @param {d3.scaleOrdinal} colorScale
     */
    setColorScale(colorScale) {
        this.setState({colorScale: colorScale})
    }

    /**
     * sets ordinal state
     * @param {boolean} ordinal
     */
    setOrdinal(ordinal) {
        this.setState({isOrdinal: ordinal});
    }

    /**
     * sets binary mapping
     * @param {Object} mapping
     */
    setBinaryMapping(mapping) {
        this.setState({binaryMapping: mapping})
    }

    /**
     * sets binary colors
     * @param {string[]} colors
     */
    setBinaryColors(colors) {
        this.setState({binaryColors: colors})
    }

    /**
     * gets the table showing modifications on the current categories or binary conversion
     * @return {ConvertBinaryTable|CategoricalTable} category table
     */
    getTable() {
        if (this.state.convertBinary) {
            return <ConvertBinaryTable variableDomain={this.props.variable.domain}
                                       mapper={this.props.variable.mapper}
                                       binaryColors={this.state.binaryColors}
                                       binaryMapping={this.state.binaryMapping}
                                       setBinaryMapping={this.setBinaryMapping}
                                       setBinaryColors={this.setBinaryColors}/>
        }
        else {
            return <CategoricalTable currentCategories={this.state.currentCategories}
                                     mapper={this.props.variable.mapper}
                                     isOrdinal={this.state.isOrdinal}
                                     colorScale={this.state.colorScale}
                                     setColorScale={this.setColorScale}
                                     setCurrentCategories={this.setCurrentCategories}
                                     setOrdinal={this.setOrdinal}
            />
        }
    }

    /**
     * returns a checkbox if variable that will be modified is part of a molecular profile.
     * Checking the checkbox results in the modifcation being applied to all variables of that profile
     * @return {Checkbox|null}
     */
    getApplyToAll() {
        let checkbox = null;
        if (this.props.variable.profile==="Mutation type") {
            checkbox =
                <Checkbox checked={this.state.applyToAll} value={this.state.applyToAll}
                          onChange={() => this.setState({applyToAll: !this.state.applyToAll})}>{"Apply action to all Mutation type variables"}</Checkbox>
        }
        return checkbox;

    }


    render() {
        return (
            <Modal show={this.props.modalIsOpen}
                   onHide={this.props.closeModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Modify Categorical Variable</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{minHeight: "400px"}}>
                    <form>
                        <ControlLabel>Variable name</ControlLabel>
                        <FormControl
                            type="text"
                            value={this.state.name}
                            onChange={this.handleNameChange}/>
                    </form>
                    <h5>Description</h5>
                    <p>{this.props.variable.description}</p>
                    <FormGroup>
                        <Radio onChange={this.toggleConvertBinary} name="radioGroup"
                               checked={!this.state.convertBinary}>
                            Customize categories
                        </Radio>{' '}
                        <Radio onChange={this.toggleConvertBinary} name="radioGroup" checked={this.state.convertBinary}>
                            Convert to binary
                        </Radio>{' '}
                    </FormGroup>
                    {this.getTable()}
                </Modal.Body>
                <Modal.Footer>
                    {this.getApplyToAll()}
                    <Button onClick={this.props.closeModal}>
                        Cancel
                    </Button>
                    <Button
                        disabled={!this.state.convertBinary && new Set(this.state.currentCategories.map(d => d.name)).size !== this.state.currentCategories.length}
                        onClick={this.handleApply}>
                        Apply
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
}));
export default ModifyCategorical;
