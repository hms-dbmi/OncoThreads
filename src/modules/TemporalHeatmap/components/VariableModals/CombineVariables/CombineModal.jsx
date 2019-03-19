import React from 'react';
import {inject, observer} from 'mobx-react';
import {Button, Checkbox, ControlLabel, FormControl, Modal} from 'react-bootstrap';
import BinaryCombine from "./BinaryCombine";
import DerivedVariable from "../../../stores/DerivedVariable";
import uuidv4 from 'uuid/v4';
import DerivedMapperFunctions from "../../../UtilityClasses/DeriveMapperFunctions";
import ColorScales from "../../../UtilityClasses/ColorScales";

/**
 * Component for combining variables
 */
const CombineModal = inject("variableManagerStore")(observer(class CombineModal extends React.Component {

    constructor(props) {
        super(props);
        this.modificationType = this.getModificationType(); //type of combination (depends on the input variables)
        this.state = this.getInitialState();
        this.setModification = this.setModification.bind(this);
        this.setColors = this.setColors.bind(this);
        this.setOrdinal = this.setOrdinal.bind(this);
        this.setCurrentVarCategories = this.setCurrentVarCategories.bind(this);
        this.handleApply = this.handleApply.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);

    }

    /**
     * get type of combine based on input variables
     * @returns {string} binaryCombine, categoryCombine or numberCombine
     */
    getModificationType() {
        let modificationType;
        if (this.props.derivedVariable !== null) {
            modificationType = this.props.derivedVariable.modification.type;
        }
        else {
            if (this.props.variables.filter(d => d.datatype === "BINARY").length === this.props.variables.length) {
                modificationType = "binaryCombine"
            }
            else if (this.props.variables.filter(d => d.datatype === "NUMBER").length === 0) {
                modificationType = "categoryCombine"
            }
            else {
                modificationType = "numberCombine";
            }
        }
        return modificationType;
    }

    /**
     * gets the inital state
     * @return {{name: string, modification: {type: string, operator: string, datatype: string}, nameChanged: boolean, variableRange: string[], keep: boolean, isOrdinal: boolean, currentVarCategories: Object[]}}
     */
    getInitialState() {
        let name; // name of combined variable
        let modification = {type: this.modificationType, operator: "", datatype: ""}; // way of modification
        let nameChanged = false; // has the name been changed
        let variableRange = [];
        let keep = true; // keep original variables or discard them
        let ordinal = false; // is combined variable ordinal
        let currentVarCategories = []; // current categories of combined variable
        // if the variable is already combined base parameters on this variable
        if (this.props.derivedVariable !== null) {
            modification = this.props.derivedVariable.modification;
            name = this.props.derivedVariable.name;
            nameChanged = true;
            variableRange = this.props.derivedVariable.range;
            ordinal = this.props.derivedVariable.datatype === "ORDINAL";
            if (this.props.derivedVariable.modification.datatype === "STRING") {
                currentVarCategories = this.getCurrentDataOfDerivedVariable();
            }
        }
        else {
            if (this.modificationType === "binaryCombine") {
                name = "BINARY COMBINE: " + this.props.variables.map(d => d.name);
            }
            else if (this.modificationType === "categoryCombine") {
                name = "CATEGORY COMBINE: " + this.props.variables.map(d => d.name);
            }
            else {
                name = "NUMBER COMBINE: " + this.props.variables.map(d => d.name);
            }
        }
        return {
            name: name,
            modification: modification,
            nameChanged: nameChanged,
            variableRange: variableRange,
            keep: keep,
            isOrdinal: ordinal,
            currentVarCategories: currentVarCategories
        };
    }

    /**
     * creates current variable categories for a derived variable
     * @returns {Object[]}
     */
    getCurrentDataOfDerivedVariable() {
        let currentVarCategories = [];
        this.props.derivedVariable.domain.forEach((d, i) => {
            let categories = [];
            if (this.props.derivedVariable.modification.mapping === null) {
                categories = [d];
            }
            else {
                for (let key in this.props.derivedVariable.modification.mapping) {
                    if (this.props.derivedVariable.modification.mapping[key] === d) {
                        categories.push(key);
                    }
                }
            }
            currentVarCategories.push({
                selected: false,
                name: d,
                categories: categories,
                color: this.props.derivedVariable.range[i % this.props.derivedVariable.range.length]
            });
        });
        return currentVarCategories;
    }

    /**
     * creates current variable categories for a non-derived variable
     * @param {Object} modification
     * @param {string[]}colors
     * @returns {Object[]}
     */
    createCurrentCategoryData(modification, colors) {
        let currentVarCategories = [];
        this.getDomain(modification).forEach((d, i) => {
            currentVarCategories.push({
                selected: false,
                name: d,
                categories: [d],
                color: colors[i % colors.length]
            })
        });
        return currentVarCategories;
    }

    /**
     * sets the current modification type and corresponding currentVarCategories and colors
     * @param {Object} modification
     */
    setModification(modification) {
        let currentVarCategories = [];
        let colors = [];
        modification.type = this.modificationType;
        if (modification.datatype === "STRING") {
            if (this.props.derivedVariable !== null && this.props.derivedVariable.modification.datatype === "STRING") {
                colors = this.props.derivedVariable.range;
            }
            else {
                colors = ColorScales.defaultCategoricalRange;
            }
            modification.variableNames = this.props.variables.map(d => d.name);
            currentVarCategories = this.createCurrentCategoryData(modification, colors);
        }
        else {
            if (this.props.derivedVariable !== null && this.props.derivedVariable.modification.datatype === "BINARY") {
                colors = this.props.derivedVariable.range;
            }
            else {
                colors = ColorScales.defaultBinaryRange;
            }
        }
        this.setState({
            modification: modification,
            currentVarCategories: currentVarCategories,
            variableRange: colors
        });
    }


    /**
     * returns the domain of the current mapper
     * @param {Object} modification
     * @returns {Array}
     */
    getDomain(modification) {
        let currDomain = [];
        let mapper = DerivedMapperFunctions.getModificationMapper(modification, this.props.variables.map(d => d.mapper));
        for (let sample in mapper) {
            if (!(currDomain.includes(mapper[sample]))) {
                currDomain.push(mapper[sample]);
            }
        }
        return currDomain;
    }

    /**
     * sets colors for the combined variable
     * @param {string[]} colors
     */
    setColors(colors) {
        this.setState({variableRange: colors});
    }

    /**
     * sets if combined variable is ordinal
     * @param {boolean} ordinal
     */
    setOrdinal(ordinal) {
        this.setState({isOrdinal: ordinal});
    }

    /**
     * sets current variable categories
     * @param {Object[]} currentVarCategories
     */
    setCurrentVarCategories(currentVarCategories) {
        let categoryMapping = {};
        this.getDomain(this.state.modification).forEach((d) => {
            this.state.currentVarCategories.forEach(f => {
                if (f.categories.includes(d)) {
                    categoryMapping[d] = f.name;
                }
            });
        });
        const range = this.state.currentVarCategories.map(d => d.color);
        this.setState({
            currentVarCategories: currentVarCategories,
            variableRange: range,
            modification: {
                type: this.modificationType,
                operator: "or",
                datatype: "STRING",
                mapping: categoryMapping,
                variableNames: this.state.modification.variableNames
            }
        });
    }

    /**
     * handles the name change
     * @param {event} event
     */
    handleNameChange(event) {
        this.setState({name: event.target.value, nameChanged: true});
    }

    /**
     * returns the component corresponding to the modificationType
     * @return {BinaryCombine}
     */
    getModificationPanel() {
        if (this.modificationType === "binaryCombine") {
            return <BinaryCombine setModification={this.setModification}
                                  ordinal={this.state.ordinal}
                                  modification={this.state.modification}
                                  mapper={DerivedMapperFunctions.getModificationMapper(this.state.modification, this.props.variables.map(d => d.mapper))}
                                  variableRange={this.state.variableRange}
                                  variableDomain={this.getDomain(this.state.modification)}
                                  currentVarCategories={this.state.currentVarCategories}
                                  setOrdinal={this.setOrdinal}
                                  setColors={this.setColors}
                                  setCurrentVarCategories={this.setCurrentVarCategories}/>
        }
    }

     /**
     * applies combination of variables
     */
    handleApply() {
        let dataType, description;
        let mapper = DerivedMapperFunctions.getModificationMapper(this.state.modification, this.props.variables.map(d => d.mapper));
        if (this.modificationType === "binaryCombine") {
            if (this.state.modification.datatype === "BINARY") {
                dataType = "BINARY";
                description = "Binary combination of " + this.props.variables.map(d => d.name);
            }
            else {
                if (this.state.ordinal) {
                    dataType = "ORDINAL";
                }
                else {
                    dataType = "STRING";
                }
                description = "Binary combination of " + this.props.variables.map(d => d.name);
                if (this.state.modification.mapping !== null) {
                    mapper = DerivedMapperFunctions.createModifyCategoriesMapper(mapper, this.state.modification.mapping);
                }
            }
        }
        else if (this.modificationType === "categoryCombine") {
            dataType = "STRING";
            description = "Combination of the categories of" + this.props.variables.map(d => d.name);

        }
        else if (this.modificationType === "numberCombine") {
            dataType = "NUMBER";
            description = "Numerical combination of " + this.props.variables.map(d => d.name);

        }
        this.props.variableManagerStore.addVariableToBeDisplayed(new DerivedVariable(uuidv4(), this.state.name, dataType, description, this.props.variables.map(d => d.id), this.state.modification, this.state.variableRange, [], mapper, uuidv4(), "combined"), this.state.keep);
        if (!this.state.keep) {
            this.props.variables.forEach(d => {
                this.props.variableManagerStore.removeVariable(d.id);
            })
        }
        this.props.closeModal();
    }


    render() {
        return (
            <Modal show={this.props.modalIsOpen}
                   onHide={this.props.closeModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Combine Variables</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{minHeight: "400px"}}>
                    <ControlLabel>Variable name</ControlLabel>
                    <FormControl
                        type="text"
                        value={this.state.name}
                        onChange={this.handleNameChange}/>
                    {this.getModificationPanel()}
                </Modal.Body>
                <Modal.Footer>
                    <Checkbox disabled={this.props.derivedVariable !== null}
                              onChange={() => this.setState({keep: !this.state.keep})} checked={!this.state.keep}>Discard
                        original variables</Checkbox>
                    <Button onClick={this.props.closeModal}>
                        Cancel
                    </Button>
                    <Button onClick={this.handleApply}>
                        Apply
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
}));
export default CombineModal;
