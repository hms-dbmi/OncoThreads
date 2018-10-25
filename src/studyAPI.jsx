import axios from "axios/index";
import {extendObservable} from 'mobx';

class StudyAPI {
    constructor() {
        extendObservable(this, {
            studies: []
        })
    }

    getStudies() {
        axios.get("http://www.cbiohack.org/api/studies?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC")
            .then(response => {
                this.studies = response.data;
            });
    }
}

export default StudyAPI;