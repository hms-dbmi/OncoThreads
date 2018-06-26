class DerivedVariable {
    constructor(id, name, datatype, originalIds, modificationType, modification,colorScale) {
        this.id = id;
        this.name = name;
        this.datatype = datatype;
        this.derived = true;
        this.originalIds = originalIds;
        this.modificationType = modificationType;
        this.modification = modification;
        this.colorScale=colorScale;
    }
}

export default DerivedVariable;