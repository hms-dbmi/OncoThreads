class EventVariable {
    constructor(id, name, datatype, eventType, eventSubType) {
        this.id = id;
        this.name = name; //e.g. TMZ
        this.datatype = datatype;
        this.type="event";
        this.derived = false;
        this.eventType = eventType; //e.g. Treatment
        this.eventSubType = eventSubType; //e.g. Agent
    }

}

export default EventVariable;