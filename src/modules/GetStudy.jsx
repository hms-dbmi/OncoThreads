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
            this.props.rootStore.createStores(event.target.value);
        }
    }

    render() {
        return (
            <div>
                <label className="menu">
                    Enter study name:
                    <input type="text" defaultValue="lgg_ucsf_2014" style={{horizontalAlign: "middle"}} onKeyUp={GetStudy.getStudy}/>
                </label>
            </div>
        );
    }
});
export default GetStudy;
