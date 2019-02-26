import React from "react";
import {observer,inject} from "mobx-react";
import {MenuItem, NavDropdown} from 'react-bootstrap';


const GetStudy = inject("rootStore","undoRedoStore")(observer(class GetStudy extends React.Component {
    constructor() {
        super();
        this.getStudy = this.getStudy.bind(this);
    }

    /**
     * selects a study
     * @param event
     * @param study
     */
    getStudy(event, study) {
        this.props.rootStore.constructor();
        this.props.uiStore.constructor();
        this.props.undoRedoStore(this.props.rootStore,this.props.uiStore);
        this.props.rootStore.parseCBio(study);
    }

    /**
     * creates options for study selection
     * @returns {Array}
     */
    setOptions() {
        let options = [];
        const _self = this;
        this.props.studies.forEach(function (d, i) {
            options.push(<MenuItem eventKey={i} onClick={(e) => _self.getStudy(e, d)}
                                   key={d.studyId}>{d.name}</MenuItem>)
        });
        return options;
    }

    render() {
        return (
            <NavDropdown eventKey="dropdown" title="Select Study" id="basic-nav-dropdown">
                {this.setOptions()}
            </NavDropdown>
        );
    }
}));
export default GetStudy;
