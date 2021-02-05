import RootStore from './RootStore';
import OriginalVariable from './OriginalVariable';
import UIStore from './UIStore';


describe('SingleTimepoint', () => {
    let timepoint;
    let variableStore;
    let sortOrder;
    beforeAll(() => {
        const uiStore = new UIStore()
        const rootStore = new RootStore(uiStore);
        rootStore.patients = ['a', 'b', 'c', 'd', 'e'];
        const timepointStructure = [];
        sortOrder = [];
        const mapper1 = {};
        rootStore.patients.forEach((patient) => {
            for (let i = 0; i < 5; i += 1) {
                const randomValue = Math.random();
                if (i === 0) {
                    sortOrder.push({ patient, value: randomValue });
                }
                if (timepointStructure.length <= i) {
                    timepointStructure.push([]);
                }
                timepointStructure[i].push({ patient, sample: patient + i });
                mapper1[patient + i] = randomValue;
            }
        });
        const mapper2 = {};
        const domain2 = ['x', 'y', 'z'];
        ['a', 'b', 'c', 'd', 'e'].forEach((patient, j) => {
            for (let i = 0; i < 5; i += 1) {
                mapper2[patient + i] = domain2[j % domain2.length];
            }
        });
        sortOrder.sort((a, b) => a.value - b.value);
        rootStore.timepointStructure.replace(timepointStructure);
        rootStore.dataStore.initialize();
        timepoint = rootStore.dataStore.timepoints[0];
        timepoint.setIsGrouped(false)
        variableStore = rootStore.dataStore.variableStores.sample;

        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable('id1', 'name1', 'NUMBER', 'description1', [], [], mapper1, '', ''));
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable('id2', 'name2', 'STRING', 'description1', [], [], mapper2, '', ''));
    });
    // check if sorting works correctly
    it('sorts correctly', () => {
        expect(timepoint.heatmap[0].isUndef).toBe(false);
        expect(timepoint.primaryVariableId).toBe('id1');
        timepoint.sort('id1');
        expect(timepoint.heatmapSorting).toEqual({ variable: 'id1', sortDir: 1 });
        expect(timepoint.heatmapOrder.slice())
            .toEqual(sortOrder.map(d => d.patient));
        timepoint.sort('id1');
        expect(timepoint.heatmapOrder.slice())
            .toEqual(sortOrder.map(d => d.patient).reverse());
    });
    it('groups correctly', () => {
        timepoint.group('id2');
        expect(timepoint.grouped).toHaveLength(3);
        expect(timepoint.grouped[0].patients).toEqual(['a', 'd']);
        expect(timepoint.grouped[1].patients).toEqual(['b', 'e']);
        expect(timepoint.grouped[2].patients).toEqual(['c']);
        variableStore.removeCurrentVariable('id2');
        expect(timepoint.isGrouped).toBe(false);
        expect(timepoint.primaryVariableId).toEqual('id1');
    });
});
