import React from 'react';
import { inject, observer } from 'mobx-react';
import Select from 'react-select';
import { Button, Col, FormGroup, Grid, Panel, Radio, Row, Tab, Tabs } from 'react-bootstrap';
import { extendObservable } from 'mobx';
import StudySummary from '../StudySummary';
import LocalFileSelection from './LocalFileSelection';


/*
 * Component for view if no study has been loaded
 * used for selection of studies from cBio or own data sets
 */
const DefaultView = inject('rootStore', 'undoRedoStore', 'uiStore')(observer(class DefaultView extends React.Component {
    constructor() {
        super();
        this.getStudy = this.getStudy.bind(this);
        extendObservable(this, {
            selectedStudy: null,
            selectedTab: 'cBio',
        });
        this.handleSelectTab = this.handleSelectTab.bind(this);
        this.displayStudy = this.displayStudy.bind(this);
        this.handleInstanceChange = this.handleInstanceChange.bind(this);
    }

    /**
     * selects a study
     * @param {Object} selectedOption
     */
    getStudy(selectedOption) {
        this.selectedStudy = selectedOption;
        this.props.rootStore.parseTimeline(this.props.rootStore.studyAPI.studies
            .filter(d => d.studyId === selectedOption.value)[0], () => {
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
        if (this.selectedStudy !== null && this.props.rootStore.timelineParsed && (!this.props.rootStore.isOwnData || this.props.rootStore.localFileLoader.eventsParsed === 'finished')) {
            info = (
                <div>
                    <Panel>
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
            );
        } else if ((this.selectedStudy !== null && !this.props.rootStore.isOwnData)
            || (this.props.rootStore.isOwnData && this.props.rootStore.localFileLoader.eventsParsed === 'loading')) {
            info = <div className="smallLoader"/>;
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
                    .filter(d => d.studyId === this.selectedStudy.value)[0], () => {
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


    render() {
        // check if data is ready
        let launchDisabled = true;
        if (this.props.rootStore.isOwnData) {
            launchDisabled = !this.props.rootStore.localFileLoader.dataReady;
        } else {
            launchDisabled = !this.props.rootStore.timelineParsed;
        }
        return (
            <Grid>
                <Row>
                    <Col xs={8} xsOffset={2}>
                        <Tabs
                            activeKey={this.selectedTab}
                            id="controlled-tab"
                            animation={false}
                            onSelect={this.handleSelectTab}
                        >
                            <Tab eventKey="cBio" title="Load cBio dataset">
                                <form>
                                    <FormGroup>
                                        <Radio
                                            name="linkSelect"
                                            value="hack"
                                            checked={this.props.uiStore.cBioInstance === 'hack'}
                                            onChange={this.handleInstanceChange}
                                            inline
                                        >
                                            cBioHack
                                        </Radio>
                                        {' '}
                                        <Radio
                                            name="linkSelect"
                                            value="portal"
                                            checked={this.props.uiStore.cBioInstance === 'portal'}
                                            onChange={this.handleInstanceChange}
                                            inline
                                        >
                                            cBioPortal
                                        </Radio>
                                        {' '}
                                        <Radio
                                            name="linkSelect"
                                            value="own"
                                            checked={this.props.uiStore.cBioInstance === 'own'}
                                            onChange={this.handleInstanceChange}
                                            inline
                                        >
                                            Own instance
                                        </Radio>
                                        {' '}
                                    </FormGroup>
                                </form>
                                {this.props.uiStore.cBioInstance !== 'own'
                                    ? (
                                        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                                            <Select
                                                type="text"
                                                searchable
                                                componentClass="select"
                                                placeholder="Select Study"
                                                value={this.selectedStudy}
                                                options={this.setOptions()}
                                                onChange={this.getStudy}
                                            />
                                        </div>
                                    )
                                    : null}
                            </Tab>
                            <Tab eventKey="own" title="Load own dataset">
                                <LocalFileSelection/>
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
            </Grid>
        );
    }
}));
export default DefaultView;
