import {extendObservable} from 'mobx';
import VisStore from './VisStore';

class OriginalVariable {
    constructor(id, name, datatype,domain,range) {
        extendObservable(this, {
            get colorScale() {
                let scale;
                switch (this.datatype){
                    case "NUMBER":
                        scale= VisStore.getContinousColorScale(this.domain);
                        break;
                    case "STRING":
                        scale= VisStore.getCategoricalScale(this.range);
                        break;
                    case "binary":
                        scale=VisStore.getBinaryScale(this.range);
                        break;
                }
                return scale;
            },
        });
        this.id = id;
        this.name = name;
        this.datatype = datatype;
        this.derived = false;
        this.domain=domain;
        this.range=range;
    }

}

export default OriginalVariable;