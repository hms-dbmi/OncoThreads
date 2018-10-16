import React from 'react';
import {observer} from 'mobx-react';
import {Panel} from 'react-bootstrap';

import FontAwesome from 'react-fontawesome';


/*
Creates the list of current variables
 */
const StudySummary = observer(class StudySummary extends React.Component {
    constructor() {
        super();
        this.state = {icon: "caret-down"};
        this.toggleIcon = this.toggleIcon.bind(this);
    }

    toggleIcon() {
        if (this.state.icon === "caret-down") {
            this.setState({icon: "caret-right"});
        }
        else {
            this.setState({icon: "caret-down"});
        }
    }

    render() {
        let numberOfTimepoints;
        if (this.props.minTP === this.props.maxTP) {
            numberOfTimepoints = this.props.minTP;
        }
        else {
            numberOfTimepoints = this.props.minTP + "-" + this.props.maxTP;
        }
        return (
            <Panel id="collapsible-panel-example-2" defaultExpanded>
                <Panel.Heading>
                    <Panel.Title toggle>
                        <div onClick={this.toggleIcon}>Study Information <FontAwesome name={this.state.icon}/></div>
                    </Panel.Title>
                </Panel.Heading>
                <Panel.Collapse>
                    <Panel.Body>
                        <b>Study:</b> {this.props.studyName}
                        <br/>
                        <b>Description:</b> {this.props.studyDescription}
                        <br/>
                        <b>Citation:</b> {this.props.studyCitation}
                        <br/>
                        <b>Number of patients:</b> {this.props.numPatients}
                        <br/>
                        <b>Number of timepoints</b> {numberOfTimepoints}

                    </Panel.Body>
                </Panel.Collapse>
            </Panel>)


    }
});
export default StudySummary;