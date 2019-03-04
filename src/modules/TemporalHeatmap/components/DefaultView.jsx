import React from "react";
import {inject, observer} from "mobx-react";
import Select from 'react-select';
import {Button, ControlLabel, FormControl, FormGroup, Panel} from "react-bootstrap";
import StudySummary from "./StudySummary";
import FontAwesome from 'react-fontawesome';


/*
 * View if no study has been loaded
 */
const DefaultView = inject("rootStore", "undoRedoStore")(observer(class DefaultView extends React.Component {
    constructor() {
        super();
        this.getStudy = this.getStudy.bind(this);
        this.state = {studyClicked: false,};
        this.displayStudy = this.displayStudy.bind(this);
        this.handleSpecimenLoad = this.handleSpecimenLoad.bind(this);
        this.handleClinicalSampleLoad = this.handleClinicalSampleLoad.bind(this);
        this.handleClinicalPatientLoad = this.handleClinicalPatientLoad.bind(this);
    }

    /**
     * selects a study
     * @param selectedOption
     */
    getStudy(selectedOption) {
        this.props.rootStore.setIsOwnData(false);
        this.setState({studyClicked: true});
        this.props.rootStore.study = this.props.studies.filter(d => d.studyId === selectedOption.value)[0];
        this.props.rootStore.parseCBio(this.props.rootStore.study);

    }

    /**
     * creates different options for study selection
     * @returns {Array}
     */
    setOptions() {
        let options = [];
        this.props.studies.forEach(function (d, i) {
            options.push({value: d.studyId, label: d.name});
        });
        return options;
    }

    displayStudy() {
        if (this.props.rootStore.isOwnData) {
            this.props.rootStore.parseCBio(this.props.rootStore.study);
            this.props.undoRedoStore.saveLoadHistory("own data");
        }
        else {
            this.props.undoRedoStore.saveLoadHistory(this.props.rootStore.study.name);
        }
        this.props.rootStore.display = true;
        this.props.rootStore.firstLoad = false;
    }

    /**
     * gets information about study
     * @returns {*}
     */
    getStudyInfo() {
        let info = null;
        if (this.props.rootStore.parsed) {
            info = <div><Panel>
                <Panel.Heading>
                    <Panel.Title>
                        Study information
                    </Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                    <StudySummary studyName={this.props.rootStore.study.name}
                                  studyDescription={this.props.rootStore.study.description}
                                  studyCitation={this.props.rootStore.study.citation}
                                  numPatients={this.props.rootStore.patients.length}
                                  minTP={this.props.rootStore.minTP}
                                  maxTP={this.props.rootStore.maxTP}/>
                </Panel.Body>
            </Panel>
            </div>

        }
        else if (this.state.studyClicked) {
            info = <div className="smallLoader"/>
        }
        return info;
    }

    handleSpecimenLoad(e) {
        this.props.rootStore.setIsOwnData(true);
        this.props.rootStore.localFileLoader.loadSpecimenFile(e.target.files[0])
    }

    handleClinicalSampleLoad(e) {
        this.props.rootStore.setIsOwnData(true);
        this.props.rootStore.localFileLoader.loadClinicalFile(e.target.files[0], true)
    }

    handleClinicalPatientLoad(e) {
        this.props.rootStore.setIsOwnData(true);
        this.props.rootStore.localFileLoader.loadClinicalFile(e.target.files[0], false)
    }

    render() {
        let launchDisabled = !this.props.rootStore.parsed && !(this.props.rootStore.localFileLoader.specimenParsed && (this.props.rootStore.localFileLoader.clinicalPatientParsed || this.props.rootStore.localFileLoader.clinicalSampleParsed));
        return (
            <div className="defaultView">
                <h2>Load cBio data</h2>
                <Select
                    type="text"
                    searchable={true}
                    componentClass="select" placeholder="Select Study"
                    options={this.setOptions()}
                    onChange={this.getStudy}
                />
                {this.getStudyInfo()}
                <h2>Load own data</h2>
                <form>
                    <FormGroup>
                        <ControlLabel>Specimen Timeline File</ControlLabel>
                        <FormControl type="file"
                                     label="File"
                                     onChange={this.handleSpecimenLoad}
                                     help="Example block-level help text here."/>
                        {this.props.rootStore.localFileLoader.specimenParsed ?
                            <FontAwesome name={"check"}/> : ""}

                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Clinical Sample Data File</ControlLabel>
                        <FormControl type="file"
                                     label="File"
                                     onChange={this.handleClinicalSampleLoad}
                                     help="Example block-level help text here."/>
                        {this.props.rootStore.localFileLoader.clinicalSampleParsed ?
                            <FontAwesome name={"check"}/> : ""}

                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Clinical Patient Data File</ControlLabel>
                        <FormControl type="file"
                                     label="File"
                                     onChange={this.handleClinicalPatientLoad}
                                     help="Example block-level help text here."/>
                        {this.props.rootStore.localFileLoader.clinicalPatientParsed ?
                            <FontAwesome name={"check"}/> : ""}

                    </FormGroup>
                </form>
                <Button
                    disabled={launchDisabled}
                    onClick={this.displayStudy}>Launch</Button>
            </div>
        );
    }
}));
export default DefaultView;
