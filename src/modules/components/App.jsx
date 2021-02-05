/**
 * Created by theresa on 30.01.18.
 */
import React from 'react';
import { inject, observer } from 'mobx-react';
import {
    Button, Modal, Nav, Navbar, NavDropdown, NavItem,
} from 'react-bootstrap';

import GetStudy from './GetStudy';
import Content from './Content';
import DefaultView from './StudySelection/DefaultView';
import LogModal from './Modals/LogModal';
import SettingsModal from './Modals/SettingsModal';
import AboutModal from './Modals/AboutModal';
import StudySummary from './StudySummary';

import { QuestionCircleOutlined, HomeOutlined } from '@ant-design/icons';

import './App.css'
import { Tooltip } from 'antd';
/**
 * Base Component
 */
const App = inject('rootStore', 'uiStore', 'undoRedoStore')(observer(class App extends React.Component {
    constructor() {
        super();
        this.state = {
            logModalIsOpen: false,
            aboutModalIsOpen: false,
            settingsModalIsOpen: false,
            studyInfoModalIsOpen: false,
        };
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);

        
    }

    /**
     * get content in the main panel
     * @returns {(DefaultView|Content|div)}
     */
    getMainContent() {
        if (this.props.rootStore.firstLoad) {
            return (
                <DefaultView />
            );
        }
        // if everything is parsed show the main view
        if (this.props.rootStore.dataParsed) {
            return (
                <Content />
            );
        }

        return <div className="bigLoader" />;
    }

    /**
     * gets Navbar on top
     * @return {[]|NavItem}
     */
    getNavbarContent() {
        if (this.props.rootStore.dataParsed) {
            return ([
                <GetStudy key="getStudy" studies={this.props.rootStore.studyAPI.studies} />,
                <NavDropdown key="export" eventKey="dropdown" title="Export View" id="basic-nav-dropdown">
                    <NavItem onClick={this.props.rootStore.svgExport.exportSVG}>
                        SVG
                    </NavItem>
                    <NavItem onClick={this.props.rootStore.svgExport.exportSVGandData}>
                        SVG with metadata
                    </NavItem>
                    <NavItem onClick={this.props.rootStore.svgExport.exportPNG}>
                        PNG
                    </NavItem>
                    <NavItem onClick={this.props.rootStore.svgExport.exportPDF}>
                        PDF
                    </NavItem>
                </NavDropdown>,
                <NavItem key="settings" onClick={() => this.openModal('settings')}>Settings</NavItem>,
                <NavItem key="showLogs" onClick={() => this.openModal('log')}>Show Logs</NavItem>,
                <NavItem key="info" onClick={() => this.openModal('info')}>Study Info</NavItem>,
                <NavItem key="about" onClick={() => this.openModal('about')}>About</NavItem>,

                <NavItem key="home" onClick={() => this.props.rootStore.firstLoad = true}>
                    <HomeOutlined />
                    {/* <img alt="svgImg" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHg9IjBweCIgeT0iMHB4Igp3aWR0aD0iMTYiIGhlaWdodD0iMTYiCnZpZXdCb3g9IjAgMCAxNiAxNiIKc3R5bGU9IiBmaWxsOiMwMDAwMDA7Ij48cGF0aCBkPSJNIDggMS4zMjAzMTMgTCAwLjY2MDE1NiA4LjEzMjgxMyBMIDEuMzM5ODQ0IDguODY3MTg4IEwgMiA4LjI1MzkwNiBMIDIgMTQgTCA3IDE0IEwgNyA5IEwgOSA5IEwgOSAxNCBMIDE0IDE0IEwgMTQgOC4yNTM5MDYgTCAxNC42NjAxNTYgOC44NjcxODggTCAxNS4zMzk4NDQgOC4xMzI4MTMgWiBNIDggMi42Nzk2ODggTCAxMyA3LjMyODEyNSBMIDEzIDEzIEwgMTAgMTMgTCAxMCA4IEwgNiA4IEwgNiAxMyBMIDMgMTMgTCAzIDcuMzI4MTI1IFoiPjwvcGF0aD48L3N2Zz4="></img>  */}
                </NavItem>,

                <NavItem key="tutorial" onClick={
                    () => {
                        this.props.uiStore.setTutorialMode(true)
                    }
                }>
                    <Tooltip defaultVisible={true} trigger='hover' 
                        title={<span>Click me to start a walk-through tutorial <br/> \n ✧( ु•⌄• )◞◟( •⌄• ू )✧'</span>}>
                    Intro <QuestionCircleOutlined style={{color:"green"}} />
                    </Tooltip>
                </NavItem>,


            ]
            );
        }
        return (<NavItem key="about" onClick={() => this.openModal('about')}>About</NavItem>);
    }

    /**
     * opens a modal of a certain type
     * @param {string} type
     */
    openModal(type) {
        if (type === 'about') {
            this.setState({
                aboutModalIsOpen: true,
            });
        } else if (type === 'log') {
            this.setState({
                logModalIsOpen: true,
            });
        } else if (type === 'info') {
            this.setState({
                studyInfoModalIsOpen: true,
            });
        } else {
            this.setState({
                settingsModalIsOpen: true,
            });
        }
    }

    /**
     * closes all modals
     */
    closeModal() {
        this.setState({
            logModalIsOpen: false,
            aboutModalIsOpen: false,
            settingsModalIsOpen: false,
            studyInfoModalIsOpen: false,
        });
    }

    render() {
        let navBarContent = this.getNavbarContent()
        
        return (
            <div>
                <Navbar fluid style={{ marginBottom: 10 }}>
                    <Navbar.Header>
                        <Navbar.Brand>
                            OncoThreads
                        </Navbar.Brand>
                        <Navbar.Toggle />
                    </Navbar.Header>
                    <Nav>
                        {navBarContent}
                    </Nav>
                </Navbar>
                {this.getMainContent()}
                <LogModal
                    modalIsOpen={this.state.logModalIsOpen}
                    close={this.closeModal}
                    logs={this.props.undoRedoStore.logs}
                />
                <SettingsModal
                    modalIsOpen={this.state.settingsModalIsOpen}
                    close={this.closeModal}
                />
                <AboutModal modalIsOpen={this.state.aboutModalIsOpen} close={this.closeModal} />
                <Modal
                    show={this.state.studyInfoModalIsOpen}
                    onHide={this.closeModal}
                >
                    <Modal.Header>
                        Study Information
                    </Modal.Header>
                    <Modal.Body>
                        <StudySummary />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.closeModal}>Close</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}));

export default App;
