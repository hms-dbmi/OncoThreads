import React from "react";
import {inject, observer} from "mobx-react";
import Select from 'react-select';
import {Button, Col, Form, FormControl, FormGroup, Grid, HelpBlock, Panel, Row, Tab, Tabs} from "react-bootstrap";
import StudySummary from "./StudySummary";
import FontAwesome from 'react-fontawesome';
import SelectDatatype from "./Modals/SelectDatatype";
import uuidv4 from 'uuid/v4';


/*
 * Component for view if no study has been loaded used for selection of studies from cBio or own data sets
 */
const DefaultView = inject("rootStore", "undoRedoStore")(observer(class DefaultView extends React.Component {
    constructor() {
        super();
        this.getStudy = this.getStudy.bind(this);
        this.state = {
            selectedStudy: null,
            selectedTab: "cBio",
            callback: null,
            modalIsOpen: false,
            fileType: "",
            fileNames: [],
            datatypes: [],
        };
        // random keys for file inputs used for reset (inputs are reset if key changes)
        this.timelineKey = uuidv4();
        this.clinicalPatientKey = uuidv4();
        this.clinicalSampleKey = uuidv4();
        this.mutationKey = uuidv4();
        this.molecularKey = uuidv4();
        this.handleSelectTab = this.handleSelectTab.bind(this);
        this.displayStudy = this.displayStudy.bind(this);
        this.handleEventsLoad = this.handleEventsLoad.bind(this);
        this.handleClinicalSampleLoad = this.handleClinicalSampleLoad.bind(this);
        this.handleClinicalPatientLoad = this.handleClinicalPatientLoad.bind(this);
        this.handleMutationsLoad = this.handleMutationsLoad.bind(this);
        this.handleExpressionsLoad = this.handleExpressionsLoad.bind(this);
        this.handleMolecularLoad = this.handleMolecularLoad.bind(this);
        this.setDatatype = this.setDatatype.bind(this);
    }

    /**
     * handle click on tab
     * @param {string} key
     */
    handleSelectTab(key) {
        this.props.rootStore.setIsOwnData(key !== 'cBio');
        if (key === 'cBio') {
            if (this.state.selectedStudy !== null) {
                this.props.rootStore.parseTimeline(this.props.studies.filter(d => d.studyId === this.state.selectedStudy)[0], () => {
                });
            }
        }
        else {
            if (this.props.rootStore.localFileLoader.eventsParsed) {
                this.props.rootStore.parseTimeline(null, () => {
                });
            }
        }
        this.setState({selectedTab: key});
    }

    /**
     * selects a study
     * @param {Object} selectedOption
     */
    getStudy(selectedOption) {
        this.setState({selectedStudy: selectedOption.value});
        this.props.rootStore.parseTimeline(this.props.studies.filter(d => d.studyId === selectedOption.value)[0], () => {
        });
    }

    /**
     * creates different options for study selection
     * @returns {Object[]}
     */
    setOptions() {
        let options = [];
        this.props.studies.forEach(function (d, i) {
            options.push({value: d.studyId, label: d.name});
        });
        return options;
    }

    /**
     * initiates data parsing
     */
    displayStudy() {
        this.props.rootStore.parseCBio(() => {
            if (this.props.rootStore.isOwnData) {
                this.props.undoRedoStore.saveLoadHistory("own data");
            }
            else {
                this.props.undoRedoStore.saveLoadHistory(this.props.rootStore.study.name);
            }
        });
    }

    /**
     * gets information about study
     * @returns {Component}
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
        else if ((this.state.selectedStudy !== null && !this.props.rootStore.isOwnData)
            || (this.props.rootStore.isOwnData && this.props.rootStore.localFileLoader.eventsParsed === "loading")) {
            info = <div className="smallLoader"/>
        }
        return info;
    }

    /**
     * handles selection of event files
     * @param {event} e
     */
    handleEventsLoad(e) {
        if (e.target.files.length > 0) {
            this.props.rootStore.localFileLoader.setEventFiles(e.target.files, () => {
                this.props.rootStore.parseTimeline(null, () => {
                });
            });
        }
        else {
            this.props.rootStore.localFileLoader.setEventsParsed("empty");
        }
    }

    /**
     * handles selection of clinical sample specific file
     * @param {event} e
     */
    handleClinicalSampleLoad(e) {
        if (e.target.files.length > 0) {
            this.props.rootStore.localFileLoader.setClinicalFile(e.target.files[0], true)
        }
        else {
            this.props.rootStore.localFileLoader.setClinicalSampleParsed("empty");
        }
    }

    /**
     * handles selection of clinical patient specific file
     * @param {event} e
     */
    handleClinicalPatientLoad(e) {
        if (e.target.files.length > 0) {
            this.props.rootStore.localFileLoader.setClinicalFile(e.target.files[0], false)
        }
        else {
            this.props.rootStore.localFileLoader.setClinicalPatientParsed("empty");
        }
    }

    /**
     * handles selection of mutation file
     * @param {event} e
     */
    handleMutationsLoad(e) {
        if (e.target.files.length > 0) {
            this.props.rootStore.localFileLoader.setMutations(e.target.files[0])
        }
        else {
            this.props.rootStore.localFileLoader.setMutationsParsed("empty");
        }
    }

    /**
     * handles selection of expression data files
     * @param {event} e
     */
    handleExpressionsLoad(e) {
        if (e.target.files.length > 0) {
            this.props.rootStore.localFileLoader.setExpressions(e.target.files)
        }
        else {
            this.props.rootStore.localFileLoader.setExpressionsParsed("empty");
        }
    }

    /**
     * sets datatypes of currently selected files
     * @param {number} index
     * @param {string} alterationType
     * @param {string} datatype
     */
    setDatatype(index, datatype, alterationType) {
        let datatypes = this.state.datatypes.slice();
        datatypes[index] = {alterationType: alterationType, datatype: datatype};
        this.setState({datatypes: datatypes});
    }

    /**
     * opens modal for datatype selection
     * @param {FileList} files
     * @param {Function} callback
     */
    openModal(files, callback) {
        this.setState({
            modalIsOpen: true,
            fileType: "CNV",
            datatypes: Array.from(files).map(() => {
                return {alterationType: "ANY", datatype: "CONTINUOUS"}
            }),
            fileNames: Array.from(files).map(d => d.name),
            callback: callback
        })
    }

    /**
     * handles selection of CNV files
     * @param {event} e
     */
    handleMolecularLoad(e) {
        e.persist();
        if (e.target.files.length > 0) {
            this.openModal(e.target.files, (setFiles) => {
                if (setFiles) {
                    this.props.rootStore.localFileLoader.setMolecularFiles(e.target.files, this.state.datatypes);
                }
                else {
                    e.target.value = null;
                }
            });
        }
        else {
            this.props.rootStore.localFileLoader.setMolecularParsed("empty");
        }
    }

    /**
     * gets the icon corresponding to the current laoding state
     * @param {string} value - loading, error, finished or empty
     * @returns {FontAwesome}
     */
    static getStateIcon(value) {
        let icon = null;
        if (value === "finished") {
            icon = <FontAwesome name={"check"} style={{color: "green"}}/>;
        }
        else if (value === "loading") {
            icon = <FontAwesome name={"spinner"} spin style={{color: "gray"}}/>;
        }
        else if (value === "error") {
            icon = <FontAwesome name={"times"} style={{color: "red"}}/>;
        }
        return icon;
    }

    /**
     * updates keys of file inputs in order to reset them when the reset button is clicked.
     * file inputs can only be uncontrolled and therefore cannot be reset in a "react" way
     */
    updateKeys() {
        if (this.props.rootStore.localFileLoader.eventsParsed === "empty") {
            this.timelineKey = uuidv4();
        }
        if (this.props.rootStore.localFileLoader.clinicalSampleParsed === "empty") {
            this.clinicalSampleKey = uuidv4();
        }
        if (this.props.rootStore.localFileLoader.clinicalPatientParsed === "empty") {
            this.clinicalPatientKey = uuidv4();
        }
        if (this.props.rootStore.localFileLoader.mutationsParsed === "empty") {
            this.mutationKey = uuidv4();
        }
        if (this.props.rootStore.localFileLoader.molecularParsed === "empty") {
            this.molecularKey = uuidv4();
        }
    }


    render() {
        // check if data is ready
        let launchDisabled = true;
        if (this.props.rootStore.isOwnData) {
            launchDisabled = !this.props.rootStore.localFileLoader.dataReady;
        }
        else {
            launchDisabled = !this.props.rootStore.timelineParsed;
        }
        this.updateKeys();

        return (
            <Grid>
                <Row>
                    <Col xs={8} xsOffset={2}>
                        <Tabs activeKey={this.state.selectedTab}
                              id="controlled-tab"
                              animation={false}
                              onSelect={this.handleSelectTab}>
                            <Tab eventKey={"cBio"} title={"Load cBio dataset"}>
                                <div style={{marginTop: "10px", marginBottom: "10px"}}>
                                    <Select
                                        type="text"
                                        searchable={true}
                                        componentClass="select" placeholder="Select Study"
                                        options={this.setOptions()}
                                        onChange={this.getStudy}
                                    />
                                </div>
                            </Tab>
                            <Tab eventKey={"own"} title={"Load own dataset"}>
                                {this.props.rootStore.geneNamesAPI.geneListLoaded ? <Form horizontal>
                                    <h4>Required files</h4>
                                    <FormGroup>
                                        <Col sm={5}>
                                            Timeline {DefaultView.getStateIcon(this.props.rootStore.localFileLoader.eventsParsed)}
                                        </Col>
                                        <Col sm={6}>
                                            <FormControl
                                                type="file"
                                                key={this.timelineKey}
                                                label="File"
                                                multiple={true}
                                                onChange={this.handleEventsLoad}/>
                                        </Col>
                                        <Col sm={1}>
                                            <div
                                                style={{visibility: this.props.rootStore.localFileLoader.eventsParsed === "empty" ? "hidden" : "visible"}}>
                                                <FontAwesome name={"times"}
                                                             onClick={() => this.props.rootStore.localFileLoader.setEventsParsed("empty")}/>
                                            </div>
                                        </Col>
                                    </FormGroup>
                                    <h4>At least one required</h4>
                                    <FormGroup>
                                        <Col sm={5}>
                                            Clinical Sample
                                            Data {DefaultView.getStateIcon(this.props.rootStore.localFileLoader.clinicalSampleParsed)}
                                        </Col>
                                        <Col sm={6}>
                                            <FormControl type="file"
                                                         key={this.clinicalSampleKey}
                                                         label="File"
                                                         onChange={this.handleClinicalSampleLoad}/>
                                        </Col>
                                        <Col sm={1}>
                                            <div
                                                style={{visibility: this.props.rootStore.localFileLoader.clinicalSampleParsed === "empty" ? "hidden" : "visible"}}>
                                                <FontAwesome name={"times"}
                                                             onClick={() => this.props.rootStore.localFileLoader.setClinicalSampleParsed("empty")}/>
                                            </div>
                                        </Col>
                                    </FormGroup>
                                    <FormGroup>
                                        <Col sm={5}>
                                            Clinical Patient
                                            Data {DefaultView.getStateIcon(this.props.rootStore.localFileLoader.clinicalPatientParsed)}
                                        </Col>
                                        <Col sm={6}>
                                            <FormControl type="file"
                                                         key={this.clinicalPatientKey}
                                                         label="File"
                                                         onChange={this.handleClinicalPatientLoad}/>
                                        </Col>
                                        <Col sm={1}>
                                            <div
                                                style={{visibility: this.props.rootStore.localFileLoader.clinicalPatientParsed === "empty" ? "hidden" : "visible"}}>
                                                <FontAwesome name={"times"}
                                                             onClick={() => this.props.rootStore.localFileLoader.setClinicalPatientParsed("empty")}/>
                                            </div>
                                        </Col>
                                    </FormGroup>
                                    <FormGroup>
                                        <Col sm={5}>
                                            Mutations {DefaultView.getStateIcon(this.props.rootStore.localFileLoader.mutationsParsed)}
                                        </Col>
                                        <Col sm={6}>
                                            <FormControl type="file"
                                                         key={this.mutationKey}
                                                         label="File"
                                                         onChange={this.handleMutationsLoad}/>
                                        </Col>
                                        <Col sm={1}>
                                            <div
                                                style={{visibility: this.props.rootStore.localFileLoader.mutationsParsed === "empty" ? "hidden" : "visible"}}>
                                                <FontAwesome name={"times"}
                                                             onClick={() => this.props.rootStore.localFileLoader.setMutationsParsed("empty")}/>
                                            </div>
                                        </Col>
                                    </FormGroup>
                                    <h4>Optional files</h4>
                                    <FormGroup>
                                        <Col sm={5}>
                                            Other
                                            files {DefaultView.getStateIcon(this.props.rootStore.localFileLoader.molecularParsed)}
                                        </Col>
                                        <Col sm={6}>
                                            <FormControl type="file"
                                                         key={this.molecularKey}
                                                         label="File"
                                                         multiple={true}
                                                         onChange={this.handleMolecularLoad}/>
                                            <HelpBlock>Expression data, cnv data, protein levels, methylation
                                                data</HelpBlock>
                                        </Col>
                                        <Col sm={1}>
                                            <div
                                                style={{visibility: this.props.rootStore.localFileLoader.molecularParsed === "empty" ? "hidden" : "visible"}}>
                                                <FontAwesome name={"times"}
                                                             onClick={() => this.props.rootStore.localFileLoader.setMolecularParsed("empty")}/>
                                            </div>
                                        </Col>
                                    </FormGroup>
                                </Form> : <div><FontAwesome name={"spinner"} spin style={{color: "gray"}}/></div>}
                            </Tab>
                        </Tabs>
                        {this.getStudyInfo()}
                        <Button
                            disabled={launchDisabled}
                            onClick={this.displayStudy}>Launch</Button>
                    </Col>
                </Row>
                <SelectDatatype modalIsOpen={this.state.modalIsOpen} type={this.state.fileType}
                                fileNames={this.state.fileNames}
                                datatypes={this.state.datatypes}
                                setDatatype={this.setDatatype}
                                callback={this.state.callback}
                                closeModal={() => this.setState({modalIsOpen: false})}/>
            </Grid>
        );
    }
}));
export default DefaultView;
