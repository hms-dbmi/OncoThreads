import React from "react";
import {inject, observer} from "mobx-react";
import Select from 'react-select';
import {Button, Col, Form, FormControl, FormGroup, Grid, Panel, Row, Tab, Tabs} from "react-bootstrap";
import StudySummary from "./StudySummary";
import FontAwesome from 'react-fontawesome';


/*
 * View if no study has been loaded
 */
const DefaultView = inject("rootStore", "undoRedoStore")(observer(class DefaultView extends React.Component {
    constructor() {
        super();
        this.getStudy = this.getStudy.bind(this);
        this.state = {studyClicked: false, CNVisDiscrete: false, selectedTab: "cBio", numCNVFiles: 0};
        this.handleSelectTab = this.handleSelectTab.bind(this);
        this.displayStudy = this.displayStudy.bind(this);
        this.handleEventsLoad = this.handleEventsLoad.bind(this);
        this.handleClinicalSampleLoad = this.handleClinicalSampleLoad.bind(this);
        this.handleClinicalPatientLoad = this.handleClinicalPatientLoad.bind(this);
        this.handleMutationsLoad = this.handleMutationsLoad.bind(this);
        this.handleExpressionsLoad = this.handleExpressionsLoad.bind(this);
        this.handleCNVLoad = this.handleCNVLoad.bind(this);
    }

    handleSelectTab(key) {
        this.props.rootStore.setIsOwnData(key !== 'cBio');
        this.setState({selectedTab: key, studyClicked: false});
    }

    /**
     * selects a study
     * @param selectedOption
     */
    getStudy(selectedOption) {
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


    handleEventsLoad(e) {
        this.props.rootStore.setIsOwnData(true);
        this.props.rootStore.localFileLoader.setEventFiles(e.target.files, () => {
            this.props.rootStore.parseTimeline(null, () => {
            });
        });
    }

    handleClinicalSampleLoad(e) {
        this.props.rootStore.localFileLoader.setClinicalFile(e.target.files[0], true)
    }

    handleClinicalPatientLoad(e) {
        this.props.rootStore.localFileLoader.setClinicalFile(e.target.files[0], false)
    }

    handleMutationsLoad(e) {
        this.props.rootStore.localFileLoader.setMutations(e.target.files[0])
    }

    handleExpressionsLoad(e) {
        this.props.rootStore.localFileLoader.setExpressions(e.target.files)
    }

    handleCNVLoad(e) {
        this.props.rootStore.localFileLoader.setCNVs(e.target.files, "DISCRETE")
    }

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

    render() {
        let launchDisabled = true;
        if (this.props.rootStore.isOwnData) {
            if (this.props.rootStore.localFileLoader.eventsParsed === "finished") {
                if (this.props.rootStore.localFileLoader.clinicalPatientParsed === "finished" || this.props.rootStore.localFileLoader.clinicalSampleParsed === "finished" || this.props.rootStore.localFileLoader.mutationsParsed === "finished") {
                    launchDisabled = false
                }
            }
        }
        else {
            if (this.props.rootStore.timelineParsed) {
                launchDisabled = false;
            }
        }
        return (
            <Grid>
                <Row>
                    <Col xs={6} xsOffset={3}>
                        <Tabs activeKey={this.state.selectedTab}
                              id="controlled-tab"
                              animation={false}
                              onSelect={this.handleSelectTab}>
                            <Tab eventKey={"cBio"} title={"Load cBio dataset"}>
                                <Select
                                    type="text"
                                    searchable={true}
                                    componentClass="select" placeholder="Select Study"
                                    options={this.setOptions()}
                                    onChange={this.getStudy}
                                />
                            </Tab>
                            <Tab eventKey={"own"} title={"Load own dataset"}>
                                <Form horizontal>
                                    <h4>Required files</h4>
                                    <FormGroup>
                                        <Col sm={4}>
                                            Timeline {DefaultView.getStateIcon(this.props.rootStore.localFileLoader.eventsParsed)}
                                        </Col>
                                        <Col sm={8}>
                                            <FormControl type="file"
                                                         label="File"
                                                         multiple={true}
                                                         onChange={this.handleEventsLoad}/>
                                        </Col>
                                    </FormGroup>
                                    <h4>At least one required</h4>
                                    <FormGroup>
                                        <Col sm={4}>
                                            Clinical Sample
                                            Data {DefaultView.getStateIcon(this.props.rootStore.localFileLoader.clinicalSampleParsed)}
                                        </Col>
                                        <Col sm={8}>
                                            <FormControl type="file"
                                                         label="File"
                                                         onChange={this.handleClinicalSampleLoad}/>
                                        </Col>
                                    </FormGroup>
                                    <FormGroup>
                                        <Col sm={4}>
                                            Clinical Patient
                                            Data {DefaultView.getStateIcon(this.props.rootStore.localFileLoader.clinicalPatientParsed)}
                                        </Col>
                                        <Col sm={8}>
                                            <FormControl type="file"
                                                         label="File"
                                                         onChange={this.handleClinicalPatientLoad}/>
                                        </Col>
                                    </FormGroup>
                                    <FormGroup>
                                        <Col sm={4}>
                                            Mutations {DefaultView.getStateIcon(this.props.rootStore.localFileLoader.mutationsParsed)}
                                        </Col>
                                        <Col sm={8}>
                                            <FormControl type="file"
                                                         label="File"
                                                         onChange={this.handleMutationsLoad}/>
                                        </Col>
                                    </FormGroup>
                                    <h4>Optional files</h4>
                                    <FormGroup>
                                        <Col sm={4}>
                                            Expression {DefaultView.getStateIcon(this.props.rootStore.localFileLoader.expressionsParsed)}
                                        </Col>
                                        <Col sm={8}>
                                            <FormControl type="file"
                                                         label="File"
                                                         multiple={true}
                                                         onChange={this.handleExpressionsLoad}/>
                                        </Col>
                                    </FormGroup>
                                    <FormGroup>
                                        <Col sm={4}>
                                            Copy Number
                                            variation {DefaultView.getStateIcon(this.props.rootStore.localFileLoader.cnvsParsed)}
                                        </Col>
                                        <Col sm={8}>
                                            <FormControl type="file"
                                                         label="File"
                                                         multiple={true}
                                                         onChange={this.handleCNVLoad}/>
                                        </Col>
                                    </FormGroup>
                                </Form>
                            </Tab>
                        </Tabs>
                        {this.getStudyInfo()}
                        <Button
                            disabled={launchDisabled}
                            onClick={this.displayStudy}>Launch</Button>
                    </Col>

                </Row>
            </Grid>
        );
    }
}));
export default DefaultView;
