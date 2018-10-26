import {extendObservable} from 'mobx';
import ColorScales from './ColorScales';

class OriginalVariable {
    constructor(id, name, datatype, description, range, mapper) {
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
                    default:
                        scale = ColorScales.getCategoricalScale(this.domain);
                }
                return scale;
            },
            get domain() {
                let domain;
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
                    domain = [min, max];
                }
                else {
                    domain = [];
                    for (let sample in this.mapper) {
                        if (!(domain.includes(this.mapper[sample]))) {
                            domain.push(this.mapper[sample]);
                        }
                    }
                }
                console.log(this.datatype, domain);

                return domain;
            }
        });
        this.id = id;
        this.originalIds = [id];
        this.name = name;
        this.type = "original";
        this.datatype = datatype;
        this.derived = false;
        this.range = range;
        this.mapper = mapper;
        this.description = description;
        this.referenced = 0;
    }

}

export default OriginalVariable;