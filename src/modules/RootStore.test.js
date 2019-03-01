import RootStore from "./RootStore";
import OriginalVariable from "./TemporalHeatmap/stores/OriginalVariable";
import DerivedVariable from "./TemporalHeatmap/stores/DerivedVariable";

describe("RootStore", () => {
    it("creates new variable", () => {
        const rootStore = new RootStore;
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable("id1", "name1", "datatype1", "description1", [], [], {}, "", ""));
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable("id2", "name2", "datatype2", "description2", [], [], {}, "", ""));
        expect(rootStore.dataStore.variableStores.sample.currentVariables.length).toBe(2);
        expect(rootStore.dataStore.variableStores.sample.currentVariables[0]).toBe("id1");
        expect(rootStore.dataStore.variableStores.sample.currentVariables[1]).toBe("id2");
    });
    it("removes variables that are no longer referenced", () => {
        const rootStore = new RootStore;
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable("id1", "name1", "datatype1", "description1", [], [], {}, "", ""));
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable("id2", "name2", "datatype2", "description2", [], [], {}, "", ""));
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new DerivedVariable("id3", "name3", "datatype1", "description3", ["id1", "id2"], {}, [], [], []));
        expect(rootStore.dataStore.variableStores.sample.referencedVariables["id1"].referenced).toBe(2);
        expect(rootStore.dataStore.variableStores.sample.referencedVariables["id2"].referenced).toBe(2);
        expect(rootStore.dataStore.variableStores.sample.referencedVariables["id3"].referenced).toBe(1);
        rootStore.dataStore.variableStores.sample.removeVariable("id1");
        rootStore.dataStore.variableStores.sample.removeVariable("id2");
        expect(Object.keys(rootStore.dataStore.variableStores.sample.referencedVariables).length).toBe(3);
        rootStore.dataStore.variableStores.sample.removeVariable("id3");
        expect(Object.keys(rootStore.dataStore.variableStores.sample.referencedVariables).length).toBe(0);
    });
});
