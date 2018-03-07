import {extendObservable} from "mobx";

class EventStore {
    constructor() {
        this.clinicalEvents = {};
        this.previousSortKey = {key: "AGE", order: "ascending"};
        extendObservable(this, {
            sampleEvents: [],
            currentEvents: [],
            attributes: {},
            patientAttributes: [],
            patientAttributeCategories: {},
        })
    }

    setClinicalEvents(clinicalEvents) {
        this.clinicalEvents = clinicalEvents;
        this.sampleEvents = {
            "type": "SPECIMEN",
            "events": this.getEvents("SPECIMEN", []),
            "color": "blue"
        };
        let _self=this;
        for(let patient in this.clinicalEvents){
            let deceased=this.patientAttributes.filter(function (d,i) {
                return d.patient===patient;
            });
            if(deceased[0].OS_STATUS==="DECEASED") {
                _self.clinicalEvents[patient].push({
                    eventType: "STATUS",
                    key: "DECEASED",
                    patientId: patient,
                    startNumberOfDaysSinceDiagnosis: (deceased[0].OS_MONTHS * 30.4),
                    attributes:[{key: "STATUS", value:"DECEASED"}]
                })
            }
        }
    }

    setPatientAttributes(patientData) {
        let patientAttributes = [];
        let patientAttributeCategories = [];
        console.log(patientData);
        patientData.forEach(function (attributes, i) {
            let helper = {};
            attributes.forEach(function (attribute) {
                if (i === 0) {
                    patientAttributeCategories.push({
                        attribute: attribute.clinicalAttributeId,
                        datatype: attribute.clinicalAttribute.datatype
                    });
                }
                helper["patient"] = attribute.patientId;
                if (attribute.clinicalAttribute.datatype === "NUMBER")
                    helper[attribute.clinicalAttributeId] = Number(attribute.value);
                else helper[attribute.clinicalAttributeId] = attribute.value;
            });
            patientAttributes.push(helper);
        });
        this.patientAttributes = patientAttributes;
        this.patientAttributeCategories = patientAttributeCategories;
    }

    /**
     * gets events of one type ("STATUS","SPECIMEN","TREATMENT",...)
     * @param value
     * @param filters
     * @returns events of one type
     */
    getEvents(value, filters) {
        let events = [];
        for (let patient in this.clinicalEvents) {
            const filtered = this.clinicalEvents[patient].filter(function (d) {
                return d.eventType === value && EventStore.attributesMatch(d.attributes, filters);
            });
            events.push({"patient": patient, "events": filtered});
        }
        return events;
    }

    /**
     * or filter
     * @param attributes
     * @param searchAttributes
     * @returns {*}
     */
    static attributesMatch(attributes, searchAttributes) {
        let hasAttribute;
        for (let i = 0; i < attributes.length; i++) {
            hasAttribute = false;
            for (let j = 0; j < searchAttributes.length; j++) {
                if (searchAttributes[j].key === attributes[i].key && searchAttributes[j].value === attributes[i].value) {
                    hasAttribute = true;
                    break;
                }
            }
            if (hasAttribute === true) {
                break;
            }
        }
        if (searchAttributes.length === 0) {
            hasAttribute = true;
        }
        return hasAttribute;
    }

    computeAttributes() {
        let attributes = {};
        for (let patient in this.clinicalEvents) {
            this.clinicalEvents[patient].forEach(function (d, i) {
                if (!(d.eventType in attributes)) {
                    attributes[d.eventType] = {}
                }
                d.attributes.forEach(function (f, j) {
                    if (!(f.key in attributes[d.eventType])) {
                        attributes[d.eventType][f.key] = [];
                        attributes[d.eventType][f.key].push(f.value);
                    }
                    else {
                        if (!attributes[d.eventType][f.key].includes(f.value)) {
                            attributes[d.eventType][f.key].push(f.value);
                        }
                    }
                })
            })
        }
        this.attributes = attributes;
    }

    /**
     * add event to current events
     * @param value
     * @param color
     */
    addEvents(value, filter, color) {
        let oldEvents = this.currentEvents.slice();
        oldEvents.push({"type": value, "events": this.getEvents(value, filter), "color": color});
        this.currentEvents = oldEvents;
    }

    /**
     * remove event from current events
     * @param type
     */
    removeEvents(type) {
        let currentEvents = [];
        this.currentEvents.forEach(function (d) {
            if (d.type !== type) {
                currentEvents.push(d);
            }
        });
        this.currentEvents = currentEvents;
    }

    sortEvents(sortKey, order) {
        const _self = this;
        let firstOrder = order === "ascending" ? 1 : -1;
        let secondOrder = this.previousSortKey.order === "ascending" ? 1 : -1;
        this.patientAttributes = this.patientAttributes.sort(function (a, b) {
            if (a[sortKey] < b[sortKey])
                return -firstOrder;
            if (a[sortKey] > b[sortKey])
                return firstOrder;
            else {
                if (a[_self.previousSortKey.key] < b[_self.previousSortKey.key]) {
                    return -secondOrder;
                }
                if (a[_self.previousSortKey.key] > b[_self.previousSortKey.key]) {
                    return secondOrder;
                }
                return 0;
            }
        });
        this.previousSortKey = {key: sortKey, order: order};

    }
}
export default EventStore;