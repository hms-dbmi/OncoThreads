import {extendObservable} from "mobx";

class SankeyStore {
    constructor() {
        this.sampleStructure = {};
        this.countsPerTP = {};
        this.sampleClinicalMap = {};
        extendObservable(this, {
            clinicalCategories: [],
            currentSankeyData: {}
        })
    }

    setSampleStructure(sampleStructure) {
        this.sampleStructure = sampleStructure;
    }

    setSampleClinicalMap(sampleClinicalMap) {
        this.sampleClinicalMap = sampleClinicalMap;
    }

    setClinicalCategories(clinicalCategories) {
        this.clinicalCategories = clinicalCategories;
    }

    createSankeyData() {
        let counts = {};
        const _self = this;
        this.clinicalCategories.forEach(function (category) {
            let links = [];
            let nodes = [];
            for (let patient in _self.sampleStructure) {
                let counter = 0;
                while (counter + 1 < Object.keys(_self.sampleStructure[patient].timepoints).length) {
                    const current_state = _self.sampleClinicalMap[_self.sampleStructure[patient].timepoints[counter][0]][category] + " (timepoint " + String(counter) + ")";
                    const next_state = _self.sampleClinicalMap[_self.sampleStructure[patient].timepoints[counter + 1][0]][category] + " (timepoint " + String(counter + 1) + ")";
                    if (SankeyStore.nodesIndex(current_state, nodes) === -1) {
                        nodes.push({"name": current_state});
                    }
                    if (SankeyStore.nodesIndex(next_state, nodes) === -1) {
                        nodes.push({"name": next_state});
                    }
                    let currSource = SankeyStore.nodesIndex(current_state, nodes);
                    let currTarget = SankeyStore.nodesIndex(next_state, nodes);
                    if (SankeyStore.linksIndex(currSource, currTarget, links) === -1) {
                        links.push({"source": currSource, "target": currTarget, "value": 0})
                    }
                    let currLinkIndex = SankeyStore.linksIndex(currSource, currTarget, links);
                    links[currLinkIndex].value += 1;
                    counter += 1
                }


            }
            counts[category] = {"nodes": nodes, "links": links};
        });
        this.countsPerTP = counts;
        this.setCurrentSankeyData(this.clinicalCategories[0]);
    }

    /**
     * gets node with a certain name from the nodes array
     * @param name
     * @param nodes
     * @returns index of node
     */
    static nodesIndex(name, nodes) {
        let index = -1;
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].name === name) {
                index = i;
                break;
            }
        }
        return index;
    }

    /**
     * gets ling with a certain source and target from the links array
     * @param source
     * @param target
     * @param links
     * @returns index of link
     */
    static linksIndex(source, target, links) {
        let index = -1;
        for (let i = 0; i < links.length; i++) {
            if (links[i].source === source && links[i].target === target) {
                index = i;
                break;
            }
        }
        return index;
    }

    /**
     * sets current sankey dataset
     * @param category
     */
    setCurrentSankeyData(category) {
        this.currentSankeyData = this.countsPerTP[category];
    }
}

export default SankeyStore;