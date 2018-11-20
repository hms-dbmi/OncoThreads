import React from 'react';
import {observer} from 'mobx-react';


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
            <div>
                <b>Study:</b> {this.props.studyName}
                <br/>
                <b>Description:</b> {this.props.studyDescription}
                <br/>
                <b>Citation:</b> {this.props.studyCitation}
                <br/>
                <b>Number of patients:</b> {this.props.numPatients}
                <br/>
                <b>Number of timepoints</b> {numberOfTimepoints}

            </div>
        )


    }
});
export default StudySummary;