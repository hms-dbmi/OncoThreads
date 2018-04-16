import React from "react";
import {observer} from "mobx-react";


const GetStudy = observer(class GetStudy extends React.Component {
    constructor() {
        super();
        GetStudy.getStudy = GetStudy.getStudy.bind(this);
    }

    static getStudy(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            if(this.props.rootStore.parsed) {
                this.props.cbioAPI.constructor();
                this.props.rootStore.constructor(this.props.cbioAPI);
            }
            this.props.rootStore.parseCBio(event.target.value);
        }
    }

    render() {
        return (
            <div>
                <div>
                <label className="menu">
                    Enter study name:
                    <input type="text" defaultValue="lgg_ucsf_2014" style={{horizontalAlign: "middle"}} onKeyUp={GetStudy.getStudy}/>
                </label>
                </div>
            </div>
        )
    }
});
export default GetStudy;
