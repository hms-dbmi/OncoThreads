import RootStore from "./RootStore";
import OriginalVariable from "./TemporalHeatmap/stores/OriginalVariable";
import DerivedVariable from "./TemporalHeatmap/stores/DerivedVariable";
import UIStore from "./UIStore";

describe("RootStore", () => {
    // check if new variable is created in the right way
    it("creates new variable", () => {
        const rootStore = new RootStore;
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable("id1", "name1", "datatype1", "description1", [], [], {}, "", ""));
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable("id2", "name2", "datatype2", "description2", [], [], {}, "", ""));
        expect(rootStore.dataStore.variableStores.sample.currentVariables.length).toBe(2);
        expect(rootStore.dataStore.variableStores.sample.currentVariables[0]).toBe("id1");
        expect(rootStore.dataStore.variableStores.sample.currentVariables[1]).toBe("id2");
    });
    // check if variables that are no longer referenced are removed
    it("removes variables that are no longer referenced", () => {
        const rootStore = new RootStore;
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable("id1", "name1", "datatype1", "description1", [], [], {}, "", ""));
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable("id2", "name2", "datatype2", "description2", [], [], {}, "", ""));
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new DerivedVariable("id3", "name3", "datatype1", "description3", ["id1", "id2"], {}, [], [], [],"",""));
        expect(rootStore.dataStore.variableStores.sample.referencedVariables["id1"].referenced).toBe(2);
        expect(rootStore.dataStore.variableStores.sample.referencedVariables["id2"].referenced).toBe(2);
        expect(rootStore.dataStore.variableStores.sample.referencedVariables["id3"].referenced).toBe(1);
        rootStore.dataStore.variableStores.sample.removeVariable("id1");
        rootStore.dataStore.variableStores.sample.removeVariable("id2");
        expect(Object.keys(rootStore.dataStore.variableStores.sample.referencedVariables).length).toBe(3);
        rootStore.dataStore.variableStores.sample.removeVariable("id3");
        expect(Object.keys(rootStore.dataStore.variableStores.sample.referencedVariables).length).toBe(0);
    });
    // check if the number of heatmap rows equals the number of variables
    it("creates the correct number of heatmap rows", () => {
        const rootStore = new RootStore(new UIStore());
        rootStore.patients = ["a", "b", "c", "d", "e"];
        let timepointStructure = [];
        rootStore.patients.forEach(patient => {
            for (let i = 0; i < 5; i++) {
                if (timepointStructure.length <= i) {
                    timepointStructure.push([])
                }
                timepointStructure[i].push({patient: patient, sample: patient + i});
            }
        });
        rootStore.timepointStructure = timepointStructure;
        rootStore.dataStore.initialize();
        expect(rootStore.dataStore.timepoints.length).toBe(5);
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable("id1", "name1", "datatype1", "description1", [], [], {}, "", ""));
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable("id2", "name2", "datatype2", "description2", [], [], {}, "", ""));
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new DerivedVariable("id3", "name3", "datatype1", "description3", ["id1", "id2"], {}, [], [], [],"",""));
        expect(rootStore.dataStore.variableStores.sample.childStore.timepoints[0].heatmap.length).toBe(3);
    });
    // check if sorting works correctly
    it("sorts correctly", () => {
        const rootStore = new RootStore(new UIStore());
        rootStore.patients = ["a", "b", "c", "d", "e"];
        let timepointStructure = [];
        let sortOrder = [];
        let mapper1 = {};
        rootStore.patients.forEach(patient => {
            for (let i = 0; i < 5; i++) {
                let randomValue = Math.random();
                if (i === 0) {
                    sortOrder.push({patient: patient, value: randomValue});
                }
                if (timepointStructure.length <= i) {
                    timepointStructure.push([])
                }
                timepointStructure[i].push({patient: patient, sample: patient + i});
                mapper1[patient + i] = randomValue;
            }
        });
        sortOrder.sort((a, b) => a.value - b.value);
        rootStore.timepointStructure = timepointStructure;
        rootStore.dataStore.initialize();
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable("id1", "name1", "NUMBER", "description1", [], [], mapper1, "", ""));
        expect(rootStore.dataStore.timepoints[0].heatmap[0].isUndef).toBe(false);
        expect(rootStore.dataStore.timepoints[0].primaryVariableId).toBe("id1");
        rootStore.dataStore.timepoints[0].sort("id1");
        expect(rootStore.dataStore.timepoints[0].heatmapSorting).toEqual({variable: "id1", order: 1});
        expect(rootStore.dataStore.timepoints[0].heatmapOrder.slice()).toEqual(sortOrder.map(d => d.patient));
        rootStore.dataStore.timepoints[0].sort("id1");
        expect(rootStore.dataStore.timepoints[0].heatmapOrder.slice()).toEqual(sortOrder.map(d=>d.patient).reverse())
    });
});
