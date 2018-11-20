import ColorScales from "./ColorScales";
import {extendObservable} from "mobx";

class EventVariable {
    constructor(id, name, eventType, eventSubType, range, mapper) {

        this.id = id;
        this.originalIds = [id];
        this.name = name; //e.g. TMZ
        this.datatype = 'BINARY';
        this.type = "event";
        this.derived = false;
        this.eventType = eventType; //e.g. Treatment
        this.eventSubType = eventSubType; //e.g. Agent
        this.mapper = mapper;
        this.domain = [true, false];
        this.referenced = 0;
        extendObservable(this, {
                range: ['#ffd92f', 'lightgray'],
                get colorScale() {
                    return ColorScales.getOrdinalScale(this.range, this.domain);
                }
            }
        );
    }
}

export default EventVariable;