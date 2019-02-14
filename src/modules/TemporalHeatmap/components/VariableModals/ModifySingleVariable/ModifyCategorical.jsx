import React from 'react';
import {observer} from 'mobx-react';
import {Button, ControlLabel, FormControl, FormGroup, Modal, Radio} from 'react-bootstrap';
import uuidv4 from "uuid/v4"
import DerivedVariable from "../../../DerivedVariable";
import MapperCombine from "../../../MapperCombineFunctions";
import * as d3 from "d3";
import ColorScales from "../../../ColorScales";
import CategoricalTable from "../VariableTables/CategoricalTable";
import ConvertBinaryTable from "../VariableTables/ConvertBinaryTable";


const ModifyCategorical = observer(class ModifyCategorical extends React.Component {

    constructor(props) {
        super(props);
        this.state =
            {
                colorScale: d3.scaleOrdinal().range(props.derivedVariable !== null ? props.derivedVariable.range : props.variable.range),
                convertBinary: props.derivedVariable === null ? false : props.derivedVariable.datatype === "BINARY",
                currentData: this.createCurrentCategoryData(),
                binaryMapping: this.createBinaryMapping(),
                binaryColors: props.derivedVariable !== null && props.derivedVariable.modificationType === "convertBinary" ? props.derivedVariable.range : ColorScales.defaultBinaryRange,
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
        if (!this.state.convertBinary) {
            let categoryMapping = {};
            this.props.variable.domain.forEach((d) => {
                this.state.currentData.forEach(f => {
                    if (f.categories.includes(d.toString())) {
                        categoryMapping[d] = f.name;
                    }
                });
            });
            let newId = uuidv4();
            const datatype = this.state.ordinal ? "ORDINAL" : "STRING";
            const range = this.state.currentData.map(d => d.color);
            const domain = this.state.currentData.map(d => d.name);
            returnVariable = new DerivedVariable(newId, this.state.name, datatype, this.props.variable.description, [this.props.variable.id], "modifyCategorical", categoryMapping, range, domain, MapperCombine.getModificationMapper("modifyCategorical", categoryMapping, [this.props.variable.mapper]), this.props.variable.profile);
            if (this.state.ordinal || this.categoriesChanged(returnVariable)) {
                if (this.state.name === this.props.variable.name && this.props.derivedVariable === null) {
                    returnVariable.name = this.state.name + "_MODIFIED";
                }
            }
            else {
                returnVariable = this.props.variable;
                returnVariable.range = range;
            }
        }
        else {
            let newId = uuidv4();
            returnVariable = new DerivedVariable(newId, this.state.name, "BINARY", this.props.variable.description, [this.props.variable.id], "convertBinary", this.state.binaryMapping, this.state.binaryColors, [], MapperCombine.getModificationMapper("modifyCategorical", this.state.binaryMapping, [this.props.variable.mapper]), this.props.variable.profile);
            if (this.state.name === this.props.variable.name && this.props.derivedVariable === null) {
                returnVariable.name = this.state.name + "_MODIFIED";
            }

        }
        this.props.callback(returnVariable);
        this.props.closeModal();
    }

    categoriesChanged(newVariable) {
        let categoriesChanged = false;
        for (let i = 0; i < this.props.variable.domain.length; i++) {
            if (this.props.variable.domain[i] !== newVariable.domain[i]) {
                categoriesChanged = true;
                break;
            }
        }
        return categoriesChanged;
    }

    /**
     * creates the initial list of current categories
     * @returns {Array}
     */
    createCurrentCategoryData() {
        let currentData = [];
        if (this.props.derivedVariable !== null && this.props.derivedVariable.modificationType !== "convertBinary") {
            this.props.derivedVariable.domain.forEach((d, i) => {
                for (let key in this.props.derivedVariable.modification) {
                    if (this.props.derivedVariable.modification[key] === d) {
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
        if (this.props.derivedVariable !== null && this.props.derivedVariable.modificationType === "convertBinary") {
            binaryMapping = this.props.derivedVariable.modification;
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
});
export default ModifyCategorical;
