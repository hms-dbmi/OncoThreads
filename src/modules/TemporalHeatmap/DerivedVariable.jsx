import ColorScales from "./ColorScales";
import {extendObservable} from 'mobx';

class DerivedVariable {
    constructor(id, name, datatype, description, originalIds, modificationType, modification, mapper) {
        extendObservable(this, {
            get colorScale() {
                let scale;
                switch (this.datatype) {
                    case "NUMBER":
                        scale = ColorScales.getContinousColorScale(this.domain);
                        break;
                    case "binary":
                        scale = ColorScales.getBinaryScale();
                        break;
                    case "BINNED":
                        scale = ColorScales.getBinnedColorScale(this.modification.binNames, this.modification.bins, this.domain);
                        break;
                    default:
                        scale = ColorScales.getCategoricalScale(this.range);
                }
                return scale;
            },
            get domain() {
                if (this.datatype === 'NUMBER') {
                    let max = Number.NEGATIVE_INFINITY;
                    let min = Number.POSITIVE_INFINITY;
                    for (let sample in this.mapper) {
                        if (this.mapper[sample] > max) {
                            max = this.mapper[sample];
                        }
                        if (this.mapper[sample] < min) {
                            min = this.mapper[sample];
                        }
                    }
                    return [min, max];
                }
                else {
                    let domain = [];
                    for (let sample in this.mapper) {
                        if (!(domain.includes(this.mapper[sample]))) {
                            domain.push(this.mapper[sample]);
                        }
                    }
                    return domain;
                }
            }

        });
        this.id = id;
        this.name = name;
        this.datatype = datatype;
        this.type = "derived";
        this.derived = true;
        this.description = description;
        this.originalIds = originalIds;
        this.modificationType = modificationType;
        this.modification = modification;
        this.mapper = mapper;
        this.referenced = 0;

    }
}

export default DerivedVariable;