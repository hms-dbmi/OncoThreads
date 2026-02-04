import React from 'react';
import { inject, observer } from 'mobx-react';
import Select from 'react-select';
import {
    Alert,
    Button,
    Card,
    Col,
    Container,
    Form,
    InputGroup,
    Nav,
    Row,
    Tab,
    Tabs,
} from 'react-bootstrap';
import { makeObservable, observable } from 'mobx';
import StudySummary from '../StudySummary';
import LocalFileSelection from './LocalFileSelection';


/*
 * Component for view if no study has been loaded
 * used for selection of studies from cBio or own data sets
 */
const DefaultView = inject('rootStore', 'undoRedoStore', 'uiStore')(observer(class DefaultView extends React.Component {
    selectedStudy = null;
    selectedTab = 'cBio';
    ownInstanceURL = '';

    constructor(props) {
        super(props);
        makeObservable(this, {
            selectedStudy: observable,
            selectedTab: observable,
            ownInstanceURL: observable,
        });
        this.handleSelectTab = this.handleSelectTab.bind(this);
        this.displayStudy = this.displayStudy.bind(this);
        this.selectInstance = this.selectInstance.bind(this);
        this.handleInstanceChange = this.handleInstanceChange.bind(this);
    }

    /**
     * selects a study
     * @param {Object} selectedOption
     */
    getStudy(selectedOption) {
        this.selectedStudy = selectedOption;
        this.props.rootStore.parseTimeline(this.props.rootStore.studyAPI.studies
            .filter((d) => d.studyId === selectedOption.value)[0], () => {
        });
    }

    /**
     * creates different options for study selection
     * @returns {Object[]}
     */
    setOptions() {
        const options = [];
        this.props.rootStore.studyAPI.studies.forEach((d) => {
            options.push({ value: d.studyId, label: d.name });
        });
        return options;
    }


    /**
     * gets information about study
     * @returns {Component}
     */
    getStudyInfo() {
        let info = null;
        if (this.selectedStudy !== null && this.props.rootStore.timelineParsed
            && (!this.props.rootStore.isOwnData || this.props.rootStore.localFileLoader.eventsParsed === 'finished')) {
            info = (
                <div>
                    <Card>
                        <Card.Header>
                            Study information
                        </Card.Header>
                        <Card.Body>
                            <StudySummary />
                        </Card.Body>
                    </Card>
                </div>
            );
        } else if ((this.selectedStudy !== null && !this.props.rootStore.isOwnData)
            || (this.props.rootStore.isOwnData && this.props.rootStore.localFileLoader.eventsParsed === 'loading')) {
            info = <div className="smallLoader" />;
        }
        return info;
    }

    /**
     * handle click on tab
     * @param {string} key
     */
    handleSelectTab(key) {
        this.props.rootStore.setIsOwnData(key !== 'cBio');
        if (key === 'cBio') {
            if (this.selectedStudy !== null) {
                this.props.rootStore.parseTimeline(this.props.rootStore.studyAPI.studies
                    .filter((d) => d.studyId === this.selectedStudy.value)[0], () => {
                });
            }
        } else if (this.props.rootStore.localFileLoader.eventsParsed) {
            this.props.rootStore.parseTimeline(null, () => {
            });
        }
        this.selectedTab = key;
    }

    /**
     * initiates data parsing
     */
    displayStudy() {
        this.props.rootStore.parseCBio(() => {
            if (this.props.rootStore.isOwnData) {
                this.props.undoRedoStore.saveLoadHistory('own data');
            } else {
                this.props.undoRedoStore.saveLoadHistory(this.props.rootStore.study.name);
            }
        });
    }

    handleInstanceChange(e) {
        this.selectedStudy = null;
        this.props.uiStore.setCBioInstance(e.target.value);
    }

    /**
     * gets content for default view
     * */
    getDefaultViewContent() {
        let instanceTextfield = null;
        let connected = null;
        let placeHoplderText="Select Study";
        if (this.props.uiStore.cBioInstance === 'own') {
            placeHoplderText= "Connect to a cBioPortal instance to load study list";
            instanceTextfield = (
                <Form.Group>
                    <Form.Label>

                    Enter URL for cBioPortal (e.g. 'http://www.cbioportal.org')
                    </Form.Label>
                    
                    <InputGroup>
                        <Form.Control as="textarea" rows={1}
                            value={this.ownInstanceURL}
                            onChange={(e) => {
                                this.ownInstanceURL = e.target.value;
                            }}
                            type="url"
                        />
                        
                    </InputGroup>

                      <br></br>      
                    <Form.Label>
                            
                        Enter access token for password-protected instances of cBioPortal  <a href="https://docs.cbioportal.org/2.2-authorization-and-authentication/authenticating-users-via-tokens#using-data-access-tokens" >(instructions to find token)</a>
                    </Form.Label>

                    <InputGroup>

                        
                        <Form.Control as="textarea" rows={1} 
                            
                            onChange={(e) => {
                                console.log("new token:" + e.target.value);
                                this.props.rootStore.studyAPI.accessTokenFromUser=e.target.value;
                            }}
                            
                        />
                        
                    </InputGroup>

                    <br></br>  

                    <Button variant="primary" onClick={this.selectInstance}>
                        Connect
                    </Button>   

                </Form.Group>
            );
        }

        if (this.props.rootStore.studyAPI.connectionStatus[this.props.uiStore.cBioInstance] === 'failed') {
            connected = <Alert variant="warning">Connection failed: {this.props.rootStore.studyAPI.errorMsg}</Alert>;
        } else if (this.props.rootStore.studyAPI.connectionStatus[this.props.uiStore.cBioInstance] === 'success') {
            placeHoplderText="Select Study";
            connected = <Alert>Successfully connected</Alert>;
        }

        return (
            <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                {instanceTextfield}
                {connected}
                <Form.Label>
                    Select study
                </Form.Label>
                <Select
                    type="text"
                    searchable
                    isDisabled={this.props.rootStore.studyAPI.connectionStatus[this.props.uiStore.cBioInstance] !== 'success'}
                    componentClass="select"
                    placeholder={placeHoplderText}//"Connect to a cBioPortal instance to load study list"//"Select Study"
                    value={this.selectedStudy}
                    options={this.setOptions()}
                    onChange={this.getStudy}
                />
            </div>
        );
    }

    /**
     * selects own instance and loads studies
     * */
    selectInstance() {
        this.props.rootStore.studyAPI.loadOwnInstanceStudies(this.ownInstanceURL);
    }


    render() {
        // check if data is ready
        let launchDisabled = true;
        if (this.props.rootStore.isOwnData) {
            launchDisabled = !this.props.rootStore.localFileLoader.dataReady;
        } else {
            launchDisabled = !this.props.rootStore.timelineParsed;
        }
        return (
            <Container>
                <Row>
                    <Col xs={8} md={{ span: 8, offset: 2 }}>
                        <Tabs
                            activeKey={this.selectedTab}
                            id="controlled-tab"
                            onSelect={this.handleSelectTab}
                        >
                            <Tab eventKey="cBio" title="Load data from cBioPortal">
                                <form>
                                    <Form.Group>
                                        <Form.Check
                                            type="radio"
                                            name="linkSelect"
                                            value="hack"
                                            checked={this.props.uiStore.cBioInstance === 'hack'}
                                            onChange={this.handleInstanceChange}
                                            inline
                                            label="cBioPortal for ThreadStates"
                                        />
                                        {' '}
                                        <Form.Check
                                            type="radio"
                                            name="linkSelect"
                                            value="own"
                                            checked={this.props.uiStore.cBioInstance === 'own'}
                                            onChange={this.handleInstanceChange}
                                            inline
                                            label="Custom cBioPortal"
                                        />
                                        {' '}
                                    </Form.Group>
                                </form>
                                {this.getDefaultViewContent()}
                            </Tab>
                            <Tab eventKey="own" title="Load data from files">
                                <LocalFileSelection />
                            </Tab>
                        </Tabs>
                        {this.getStudyInfo()}
                        <Button
                            disabled={launchDisabled}
                            onClick={this.displayStudy}
                        >
                            Launch
                        </Button>
                    </Col>
                </Row>
            </Container>
        );
    }
}));
export default DefaultView;
