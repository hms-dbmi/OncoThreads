import VisStore from "./VisStore";
import {extendObservable} from 'mobx';

class DerivedVariable {
    constructor(id, name, datatype, originalIds, modificationType, modification,domain,range) {
        extendObservable(this, {
            get colorScale() {
                let scale;
                switch (this.datatype){
                    case "NUMBER":
                        scale= VisStore.getContinousColorScale(this.domain,this.range);
                        break;
                    case "STRING":
                        scale= VisStore.getCategoricalScale(this.range);
                        break;
                    case "binary":
                        scale=VisStore.getBinaryScale(this.range);
                        break;
                    case "BINNED":
                        scale=VisStore.getBinnedColorScale(this.modification.binNames,this.modification.bins,this.domain,this.range);
                }
                return scale;
            },

        });
        this.id = id;
        this.name = name;
        this.datatype = datatype;
        this.derived = true;
        this.originalIds = originalIds;
        this.modificationType = modificationType;
        this.modification = modification;
        this.domain=domain;
        this.range=range;
    }
}

export default DerivedVariable;