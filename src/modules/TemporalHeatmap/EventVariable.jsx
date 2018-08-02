import {extendObservable} from "mobx";
import ColorScales from "./ColorScales";

class EventVariable {
    constructor(id, name, datatype, eventType, eventSubType) {
        extendObservable(this, {
            colorScale:ColorScales.getBinaryScale()
        });
        this.id = id;
        this.originalIds=[id];
        this.name = name; //e.g. TMZ
        this.datatype = datatype;
        this.type="event";
        this.derived = false;
        this.eventType = eventType; //e.g. Treatment
        this.eventSubType = eventSubType; //e.g. Agent
    }

}

export default EventVariable;