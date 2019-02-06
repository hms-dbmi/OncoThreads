/**
 * Created by theresa on 30.01.18.
 */
import React from "react";
import {observer} from 'mobx-react';
import {Button, Modal, Nav, Navbar, NavDropdown, NavItem} from 'react-bootstrap';

import GetStudy from "./GetStudy";
import Content from "./Content"
import DefaultView from "./DefaultView"
import RootStore from "../../ReworkRootStore";
import LogModal from "./Modals/LogModal";
import SettingsModal from "./Modals/SettingsModal";
import AboutModal from "./Modals/AboutModal";
import StudySummary from "./StudySummary";

const App = observer(class App extends React.Component {
    constructor(props) {
        super();
        this.rootStore = new RootStore(props.cbioAPI, "", true);
        this.setRootStore = this.setRootStore.bind(this);
        this.state = {
            logModalIsOpen: false,
            aboutModalIsOpen: false,
            settingsModalIsOpen: false,
            studyInfoModalIsOpen: false
        };
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }



    openModal(type) {
        if (type === 'about') {
            this.setState({
                aboutModalIsOpen: true
            });
        }
        else if (type === 'log') {
            this.setState({
                logModalIsOpen: true
            });
        }
        else if (type === 'info') {
            this.setState({
                studyInfoModalIsOpen: true,
            })
        }
        else {
            this.setState({
                settingsModalIsOpen: true
            });
        }

    }

    closeModal() {
        this.setState({
            logModalIsOpen: false, aboutModalIsOpen: false, settingsModalIsOpen: false, studyInfoModalIsOpen: false,
        });
    }

    setRootStore(study, firstLoad, display) {
        this.rootStore.constructor(this.props.cbioAPI, study, firstLoad,display);
        this.rootStore.parseCBio();
    }

    getNavbarContent() {
        if (this.rootStore.display && this.rootStore.parsed) {
            return ([
                    <GetStudy key="getStudy" setRoot={this.setRootStore} rootStore={this.rootStore} cbioAPI={this.props.cbioAPI}
                              studies={this.props.studyapi.studies}/>,
                    <NavDropdown key="export" eventKey="dropdown" title="Export view" id="basic-nav-dropdown">
                        <NavItem onClick={this.rootStore.exportSVG}>...as SVG</NavItem>
                        <NavItem onClick={this.rootStore.exportSVGandData}>...as SVG with metadata</NavItem>
                    </NavDropdown>,
                    <NavItem key='settings' onClick={() => this.openModal('settings')}>Settings</NavItem>,
                    <NavItem key="showLogs" onClick={() => this.openModal('log')}>Show Logs</NavItem>,
                    <NavItem key="info" onClick={() => this.openModal('info')}>Study Info</NavItem>,
                    <NavItem key='about' onClick={() => this.openModal('about')}>About</NavItem>
                ]
            )
        }
        else {
            return (<NavItem key='about' onClick={() => this.openModal('about')}>About</NavItem>);
        }
    }

    /**
     * get content in the main panel
     * @returns {*}
     */
    getMainContent() {

        if (this.rootStore.firstLoad) {
            return (
                <DefaultView setRoot={this.setRootStore} cbioAPI={this.props.cbioAPI}
                             rootStore={this.rootStore}
                             studies={this.props.studyapi.studies}/>
            )
        }
          //if everything is parsed show the main view
        else if (this.rootStore.display && this.rootStore.parsed) {
            return (
                <Content rootStore={this.rootStore}/>
            )
        }
        else {
            return <div className="bigLoader"/>
        }
    }

    render() {
        return (
            <div><Navbar fluid style={{marginBottom: 10}}>
                <Navbar.Header>
                    <Navbar.Brand>
                        <a>OncoThreads</a>
                    </Navbar.Brand>
                    <Navbar.Toggle/>
                </Navbar.Header>
                <Nav>
                    {this.getNavbarContent()}
                </Nav>
            </Navbar>
                {this.getMainContent()}
                <LogModal modalIsOpen={this.state.logModalIsOpen} close={this.closeModal}
                          logs={this.rootStore.undoRedoStore.logs}/>
                <SettingsModal modalIsOpen={this.state.settingsModalIsOpen} store={this.rootStore.dataStore}
                               close={this.closeModal}/>
                <AboutModal modalIsOpen={this.state.aboutModalIsOpen} close={this.closeModal}/>
                <Modal show={this.state.studyInfoModalIsOpen}
                       onHide={this.closeModal}>
                    <Modal.Header>
                        Study Information
                    </Modal.Header>
                    <Modal.Body>
                        <StudySummary studyName={this.rootStore.study.name}
                                      studyDescription={this.rootStore.study.description}
                                      studyCitation={this.rootStore.study.citation}
                                      numPatients={this.rootStore.patientOrderPerTimepoint.length}
                                      minTP={this.rootStore.minTP}
                                      maxTP={this.rootStore.maxTP}/>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.closeModal}>Close</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
});

export default App;

