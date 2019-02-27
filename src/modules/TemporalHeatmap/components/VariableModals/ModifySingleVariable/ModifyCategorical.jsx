import React from 'react';
import {inject, observer} from 'mobx-react';
import {Button, ControlLabel, FormControl, FormGroup, Modal, Radio} from 'react-bootstrap';
import uuidv4 from "uuid/v4"
import DerivedVariable from "../../../stores/DerivedVariable";
import DerivedMapperFunctions from "../../../UtilityClasses/DeriveMapperFunctions";
import * as d3 from "d3";
import ColorScales from "../../../UtilityClasses/ColorScales";
import CategoricalTable from "../VariableTables/CategoricalTable";
import ConvertBinaryTable from "../VariableTables/ConvertBinaryTable";


const ModifyCategorical = inject("variableManagerStore")(observer(class ModifyCategorical extends React.Component {

    constructor(props) {
        super(props);
        this.state =
            {
                colorScale: d3.scaleOrdinal().range(props.derivedVariable !== null ? props.derivedVariable.range : props.variable.range),
                convertBinary: props.derivedVariable === null ? false : props.derivedVariable.datatype === "BINARY",
                currentData: this.createCurrentCategoryData(),
                binaryMapping: this.createBinaryMapping(),
                binaryColors: props.derivedVariable !== null && props.derivedVariable.modification.type === "convertBinary" ? props.derivedVariable.range : ColorScales.defaultBinaryRange,
                name: props.derivedVariable !== null ? props.derivedVariable.name : props.variable.name,
                ordinal: props.derivedVariable !== null ? props.derivedVariable.datatype === "ORDINAL" : false,
            };
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleApply = this.handleApply.bind(this);
        this.toggleConvertBinary = this.toggleConvertBinary.bind(this);
        this.setCurrentData = this.setCurrentData.bind(this);
        this.setColorScale = this.setColorScale.bind(this);
        this.setOrdinal = this.setOrdinal.bind(this);
        this.setBinaryMapping = this.setBinaryMapping.bind(this);
        this.setBinaryColors = this.setBinaryColors.bind(this)
    }


    /**
     * handles the name change
     * @param event
     */
    handleNameChange(event) {
        this.setState({name: event.target.value});
    }


    /**
     * handles pressing apply
     */
    handleApply() {
        let returnVariable;
        const newId = uuidv4();
        let name = this.state.name;
        let datatype="STRING";
        let range=[];
        let domain=[];
        let modification;
        if (this.state.name === this.props.variable.name && this.props.derivedVariable === null) {
            name = this.state.name + "_MODIFIED";
        }
        //case: no binary conversion
        if (!this.state.convertBinary) {
            let categoryMapping = {};
            this.props.variable.domain.forEach((d) => {
                this.state.currentData.forEach(f => {
                    if (f.categories.includes(d.toString())) {
                        categoryMapping[d] = f.name;
                    }
                });
            });
            //case: ordinal color scale
            if(this.state.ordinal){
                datatype="ORDINAL";
            }
            range = this.state.currentData.map(d => d.color);
            domain = this.state.currentData.map(d => d.name);
            modification = {type: "modifyCategorical", mapping: categoryMapping};
        }
        //case: binary conversion
        else {
            datatype="BINARY";
            range=this.state.binaryColors;
            modification = {type: "convertBinary", mapping: this.state.binaryMapping};
        }
        returnVariable=new DerivedVariable(newId, name, datatype, this.props.variable.description, [this.props.variable.id], modification, range, domain, DerivedMapperFunctions.getModificationMapper(modification, [this.props.variable.mapper]), this.props.variable.profile);
        const oldVariable = this.props.derivedVariable !== null ? this.props.derivedVariable : this.props.variable;
        if (ModifyCategorical.variableChanged(oldVariable,returnVariable)) {
            this.props.variableManagerStore.replaceDisplayedVariable(oldVariable.id, returnVariable);
        }
        else {
            oldVariable.changeRange(range)
        }
        this.props.closeModal();
    }

    /**
     * check if variable has changed
     * @param oldVariable
     * @param newVariable
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

    /**
     * creates the initial list of current categories
     * @returns {Array}
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
                    color: this.props.variable.range[i % this.props.variable.range.length]
                })
            });
        }
        return currentData;
    }

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


    toggleConvertBinary() {
        this.setState({convertBinary: !this.state.convertBinary});
    }

    setCurrentData(currentData) {
        this.setState({currentData: currentData})
    }

    setColorScale(colorScale) {
        this.setState({colorScale: colorScale})
    }

    setOrdinal(ordinal) {
        this.setState({ordinal: ordinal});
    }

    setBinaryMapping(mapping) {
        this.setState({binaryMapping: mapping})
    }

    setBinaryColors(colors) {
        this.setState({binaryColors: colors})
    }

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
            return <CategoricalTable currentData={this.state.currentData}
                                     mapper={this.props.variable.mapper}
                                     ordinal={this.state.ordinal}
                                     colorScale={this.state.colorScale}
                                     setColorScale={this.setColorScale}
                                     setCurrentData={this.setCurrentData}
                                     setOrdinal={this.setOrdinal}
            />
        }
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
                    <Button onClick={this.props.closeModal}>
                        Cancel
                    </Button>
                    <Button
                        disabled={!this.state.convertBinary && new Set(this.state.currentData.map(d => d.name)).size !== this.state.currentData.length}
                        onClick={this.handleApply}>
                        Apply
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
}));
export default ModifyCategorical;
