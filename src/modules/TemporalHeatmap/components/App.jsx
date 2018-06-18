/**
 * Created by theresa on 30.01.18.
 */
import React from "react";
import {observer} from 'mobx-react';
import {Navbar,Nav,NavItem} from 'react-bootstrap';

import GetStudy from "./GetStudy";
import Content from "./Content"
import DefaultView from "./DefaultView"
import RootStore from "../../RootStore";
import LogModal from "./LogModal";

const App = observer(class App extends React.Component {
    constructor(props){
        super();
        this.rootStore=new RootStore(props.cbioAPI,"",true);
        this.setRootStore=this.setRootStore.bind(this);
        this.state = {
            modalIsOpen: false
        };
        this.openModal=this.openModal.bind(this);
        this.closeModal=this.closeModal.bind(this);
    }
    openModal() {
        this.setState({
            modalIsOpen: true
        });
    }

    closeModal() {
        this.setState({modalIsOpen: false});
    }
    setRootStore(study,firstLoad){
        this.rootStore.constructor(this.props.cbioAPI,study,firstLoad);
        this.rootStore.parseCBio();
    }
    getNavbarContent() {
        if (this.rootStore.parsed) {
            return ([
                <GetStudy key="getStudy" setRoot={this.setRootStore} cbioAPI={this.props.cbioAPI} studies={this.props.studyapi.studies}/>,
                <NavItem key="showLogs" onClick={this.openModal}>Show Logs</NavItem>
                    ]
            )
        }
        else {
            return null;
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
            <div><Navbar style={{margin:0}}>
                <Navbar.Header>
                    <Navbar.Brand>
                        <a>Onco Threads</a>
                    </Navbar.Brand>
                    <Navbar.Toggle/>
                </Navbar.Header>
                <Nav>
                {this.getNavbarContent()}
                </Nav>
            </Navbar>
                {this.getMainContent()}
                <LogModal modalIsOpen={this.state.modalIsOpen} close={this.closeModal} logs={this.rootStore.logStore.logs}/>
            </div>
        )
    }
});

export default App;

