import ColorScales from "./ColorScales";
import {extendObservable} from 'mobx';

class DerivedVariable {
    constructor(id, name, datatype, description,originalIds, modificationType, modification, domain, range) {
        extendObservable(this, {
            get colorScale() {
                let scale;
                switch (this.datatype) {
                    case "NUMBER":
                        scale = ColorScales.getContinousColorScale(this.domain, this.range);
                        break;
                    case "binary":
                        scale = ColorScales.getBinaryScale();
                        break;
                    case "BINNED":
                        scale = ColorScales.getBinnedColorScale(this.modification.binNames, this.modification.bins, this.domain, this.range);
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
        this.type="derived";
        this.derived = true;
        this.description=description;
        this.originalIds = originalIds;
        this.modificationType = modificationType;
        this.modification = modification;
        this.domain = domain;
        this.range = range;
    }
}

export default DerivedVariable;