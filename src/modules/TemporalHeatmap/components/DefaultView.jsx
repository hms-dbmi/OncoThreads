import React from "react";
import {inject, observer} from "mobx-react";
import Select from 'react-select';
import {Button, Panel} from "react-bootstrap";
import StudySummary from "./StudySummary";


/*
 * View if no study has been loaded
 */
const DefaultView = inject("rootStore", "undoRedoStore","studyapi")(observer(class DefaultView extends React.Component {
    constructor() {
        super();
        this.getStudy = this.getStudy.bind(this);
        this.state = {studyClicked: false,}
    }

    /**
     * selects a study
     * @param selectedOption
     */
    getStudy(selectedOption) {
        this.setState({studyClicked: true});
        const selectedStudy = this.props.studies.filter(d => d.studyId === selectedOption.value)[0]
        this.props.rootStore.parseCBio(selectedStudy, () => {
            this.props.undoRedoStore.saveLoadHistory(selectedStudy.name)
        });
    }

    /**
     * creates different options for study selection
     * @returns {Array}
     */
    setOptions() {
        let options = [];
        this.props.studyapi.studies.forEach(function (d, i) {
            options.push({value: d.studyId, label: d.name});
        });
        return options;
    }


    /**
     * gets information about study
     * @returns {*}
     */
    getStudyInfo() {
        let info = null;
        if (this.props.rootStore.parsed) {
            info = <div><Panel>
                <Panel.Heading>
                    <Panel.Title>
                        Study information
                    </Panel.Title>
                </Panel.Heading>
                <Panel.Body>
                    <StudySummary studyName={this.props.rootStore.study.name}
                                  studyDescription={this.props.rootStore.study.description}
                                  studyCitation={this.props.rootStore.study.citation}
                                  numPatients={this.props.rootStore.patients.length}
                                  minTP={this.props.rootStore.minTP}
                                  maxTP={this.props.rootStore.maxTP}/>
                </Panel.Body>
            </Panel>
                <Button onClick={this.displayStudy}>Select study</Button>
            </div>

        }
        else if (this.state.studyClicked) {
            info = <div className="smallLoader"/>
        }
        return info;
    }

    render() {
        return (
            <div className="defaultView">
                <Select
                    type="text"
                    searchable={true}
                    componentClass="select" placeholder="Select Study"
                    options={this.setOptions()}
                    onChange={this.getStudy}
                />
                {this.getStudyInfo()}
            </div>
        );
    }
}));
export default DefaultView;
