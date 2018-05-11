import React from 'react';
import {observer} from 'mobx-react';

/*
Creates the list of current variables
 */
const StudySummary = observer(class StudySummary extends React.Component {
    render() {
        return (<div className="card mt-2">
            <button className="btn btn-secondary btn-block" data-toggle="collapse" data-target="#collapseInfo" aria-expanded="true" aria-controls="collapseInfo">
                Study Information ▼
            </button>
            <div id="collapseInfo" className="collapse show">
            <b>Study:</b> {this.props.studyName}
            <br/>
            <b>Description:</b> {this.props.studyDescription}
            <br/>
            <b>Citation:</b> {this.props.studyCitation}
            <br/>
            <b>Number of patients:</b> {this.props.numPatients}
            <br/>
                <b>Number of timepoints</b> {this.props.minTP}-{this.props.maxTP}
            </div>
        </div>)
    }
});
export default StudySummary;