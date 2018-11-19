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
const QuickAddVariable = observer(class QuickAddVariable extends React.Component {
    constructor(props) {
        super();
        this.state = QuickAddVariable.getInitialState(props);
        this.searchGenes = this.searchGenes.bind(this);
        this.updateSearchValue = this.updateSearchValue.bind(this);
        this.handleEnterPressed = this.handleEnterPressed.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.handleOptionSelect = this.handleOptionSelect.bind(this);
        this.handleMappingSelect=this.handleMappingSelect.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.addVariablesEnter = this.addVariablesEnter.bind(this);
    }
    static getInitialState(props){
        let profile='';
        let mappingType='';
        const nonClinicalProfiles=props.availableProfiles.filter(d=>d.type!=="clinical");
        if(nonClinicalProfiles.length>0){
            profile=nonClinicalProfiles[0].profile;
            mappingType=nonClinicalProfiles[0].id;
        }
        return{
             category:"clinical",
            profile:profile,
            mappingType:mappingType,
            geneListString: "",
            selectedValues: [],
            isClinical: true,
            isEvent: false,
            selectedKey: "",
        }
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
        if (QuickAddVariable.checkEnterPressed(e)) {
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
                this.props.store.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable(d.object.id, d.object.variable, d.object.datatype, d.object.description, [], [], this.props.store.rootStore.staticMappers[d.object.id], d.profile));
            });
            this.props.store.rootStore.undoRedoStore.saveVariableHistory("ADD", this.state.selectedValues.map(d => d.object.variable), true);
            this.setState({selectedValues: []})
        }
    }

    createTimepointOptions() {
        let sampleOptions = [];
        this.props.clinicalSampleCategories.forEach(d => {
            let lb = (
                <div className="wordBreak" style={{textAlign: "left"}}
                     key={d.variable}><b>{d.variable}</b>{": " + d.description}
                </div>);
            sampleOptions.push({value: d.variable + d.description, label: lb, object: d, profile: "clinSample"})
        });
        let patientOptions = [];
        this.props.clinicalPatientCategories.forEach(d => {
            let lb = (
                <div className="wordBreak" style={{textAlign: "left"}}
                     key={d.variable}><b>{d.variable}</b>{": " + d.description}
                </div>);
            patientOptions.push({value: d.variable + " " + d.description, label: lb, object: d, profile: "clinPatient"})
        });
        return [{label: "Sample", options: sampleOptions}, {
            label: "Patient", options: patientOptions
        }];
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
        if (QuickAddVariable.checkEnterPressed(event)) {
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
        console.log(geneList,this.state.profile,this.state.mappingType);
        this.props.store.rootStore.molProfileMapping.getMutations(this.state.profile,
            geneList, this.state.mappingType, newVariables => {
                this.props.store.variableStores.sample.addVariablesToBeDisplayed(newVariables);
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
            isEvent: e.target.value !== "genomic" && e.target.value !== "clinical",
            category: e.target.value,
            geneListString: "",
            isClinical: e.target.value === "clinical"
        });
    }

    handleMappingSelect(e) {
        let profile = this.props.availableProfiles.filter(d => d.id === e.target.value)[0];
        let mappingType = "";
        if (profile.type === "mutation") {
            mappingType = profile.id;
        }
        this.setState({
            mappingType: mappingType,
            profile: profile.profile,
        })
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
        if (this.state.category === "clinical"|| this.props.eventCategories.includes(this.state.category)) {
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
        let selectMappingType = null;
        let colSize = 0;
        if (this.state.category === "genes") {
            colSize = 2;
            selectMappingType = <Col sm={colSize} style={{padding: 0}}>
                <FormControl style={{height: 38}} componentClass="select" onChange={this.handleMappingSelect}
                             placeholder="Select Category">
                    {this.props.availableProfiles.filter(d => d.type !== "clinical").map(d => <option value={d.id}
                                                                                                      key={d.id}>{d.name}</option>)}
                </FormControl>
            </Col>

        }
        let options=[];
         if(this.props.availableProfiles.filter(d=>d.type==="clinical").length>0){
            options.push(<option value={"clinical"}>Clinical Data</option>)
        }
        if(this.props.availableProfiles.filter(d=>d.type!=="clinical").length>0){
            options.push(<option value={"genes"}>Genomic Data</option>)
        }

        return (
            <Form horizontal>
                <FormGroup>
                    <Col sm={2} style={{paddingRight: "0"}}>
                        <FormControl style={{height: 38}} componentClass="select" onChange={this.handleSelect}
                                     placeholder="Select Category">
                            <optgroup label="Timepoint Variables">
                                {options}
                            </optgroup>
                            <optgroup label="Event Variables">
                                {this.props.eventCategories.filter(d => d !== "SPECIMEN").map((d) => <option value={d}
                                                                                                             key={d}>{QuickAddVariable.toTitleCase(d)}</option>)}
                            </optgroup>
                        </FormControl>
                    </Col>
                    <Col sm={9 - colSize} style={{padding: 0}}>
                        {this.getSearchField()}
                    </Col>
                    {selectMappingType}
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


