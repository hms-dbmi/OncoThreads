import React from "react";
import {observer} from "mobx-react";

/*
 * View if no study has been loaded
 */
const DefaultView = observer(class DefaultView extends React.Component {
    constructor() {
        super();
        this.getStudy = this.getStudy.bind(this);
    }

    getStudy(event,id) {
        this.props.rootStore.parseCBio(id);
                this.props.rootStore.firstLoad=false;
    }


    setOptions() {
        let options = [];
        const _self=this;
        this.props.studies.forEach(function (d) {
            options.push(<a className="dropdown-item" onClick={(e)=>_self.getStudy(e,d.id)} key={d.id}>{d.name}</a>)
        });
        return options;
    }

    render() {
        return (
            <div className="dropdown defaultView" >
                <button className="btn btn-secondary dropdown-toggle btn-lg" type="button" id="dropdownMenuButton"
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
    export default DefaultView;
