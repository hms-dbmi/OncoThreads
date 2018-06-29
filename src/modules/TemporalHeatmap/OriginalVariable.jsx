import {extendObservable} from 'mobx';
import ColorScales from './ColorScales';

class OriginalVariable {
    constructor(id, name, datatype, domain, range) {
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
        this.name = name;
        this.datatype = datatype;
        this.derived = false;
        this.domain = domain;
        this.range = range;
    }

}

export default OriginalVariable;