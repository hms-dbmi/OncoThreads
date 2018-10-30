import ColorScales from "./ColorScales";

class DerivedVariable {
    constructor(id, name, datatype, description, originalIds, modificationType, modification, range, domain, mapper) {
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
        this.range = range;
        this.domain = this.getDomain(domain);
        this.colorScale = this.getColorScale();
        this.referenced = 0;

    }

    getColorScale() {
        let scale;
        switch (this.datatype) {
            case "NUMBER":
                scale = ColorScales.getContinousColorScale(this.domain);
                break;
            case "BINNED":
                scale = ColorScales.getBinnedColorScale(this.domain,this.modification.bins);
                break;
            case "binary":
                scale = ColorScales.getBinaryScale(this.range);
                break;
            default:
                scale = ColorScales.getCategoricalScale(this.range, this.domain);
        }
        return scale;
    }

      getDomain(domain) {
        let currDomain = domain;
        if (domain.length === 0) {
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
                currDomain = [min, max];
            }
            else {
                currDomain = [];
                for (let sample in this.mapper) {
                    if (!(currDomain.includes(this.mapper[sample]))) {
                        currDomain.push(this.mapper[sample]);
                    }
                }
            }
        }
        return currDomain;
    }
}

export default DerivedVariable;