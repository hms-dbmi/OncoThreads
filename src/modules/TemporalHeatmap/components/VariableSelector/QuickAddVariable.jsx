import React from "react";
import {observer} from "mobx-react";
import {Button, Col, Form, FormControl, FormGroup} from 'react-bootstrap';
import Select from 'react-select';
import OriginalVariable from "../../OriginalVariable";
import EventVariable from "../../EventVariable";
import DerivedVariable from "../../DerivedVariable";
import uuidv4 from "uuid/v4";
import MapperCombine from "../../MapperCombineFunctions";

/*
creates the selector for sample variables (left side of main view, top)
 */
const QuickAddVariable = observer(class QuickAddTimepointVar extends React.Component {
    constructor() {
        super();
        this.state = {
            geneListString: "",
            category: 'clinSample',
            selectedValues: [],
            isClinical: true,
            isEvent: false,
            selectedKey: "",
        };
        this.searchGenes = this.searchGenes.bind(this);
        this.updateSearchValue = this.updateSearchValue.bind(this);
        this.handleEnterPressed = this.handleEnterPressed.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.handleOptionSelect = this.handleOptionSelect.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.addVariablesEnter = this.addVariablesEnter.bind(this);
    }

    /**
     * Creates a name using the combined values
     * @param selectedValues
     * @returns {string}
     */
    createCompositeName(selectedValues) {
        let name = "";
        let operatorSymbol = "-or-";
        selectedValues.forEach(function (d, i) {
            if (i !== 0) {
                name += operatorSymbol;
            }
            name += d.label;
        });
        return (name);
    }

    /**
     * calls functions to add a variable
     */
    addEventVariable() {
        if (this.state.selectedValues.length > 0) {
            if (this.state.selectedValues.length > 1) {
                let name = this.createCompositeName(this.state.selectedValues);
                this.addCombinedVariable(name);
            }
            else {
                this.addVariablesSeperate();
            }
            this.props.store.rootStore.undoRedoStore.saveVariableHistory("ADD", this.state.selectedValues.map(d => d.label), true);
        }
    }


    /**
     * adds a variable to the view
     */
    addCombinedVariable(name) {
        let originalVariables = this.state.selectedValues.map(d => new EventVariable(d.value, d.label, this.state.category, d.object.eventType, [], this.props.store.rootStore.getSampleEventMapping(this.state.category, d.object)));
        originalVariables.forEach(d => this.props.store.variableStores.between.addVariableToBeReferenced(d));
        this.props.store.variableStores.between.addVariableToBeDisplayed(new DerivedVariable(uuidv4(), name, "BINARY", "Binary combination of variables: " + this.state.defaultName, this.state.selectedValues.map(d => d.value), "binaryCombine", "or", [], [], MapperCombine.createBinaryCombinedMapper(originalVariables.map(d => d.mapper), "or")));
        this.setState({selectedValues: [], selectedKey: ""})
    }

    /**
     * adds variables as separate rows
     */
    addVariablesSeperate() {
        this.state.selectedValues.forEach(d => this.props.store.variableStores.between.addVariableToBeDisplayed(new EventVariable(d.value, d.label, this.state.category, d.eventType, [], this.props.store.rootStore.getSampleEventMapping(this.state.category, d.object))));
        this.setState({selectedValues: [], selectedKey: ""})
    }


    createEventOptions() {
        let options = [];
        for (let key in this.props.eventAttributes[this.state.category]) {
            let subOptions = [];
            this.props.eventAttributes[this.state.category][key].forEach(d => {
                let option = {
                    label: d.name,
                    value: d.id,
                    object: d,
                    isDisabled: this.state.selectedKey === "" ? false : this.state.selectedKey !== key
                };
                subOptions.push(option)
            });
            options.push({label: key, options: subOptions})
        }
        return options;
    }


    static toTitleCase(str) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    addVariablesEnter(e) {
        if (QuickAddTimepointVar.checkEnterPressed(e)) {
            this.handleAdd();
        }
    }

    static checkEnterPressed(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            return true;
        }
        return false;
    }

    handleAdd() {
        if (this.state.isEvent) {
            this.addEventVariable();
        }
        else {
            if (this.state.isClinical) {
                this.addClinicalVariables();
            }
            else {
                this.searchGenes()
            }
        }
    }

    addClinicalVariables() {
        if (this.state.selectedValues.length > 0) {
            this.state.selectedValues.forEach(d => {
                this.props.store.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable(d.object.id, d.object.variable, d.object.datatype, d.object.description, [], [], this.props.store.rootStore.staticMappers[d.object.id]));
            });
            this.props.store.rootStore.undoRedoStore.saveVariableHistory("ADD", this.state.selectedValues.map(d => d.object.variable), true);
            this.setState({selectedValues: []})
        }
    }

    createTimepointOptions() {
        let options = [];
        let list = [];
        if (this.state.category === "clinSample") {
            list = this.props.clinicalSampleCategories;
        }
        else {
            list = this.props.clinicalPatientCategories;
        }
        list.forEach(d => {
            let lb = (
                <div className="wordBreak" style={{textAlign: "left"}}
                     key={d.variable}> {d.variable}
                </div>);
            options.push({value: d.id, label: lb, object: d})
        });
        return options;
    }

    createOptions() {
        if (this.state.isEvent) {
            return this.createEventOptions();
        }
        else {
            return this.createTimepointOptions();
        }
    }


    /**
     * handles pressing enter after entering genes into the search field
     * @param event
     */
    handleEnterPressed(event) {
        if (QuickAddTimepointVar.checkEnterPressed(event)) {
            this.searchGenes();
        }
    }


    /**
     * searches for the genes entered in the search field
     */
    searchGenes() {
        let geneList = this.state.geneListString.replace(/(\r\n\t|\n|\r\t)/gm, "").toUpperCase().split(" ");
        geneList.forEach(function (d, i) {
            if (d.includes("ORF")) {
                geneList[i] = d.replace("ORF", "orf")
            }
        });
        this.props.store.rootStore.molProfileMapping.getMutations(this.state.category, geneList, "binary", newVariable => {
            this.props.store.variableStores.sample.addVariableToBeDisplayed(newVariable);
        });
        this.props.store.rootStore.undoRedoStore.saveVariableHistory("ADD", geneList, true);
        this.setState({geneListString: ""});
    }

    /**
     * updates the value of geneListString with the current content of the search field
     * @param event
     */
    updateSearchValue(event) {
        this.setState({geneListString: event.target.value});
    }

    handleSelect(e) {
        this.setState({
            isEvent: this.props.eventCategories.includes(e.target.value),
            category: e.target.value,
            geneListString: "",
            isClinical: e.target.value === "clinSample" || e.target.value === "clinPatient"
        });
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


    handleTimepointOptionSelect(selectedOptions) {
        if (selectedOptions.length > 0) {
            this.setState({selectedValues: selectedOptions})
        }
        else {
            this.setState({selectedValues: []})
        }
    }

    handleEventOptionSelect(selectedOptions) {
        if (selectedOptions.length > 0) {
            this.setState({selectedKey: selectedOptions[0].object.eventType, selectedValues: selectedOptions})
        }
        else {
            this.setState({selectedKey: "", selectedValues: []})
        }
    }

    handleOptionSelect(selectedOptions) {
        if (this.state.isEvent) {
            this.handleEventOptionSelect(selectedOptions);
        }
        else {
            this.handleTimepointOptionSelect(selectedOptions)
        }
    }

    getSearchField() {
        if (this.state.category === "clinSample" || this.state.category === "clinPatient" || this.props.eventCategories.includes(this.state.category)) {
            return <Select
                value={this.state.selectedValues}
                type="text"
                isMulti
                searchable={true}
                componentClass="select" placeholder="Select..."
                searchPlaceholder="Search variable"
                options={this.createOptions()}
                onChange={this.handleOptionSelect}
                onKeyDown={this.addVariablesEnter}

            />
        }
        else {
            return <FormControl style={{height: 38}} type="textarea"
                                placeholder={"Enter HUGO Gene Symbols (e.g. TP53, IDH1)"}
                                onChange={this.updateSearchValue}
                                onKeyDown={this.handleEnterPressed}
                                value={this.state.geneListString}/>
        }
    }

    render() {
        return (
            <Form horizontal>
                <FormGroup>
                    <Col sm={2} style={{paddingRight: "0"}}>
                        <FormControl style={{height: 38}} componentClass="select" onChange={this.handleSelect}
                                     placeholder="Select Category">
                            <optgroup label="Timepoint Variables">
                                {this.getTimepointVariableOptions().map((d) => <option value={d.id}
                                                                                       key={d.id}>{d.name}</option>)}
                            </optgroup>
                            <optgroup label="Event Variables">
                                {this.props.eventCategories.filter(d => d !== "SPECIMEN").map((d) => <option value={d}
                                                                                                             key={d}>{QuickAddVariable.toTitleCase(d)}</option>)}
                            </optgroup>
                        </FormControl>
                    </Col>
                    <Col sm={9} style={{padding: 0}}>
                        {this.getSearchField()}
                    </Col>
                    <Col sm={1} style={{paddingLeft: 0}}>
                        <Button style={{height: 38}} onClick={this.handleAdd}>
                            Add
                        </Button>
                    </Col>
                </FormGroup>
            </Form>
        )
    }
});
export default QuickAddVariable;


