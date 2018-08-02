/**
 * Created by theresa on 30.01.18.
 */
import React from "react";
import {observer} from 'mobx-react';
import {Nav, Navbar, NavItem} from 'react-bootstrap';

import GetStudy from "./GetStudy";
import Content from "./Content"
import DefaultView from "./DefaultView"
import RootStore from "../../RootStore";
import LogModal from "./Modals/LogModal";
import SettingsModal from "./Modals/SettingsModal";
import AboutModal from "./Modals/AboutModal";

const App = observer(class App extends React.Component {
    constructor(props) {
        super();
        this.rootStore = new RootStore(props.cbioAPI, "", true);
        this.setRootStore = this.setRootStore.bind(this);
        this.state = {
            logModalIsOpen: false,
            aboutModalIsOpen: false,
            settingsModalIsOpen: false
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
        else {
            this.setState({
                settingsModalIsOpen: true
            });
        }

    }

    closeModal() {
        this.setState({logModalIsOpen: false, aboutModalIsOpen: false, settingsModalIsOpen: false});
    }

    setRootStore(study, firstLoad) {
        this.rootStore.constructor(this.props.cbioAPI, study, firstLoad);
        this.rootStore.parseCBio();
    }

    getNavbarContent() {
        if (this.rootStore.parsed) {
            return ([
                    <GetStudy key="getStudy" setRoot={this.setRootStore} cbioAPI={this.props.cbioAPI}
                              studies={this.props.studyapi.studies}/>,
                    <NavItem key="showLogs" onClick={() => this.openModal('log')}>Show Logs</NavItem>,
                    <NavItem key='settings' onClick={() => this.openModal('settings')}>Settings</NavItem>,
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
        //if everything is parsed show the main view
        if (this.rootStore.parsed) {
            return (
                <Content rootStore={this.rootStore}/>
            )
        }
        else {
            //if there is no study loaded show the default view
            if (this.rootStore.firstLoad) {
                return (
                    <DefaultView setRoot={this.setRootStore} cbioAPI={this.props.cbioAPI}
                                 studies={this.props.studyapi.studies}/>
                )
            }
            //if a study is loaded but not parsed yet display "Loading study"
            else {
                return (
                    <h1 className="defaultView">Loading study...</h1>
                )
            }
        }
    }

    render() {
        return (
            <div><Navbar style={{margin: 0}}>
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
                <SettingsModal modalIsOpen={this.state.settingsModalIsOpen} store={this.rootStore.timepointStore}
                               close={this.closeModal}/>
                <AboutModal modalIsOpen={this.state.aboutModalIsOpen} close={this.closeModal}/>
            </div>
        )
    }
});

export default App;

