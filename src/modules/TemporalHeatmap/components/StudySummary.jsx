import React from 'react';
import {observer,inject} from 'mobx-react';


/*
Displays study information
 */
const StudySummary = inject('rootStore')(observer(class StudySummary extends React.Component {
    render() {
        let numberOfTimepoints;
        if (this.props.rootStore.minTP === this.props.rootStore.maxTP) {
            numberOfTimepoints = this.props.rootStore.minTP;
        }
        else {
            numberOfTimepoints = this.props.rootStore.minTP + "-" + this.props.rootStore.maxTP;
        }
        if(!this.props.rootStore.isOwnData) {
            return (
                <div>
                    <b>Study:</b> {this.props.rootStore.study.name}
                    <br/>
                    <b>Description:</b> {this.props.rootStore.study.description}
                    <br/>
                    <b>Citation:</b> {this.props.rootStore.study.citation}
                    <br/>
                    <b>Number of patients:</b> {this.props.rootStore.patients.length}
                    <br/>
                    <b>Number of timepoints</b> {numberOfTimepoints}

                </div>
            )
        }
        else{
            return (
                <div>
                    <b>Number of patients:</b> {this.props.rootStore.patients.length}
                    <br/>
                    <b>Number of timepoints</b> {numberOfTimepoints}
                </div>
            )
        }

    }
}));
export default StudySummary;