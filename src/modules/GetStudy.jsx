import React from "react";
import {observer} from "mobx-react";


const GetStudy = observer(class GetStudy extends React.Component {
    constructor() {
        super();
        this.getStudy = this.getStudy.bind(this);
    }

    getStudy(event,study) {
        this.props.cbioAPI.constructor();
        this.props.rootStore.constructor(this.props.cbioAPI,study,false);
        this.props.rootStore.parseCBio();
    }


    setOptions() {
        let options = [];
        const _self=this;
        this.props.studies.forEach(function (d) {
            options.push(<a className="dropdown-item" onClick={(e)=>_self.getStudy(e,d)} key={d.studyId}>{d.name}</a>)
        });
        return options;
    }

    render() {
        return (
            <div className="dropdown">
                <button className="btn dropdown-toggle" type="button" id="dropdownMenuButton"
                        data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    Select Study
                </button>
                <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                    {this.setOptions()}
                </div>
            </div>
    );
    }
    });
    export default GetStudy;
