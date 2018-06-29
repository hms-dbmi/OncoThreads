import React from "react";
import {observer} from "mobx-react";
import {DropdownButton, MenuItem} from 'react-bootstrap';


/*
 * View if no study has been loaded
 */
const DefaultView = observer(class DefaultView extends React.Component {
    constructor() {
        super();
        this.getStudy = this.getStudy.bind(this);
    }

    getStudy(study) {
        this.props.setRoot(study, true);
    }


    setOptions() {
        let options = [];
        const _self = this;
        this.props.studies.forEach(function (d, i) {
            options.push(<MenuItem eventKey={i} onClick={() => _self.getStudy(d)} key={d.studyId}>{d.name}</MenuItem>)
        });
        return options;
    }

    render() {
        return (
            <div className="defaultView">
                <DropdownButton
                    bsStyle="default"
                    bsSize="large"
                    title="Get Study"
                    key="Get Study"
                    id={`dropdown-basic-$Get Study`}
                >
                    {this.setOptions()}
                </DropdownButton>
            </div>
        );
    }
});
export default DefaultView;
