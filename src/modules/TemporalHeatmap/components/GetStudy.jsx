import React from 'react';
import { inject, observer } from 'mobx-react';
import { MenuItem, NavDropdown } from 'react-bootstrap';


const GetStudy = inject('rootStore', 'undoRedoStore')(observer(class GetStudy extends React.Component {
    constructor() {
        super();
        this.getStudy = this.getStudy.bind(this);
    }

    /**
     * selects a study
     * @param {e} event
     * @param {Object} study
     */
    getStudy(event, study) {
        this.props.rootStore.setIsOwnData(false);
        this.props.undoRedoStore.reset();
        this.props.rootStore.parseTimeline(study, () => {
            this.props.rootStore.parseCBio(() => {
                this.props.undoRedoStore.saveLoadHistory(study.name);
            });
        });
    }

    /**
     * creates options for study selection
     * @returns {MenuItem[]}
     */
    setOptions() {
        const options = [];
        this.props.studies.forEach((d, i) => {
            options.push(
                <MenuItem
                    eventKey={i}
                    onClick={e => this.getStudy(e, d)}
                    key={d.studyId}
                >
                    {d.name}
                </MenuItem>,
            );
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
