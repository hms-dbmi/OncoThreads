class DerivedVariable {
    constructor(id, name, datatype, originalIds, modificationType, modification) {
        this.id = id;
        this.name = name;
        this.datatype = datatype;
        this.derived = true;
        this.originalIds = originalIds;
        this.modificationType = modificationType;
        this.modification = modification;
    }
}

export default DerivedVariable;