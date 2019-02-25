import React from "react";
import {observer} from "mobx-react";
import {MenuItem, NavDropdown} from 'react-bootstrap';


const GetStudy = observer(class GetStudy extends React.Component {
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
        this.props.cbioAPI.constructor();
        this.props.setRoot(study, false, true);
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
});
export default GetStudy;
