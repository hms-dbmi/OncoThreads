import React from 'react';
import { inject, observer } from 'mobx-react';
import {
    Alert,
    Button,
    ButtonToolbar,
    Checkbox,
    Col,
    ControlLabel,
    Form,
    FormControl,
    FormGroup,
    Glyphicon,
    Table,
} from 'react-bootstrap';
import OriginalVariable from "../../stores/OriginalVariable";
import ExploreVariables from '../Modals/ExploreVariables';
import SelectAll from '../../../SelectAllSelector/react-select-all';

/**
 * Component for selecting timepoint variables in variable manager
 */
const TimepointVariableSelector = inject("variableManagerStore", "rootStore")(observer(class TimepointVariableSelector extends React.Component {

    constructor(props) {
        super(props);
        var tpScores = [];
        [...this.props.rootStore.timepointStructure.keys()].forEach(i => {
            //sortTimePointScores[i] = true;
            //tpScores.push({id:i, sortNumTimePoint: true});
            tpScores.push(true);
        });


        this.state = {
            geneListString: "",
            selectionType: "clinical",
            mutationOptions: [],
            molecularOptions: [],
            clinicalOptions: [],
            showCheckBoxOptions: false,
            vscore: false,
            sortVarAsc: true,
            //sortTypeAsc: true,
            sortNumAcrossAsc: true,
            sortTimePointScores: tpScores,
            modalIsOpen: false,
        };


        //this.setState({sortTimePointScores : tpScores});

        //this.state.sortTimePointScores=tpScores;


        this.handleOptionSelect = this.handleOptionSelect.bind(this);
        this.searchGenes = this.searchGenes.bind(this);
        this.updateSearchValue = this.updateSearchValue.bind(this);
        this.handleEnterPressed = this.handleEnterPressed.bind(this);
        this.updateMutationCheckBoxOptions = this.updateMutationCheckBoxOptions.bind(this);
        this.updateMolecularCheckBoxOptions = this.updateMolecularCheckBoxOptions.bind(this);
        this.resetSelected=this.resetSelected.bind(this);
        this.addGenes = this.addGenes.bind(this);
        this.addVariables = this.addVariables.bind(this);
        this.addClinicalVariables = this.addClinicalVariables.bind(this);
        this.showVariabilityScores = this.showVariabilityScores.bind(this);
        this.renderVariability = this.renderVariability.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.sortAlphabetically = this.sortAlphabetically.bind(this);
        this.sortNumbers = this.sortNumbers.bind(this);
    }

    /**
     * creates all selectable options
     * @return {Object[]}
     */
    createOptions() {
        let savedOptions = [];
        this.props.variableManagerStore.savedReferences.forEach(d => {
            let variable = this.props.variableManagerStore.getById(d);
            let lb = (
                <div style={{ textAlign: "left" }}
                     key={d}><b>{variable.name}</b>{": " + variable.description}
                </div>);
            savedOptions.push({
                value: variable.name + variable.description,
                label: lb,
                object: variable.id,
                type: "saved",
            })
        });
        let sampleOptions = [];
        let self = this;
        this.props.rootStore.clinicalSampleCategories.forEach(d => {
            let lb = (
                <div style={{ textAlign: "left" }}
                     key={d.variable}>
                    <b>{d.variable}</b>{": " + d.description + ", variability: " + Number(self.props.rootStore.scoreStructure[d.id]).toPrecision(2)}
                </div>);
            sampleOptions.push({ value: d.variable + d.description, label: lb, object: d, type: "clinSample" })
        });
        let patientOptions = [];
        this.props.rootStore.clinicalPatientCategories.forEach(d => {
            let lb = (
                <div style={{ textAlign: "left" }}
                     key={d.variable}><b>{d.variable}</b>{": " + d.description}
                </div>);
            patientOptions.push({ value: d.variable + " " + d.description, label: lb, object: d, type: "clinPatient" })
        });
        return [{ label: "Saved variables", options: savedOptions },
            { label: "Sample-specific", options: sampleOptions },
            { label: "Patient-specific", options: patientOptions }];

    }

    /**
     * handle selection of an option
     * @param {Object[]} selectedOptions
     */
    handleOptionSelect(selectedOptions) {
        this.setState({ clinicalOptions: selectedOptions });
    }


    /**
     * updates the checkboxes showing the different mutation data types
     * @param {boolean} hasData
     */
    updateMutationCheckBoxOptions(hasData) {
        let mutationOptions = [];
        if (hasData) {
            this.props.rootStore.mutationMappingTypes.forEach(d => {
                mutationOptions.push({ id: d, selected: false });
            })
        }
        this.setState({ mutationOptions: mutationOptions, showCheckBoxOptions: true });
    }

    /**
     * updates the checkboxes showing the different molecular profiles
     * @param {string} profile
     * @param {boolean} hasData
     */
    updateMolecularCheckBoxOptions(profile, hasData) {
        let molecularOptions = this.state.molecularOptions.slice();
        if (hasData) {
            if (!molecularOptions.map(d => d.id).includes(profile)) {
                molecularOptions.push({
                    id: profile,
                    profile: profile,
                    name: this.props.rootStore.availableProfiles.filter(d => d.molecularProfileId === profile)[0].name,
                    selected: false,
                });
            }
        }
        else {
            if (molecularOptions.map(d => d.id).includes(profile)) {
                molecularOptions.splice(molecularOptions.map(d => d.id).indexOf(profile), 1);
            }
        }
        this.setState({ molecularOptions: molecularOptions, showCheckBoxOptions: true });
    }

    /**
     * searches for the genes entered in the search field
     */
    searchGenes() {
        this.setState({ molecularOptions: [], mutationOptions: [] });
        let geneList = this.state.geneListString.replace(/(\r\n\t|\n|\r\t)/gm, "").toUpperCase().split(" ");
        geneList.forEach(function (d, i) {
            if (d.includes("ORF")) {
                geneList[i] = d.replace("ORF", "orf")
            }
        });
        // check for which profiles data is available for the entered HUGOSymbols
        this.props.rootStore.molProfileMapping.getDataContainingProfiles(geneList, dataProfiles => {
            this.props.rootStore.availableProfiles.forEach(d => {
                if (d.molecularAlterationType === "MUTATION_EXTENDED") {
                    this.updateMutationCheckBoxOptions(dataProfiles.includes(d.molecularProfileId));
                }
                else {
                    this.updateMolecularCheckBoxOptions(d.molecularProfileId, dataProfiles.includes(d.molecularProfileId));
                }
            });
        });
    }

    /**
     * adds Genes to view
     */
    addGenes() {
        this.getOnDemandVariables().forEach(variable => {
            this.props.variableManagerStore.addVariableToBeDisplayed(variable);
            this.props.variableManagerStore.toggleSelected(variable.id);
        });
        this.setState({ geneListString: "", showCheckBoxOptions: false });
    }

    /**
     * updates the value of geneListString with the current content of the search field
     * @param {event} event
     */
    updateSearchValue(event) {
        this.setState({ geneListString: event.target.value, showCheckBoxOptions: false });
    }

    /**
     * handles pressing enter after entering genes into the search field
     * @param {event} event
     */
    handleEnterPressed(event) {
        if (TimepointVariableSelector.checkEnterPressed(event)) {
            this.searchGenes();
        }
    }

    /**
     * checks if the pressed key was the enter key
     * @param {event} event
     * @return {boolean}
     */
    static checkEnterPressed(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            return true;
        }
        return false;
    }


    /**
     * toggles selection of a checkbox
     * @param {number} index
     * @param {boolean} isMutation
     */
    toggleSelect(index, isMutation) {
        if (isMutation) {
            let mutationOptions = this.state.mutationOptions.slice();
            mutationOptions[index].selected = !mutationOptions[index].selected;
            this.setState({ mutationOptions: mutationOptions });
        }
        else {
            let molecularOptions = this.state.molecularOptions.slice();
            molecularOptions[index].selected = !molecularOptions[index].selected;
            this.setState({ molecularOptions: molecularOptions });
        }

    }

    showVariabilityScores() {

        if (this.state.vscore === false) {
            this.setState({ vscore: true });
        }
        else {
            this.setState({ vscore: false });
        }
    }


    /**
     * sorts current variables
     * @param {string} category
     */
    handleSort(category, timeline) {
        /*if (category === "source") {
         this.props.variableManagerStore.sortBySource(this.props.availableCategories.map(d => d.id), this.sortSourceAsc);
         this.sortSourceAsc = !this.sortSourceAsc;
         }*/

        if (category === "alphabet") {
            this.sortAlphabetically();
            //this.sortVarAsc = !this.sortVarAsc;
            this.setState({ sortVarAsc: !this.state.sortVarAsc });

        }
        else { //for numbers         
            this.sortNumbers(timeline); //across or timepoint            
        }
    }

    sortNumbers(timeline) {
        let factor = 1;
        var keysSorted;
        var struct;
        if (timeline === 'across') {
            if (!this.state.sortNumAcrossAsc) {
                factor = -1
            }

            struct = this.props.rootStore.scoreStructure;
            keysSorted = Object.keys(struct).sort(
                //function(a,b){return struct[a]-struct[b]}
                function keyOrder(k1, k2) {
                    if (struct[k1] < struct[k2]) return -factor;
                    else if (struct[k1] > struct[k2]) return factor;
                    else return 0;
                },
            );

            this.setState({ sortNumAcrossAsc: !this.state.sortNumAcrossAsc });
        }
        else {
            if (!this.state.sortTimePointScores[timeline]) {
                factor = -1
            }

            struct = this.props.rootStore.TimeLineVariability;
            keysSorted = Object.keys(this.props.rootStore.scoreStructure).sort(
                //function(a,b){return struct[a]-struct[b]}
                function keyOrder(k1, k2) {
                    if (struct[k1][timeline] < struct[k2][timeline]) return -factor;
                    else if (struct[k1][timeline] > struct[k2][timeline]) return factor;
                    else return 0;
                },
            );

            var tpScores = this.state.sortTimePointScores.slice();
            tpScores[timeline] = !tpScores[timeline];
            this.setState({ sortTimePointScores: tpScores });
        }

        var i, after = {};
        for (i = 0; i < keysSorted.length; i++) {
            after[keysSorted[i]] = this.props.rootStore.scoreStructure[keysSorted[i]];
            delete this.props.rootStore.scoreStructure[keysSorted[i]];
        }

        for (i = 0; i < keysSorted.length; i++) {
            this.props.rootStore.scoreStructure[keysSorted[i]] = after[keysSorted[i]];
        }

        console.log(this.props.rootStore.scoreStructure);

    }

    /**
     * sort variables alphabetically
     * @param {boolean} asc - sort ascending/descending
     */
    sortAlphabetically() {
        let factor = 1;
        if (!this.state.sortVarAsc) {
            factor = -1
        }
        /*this.currentVariables.replace(this.currentVariables.sort((a, b) => {
         if (this.referencedVariables[a.id].name < this.referencedVariables[b.id].name) {
         return -factor
         }
         if (this.referencedVariables[a.id].name > this.referencedVariables[b.id].name) {
         return factor;
         }
         else return 0;
         }));*/

        //var obj = this.props.rootStore.scoreStructure;

        var keys = Object.keys(this.props.rootStore.scoreStructure);

        keys.sort(function keyOrder(k1, k2) {
            if (k1 < k2) return -factor;
            else if (k1 > k2) return factor;
            else return 0;
        });

        console.log(keys);

        var i, after = {};
        for (i = 0; i < keys.length; i++) {
            after[keys[i]] = this.props.rootStore.scoreStructure[keys[i]];
            delete this.props.rootStore.scoreStructure[keys[i]];
        }

        for (i = 0; i < keys.length; i++) {
            this.props.rootStore.scoreStructure[keys[i]] = after[keys[i]];
        }

        console.log(this.props.rootStore.scoreStructure);

    }

    renderVariability() {
        if (this.state.vscore) {

            var across = this.props.rootStore.scoreStructure;
            var withinAll = this.props.rootStore.TimeLineVariability;

            //let that=this;

            let elements = [];

            Object.keys(across).forEach(function (d) {
                //console.log(d);
                //console.log(across[d]);
                //console.log(Object.values(withinAll[d]));
                var l = Object.keys(Object.values(withinAll[d])).length; //timeline length

                var x = [];

                for (var i = 0; i < l; i++) {
                    x.push(<td key={i}> {Object.values(Object.values(withinAll[d]))[i]}</td>);
                }
                //console.log(withinAll[d][Number(TimePoints[0])]);
//{that.props.rootStore.clinicalSampleCategories.filter(k=>k.id===d)[0].variable}
                elements.push(
                    <tr key={d}
                    >
                        <td>
                            {d}
                        </td>

                        <td>
                            {across[d]}
                        </td>

                        {x}

                    </tr>);
            })

            var headerCols = [];
            [...this.props.rootStore.timepointStructure.keys()].forEach(i => {
                //for(var i=0; i<this.props.rootStore.timepointStructure.length; i++) {


                headerCols.push(
                    <th key={i + 10}>Score in T{i} {this.state.sortTimePointScores[i] ?
                        <Glyphicon onClick={() => this.handleSort("numbers", i)}
                                   glyph="chevron-down"/> :
                        <Glyphicon onClick={() => this.handleSort("numbers", i)}
                                   glyph="chevron-up"/>}
                    </th>);


            });

            return (
                <div style={{ "margin": "10px", "overflow": "scroll" }}>
                    <Table condensed hover>
                        <thead>
                        <tr>
                            <th>Variable {this.state.sortVarAsc ?
                                <Glyphicon onClick={() => this.handleSort("alphabet", "")}
                                           glyph="chevron-down"/> :
                                <Glyphicon onClick={() => this.handleSort("alphabet", "")}
                                           glyph="chevron-up"/>} </th>
                            <th>Score Across Timeline
                                {this.state.sortNumAcrossAsc ?
                                    <Glyphicon onClick={() => this.handleSort("numbers", "across")}
                                               glyph="chevron-down"/> :
                                    <Glyphicon onClick={() => this.handleSort("numbers", "across")}
                                               glyph="chevron-up"/>}
                            </th>
                            {headerCols}

                        </tr>
                        </thead>
                        <tbody>
                        {elements}
                        </tbody>
                    </Table>
                </div>);

        } else {
            return null;
        }

    }

    /**
     * gets the checkboxes for the available genomic data
     * @returns {Form}
     */
    getAvailableCheckBoxes() {
        let checkBoxes = [];
        if (this.state.mutationOptions.length > 0 || this.state.molecularOptions.length > 0) {
            checkBoxes.push(<h5 key={"header"}>Available data for gene(s)</h5>)
        }
        else {
            checkBoxes = "No data available"
        }
        if (this.state.mutationOptions.length > 0) {
            let available = [];
            this.state.mutationOptions.forEach((d, i) => available.push(<Checkbox
                onChange={() => this.toggleSelect(i, true)} checked={d.selected} key={d.id}
                value={d.id}>{d.id}</Checkbox>));
            checkBoxes.push(<Col key="Mutations" sm={6}>
                <ControlLabel>Mutations</ControlLabel>
                {available}
            </Col>)
        }
        if (this.state.molecularOptions.length > 0) {
            let available = [];
            this.state.molecularOptions.forEach((d, i) => available.push(<Checkbox
                onChange={() => this.toggleSelect(i, false)} checked={d.selected} key={d.id}
                value={d.id}>{d.name}</Checkbox>));
            checkBoxes.push(<Col key="Molecular" sm={6}>
                <ControlLabel>Molecular Profiles</ControlLabel>
                {available}
            </Col>)
        }
        return <Col sm={10} smOffset={2}>
            <Alert>
                <FormGroup>{checkBoxes}</FormGroup>
            </Alert>
        </Col>

    }

    addVariables() {
        this.addClinicalVariables();
        this.addGenes();
    }

    addClinicalVariables() {
        this.getClinicalVariables().forEach(variable => {
            this.props.variableManagerStore.addVariableToBeDisplayed(variable);
        });
        this.setState({ clinicalOptions: [] });
    }

    getClinicalVariables() {
        const variables = [];
        this.state.clinicalOptions.map(d => d.object).forEach(selectedOption => {
            if (selectedOption.source !== 'derived') {
                variables.push(new OriginalVariable(selectedOption.id, selectedOption.variable, selectedOption.datatype, selectedOption.description, [], [], this.props.rootStore.staticMappers[selectedOption.id], selectedOption.source, "clinical"));
            }
            else {
                variables.push(this.props.variableManagerStore.getById(selectedOption));
            }
        });
        return variables;
    }

    /**
     * gets all on-demand variables
     * @return {OriginalVariable[]}
     */
    getOnDemandVariables() {
        const mappingTypes = this.state.mutationOptions.filter(d => d.selected).map(d => d.id);
        const profiles = this.state.molecularOptions.filter(d => d.selected).map(d => d.profile);
        return this.props.rootStore.molProfileMapping.getMultipleProfiles(profiles, mappingTypes);
    }

    /**
     * gets all existing derived variables
     * @return {any[]}
     */
    getDerivedVariables(){
        return Object.keys(this.props.variableManagerStore.referencedVariables).map(id => this.props.variableManagerStore.referencedVariables[id])
            .filter(d=> d.derived)
    }

    /**
     * gets all variables that can be explored
     * @return {any[]}
     */
    getAllVariables(){
        return this.getDerivedVariables().concat(...this.getClinicalVariables()).concat(...this.getOnDemandVariables());

    }

    resetSelected() {
        this.setState({ clinicalOptions: [] });
        this.setState({ geneListString: "", showCheckBoxOptions: false });


    }

    render() {
        let formGroups = [];
        if (this.props.rootStore.clinicalSampleCategories.length > 0 || this.props.rootStore.clinicalPatientCategories.length > 0) {
            formGroups.push(<FormGroup key={"clinical"}>
                <Col componentClass={ControlLabel} sm={2}>
                    Variables
                </Col>
                <Col sm={10}>
                    <SelectAll
                        allowSelectAll
                        value={this.state.clinicalOptions}
                        type="text"
                        searchable
                        isMulti
                        componentClass="select"
                        placeholder="Select..."
                        searchPlaceholder="Search variable"
                        options={this.createOptions()}
                        onChange={this.handleOptionSelect}
                    />
                </Col>


            </FormGroup>);
        }
        if (this.props.rootStore.availableProfiles.length > 0) {
            formGroups.push(<FormGroup key={"genetic"}>
                <Col componentClass={ControlLabel} sm={2}>
                    Find gene
                </Col>
                <Col sm={10}>
                    <FormControl style={{ height: 38 }} type="textarea"
                                 placeholder={"Enter one or multiple HUGO Gene Symbols (e.g. TP53 IDH1)"}
                                 onChange={this.updateSearchValue}
                                 onKeyDown={this.handleEnterPressed}
                                 value={this.state.geneListString}/>
                </Col>
            </FormGroup>);
        }
        return (<div>
            <h4>Select Variable
                <Button bsSize="xsmall" onClick={this.showVariabilityScores}
                        style={{ "marginLeft": "25px" }}
                    //disabled={this.props.uiStore.globalTime || this.props.rootStore.dataStore.variableStores.between.currentVariables.length > 0}
                        key={"vScores"}>
                    {(this.state.vscore) ? "Hide variability scores" : "Show variability scores"}
                </Button>
            </h4>
            {this.renderVariability()}
            <Form horizontal>
                {formGroups}
                {this.state.showCheckBoxOptions ? this.getAvailableCheckBoxes() : null}
                <ButtonToolbar>
                    <Button className="pull-right"
                            onClick={() => this.setState({ modalIsOpen: true })}
                            key={"explore"}>
                        Explore
                    </Button>
                    <Button className="pull-right"
                            onClick={this.addVariables}
                            key={"add"}>
                        Add
                    </Button>
                </ButtonToolbar>
            </Form>
            <ExploreVariables close={() => this.setState({ modalIsOpen: false })}
                              reset={this.resetSelected}
                              availableCategories={this.props.availableCategories}
                              variables={this.getAllVariables()}
                              modalIsOpen={this.state.modalIsOpen}/>
        </div>)
    }
}));
export default TimepointVariableSelector;
