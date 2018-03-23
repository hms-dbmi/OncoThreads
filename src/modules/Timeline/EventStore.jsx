import {extendObservable} from "mobx";

class EventStore {
    constructor() {
        this.clinicalEvents = {};
        this.sortKeys = [];
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
            "color": "gray"
        };
        let _self = this;
        for (let patient in this.clinicalEvents) {
            let deceased = this.patientAttributes.filter(function (d, i) {
                return d.patient === patient;
            });
            if (deceased[0].OS_STATUS === "DECEASED") {
                _self.clinicalEvents[patient].push({
                    eventType: "STATUS",
                    key: "DECEASED",
                    patientId: patient,
                    startNumberOfDaysSinceDiagnosis: (deceased[0].OS_MONTHS * 30.4),
                    attributes: [{key: "STATUS", value: "DECEASED"}]
                })
            }
        }
    }

    setPatientAttributes(patientData) {
        let patientAttributes = [];
        let patientAttributeCategories = [];
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
        let deleteIndex = -1;
        this.sortKeys.forEach(function (d, i) {
            if (d.key === sortKey) {
                deleteIndex = i;
            }
        });
        if (deleteIndex !== -1) {
            this.sortKeys.splice(deleteIndex, 1);
        }
        this.sortKeys.push({key: sortKey, order: order});
        const _self = this;
        this.patientAttributes = this.patientAttributes.sort(function (a, b) {
            return (_self.sortRecursive(_self.sortKeys.length - 1, a, b))
        });

    }

    sortRecursive(index, a, b) {
        if (index === -1) {
            return 0
        }
        else {
            let firstOrder = this.sortKeys[index].order === "ascending" ? 1 : -1;
            if (a[this.sortKeys[index].key] < b[this.sortKeys[index].key])
                return -firstOrder;
            if (a[this.sortKeys[index].key] > b[this.sortKeys[index].key])
                return firstOrder;
            else {
                return (this.sortRecursive(index - 1, a, b));
            }
        }
    }
}

export default EventStore;