import {extendObservable} from 'mobx';
import ColorScales from './ColorScales';

class OriginalVariable {
    constructor(id, name, datatype,description, domain, range) {
        extendObservable(this, {
            get colorScale() {
                let scale;
                switch (this.datatype) {
                    case "NUMBER":
                        scale = ColorScales.getContinousColorScale(this.domain);
                        break;
                    case "binary":
                        scale = ColorScales.getBinaryScale(this.range);
                        break;
                    default:
                        scale = ColorScales.getCategoricalScale(this.range);
                }
                return scale;
            },
        });
        this.id = id;
        this.originalIds=[id];
        this.name = name;
        this.type="original";
        this.datatype = datatype;
        this.derived = false;
        this.domain = domain;
        this.range = range;
        this.description=description
    }

}

export default OriginalVariable;