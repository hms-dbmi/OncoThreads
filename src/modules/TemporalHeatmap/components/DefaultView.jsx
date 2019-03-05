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
        this.props.rootStore.parseTimeline(this.props.studies.filter(d => d.studyId === selectedOption.value)[0], () => {
        });
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
            this.props.rootStore.parseTimeline(null, () => {
                this.props.rootStore.parseCBio(() => {
                    this.props.undoRedoStore.saveLoadHistory("own data");
                })
            });
        }
        else {
            this.props.rootStore.parseCBio(() => {
                this.props.undoRedoStore.saveLoadHistory(this.props.rootStore.study.name);
            });

        }

    }

    /**
     * gets information about study
     * @returns {*}
     */
    getStudyInfo() {
        let info = null;
        if (this.props.rootStore.timelineParsed) {
            info = <div><Panel>
                <Panel.Heading>
                    <Panel.Title>
                        Study information
                    </Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                    <StudySummary/>
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
        this.props.rootStore.localFileLoader.setSpecimenFile(e.target.files[0], () => {
            this.props.rootStore.parseTimeline(null, () => {
            });
        });
    }

    handleClinicalSampleLoad(e) {
        this.props.rootStore.setIsOwnData(true);
        this.props.rootStore.localFileLoader.setClinicalFile(e.target.files[0], true)
    }

    handleClinicalPatientLoad(e) {
        this.props.rootStore.setIsOwnData(true);
        this.props.rootStore.localFileLoader.setClinicalFile(e.target.files[0], false)
    }

    render() {
        let launchDisabled=true;
        if(this.props.rootStore.isOwnData){
            if(this.props.rootStore.localFileLoader.specimenParsed){
                if(this.props.rootStore.localFileLoader.clinicalPatientParsed||this.props.rootStore.localFileLoader.clinicalSampleParsed){
                    launchDisabled=false
                }
            }
        }
        else{
            if(this.props.rootStore.timelineParsed){
                launchDisabled=false;
            }
        }
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
                {this.getStudyInfo()}
                <Button
                    disabled={launchDisabled}
                    onClick={this.displayStudy}>Launch</Button>
            </div>
        );
    }
}));
export default DefaultView;
