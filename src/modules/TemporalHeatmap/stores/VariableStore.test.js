import RootStore from '../../RootStore';
import OriginalVariable from './OriginalVariable';
import DerivedVariable from './DerivedVariable';
import UIStore from '../../UIStore';


describe('VariableStore', () => {
    let rootStore;
    beforeEach(() => {
        rootStore = new RootStore(new UIStore());
        rootStore.patients = ['a', 'b', 'c', 'd', 'e'];
        const timepointStructure = [];
        rootStore.patients.forEach((patient) => {
            for (let i = 0; i < 5; i += 1) {
                if (timepointStructure.length <= i) {
                    timepointStructure.push([]);
                }
                timepointStructure[i].push({ patient, sample: patient + i });
            }
        });
        rootStore.timepointStructure.replace(timepointStructure);
        rootStore.dataStore.initialize();
    });
    // check if new variable is created in the right way
    it('creates new variable', () => {
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable('id1', 'name1', 'datatype1', 'description1', [], [], {}, '', ''));
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable('id2', 'name2', 'datatype2', 'description2', [], [], {}, '', ''));
        expect(rootStore.dataStore.variableStores.sample.currentVariables).toHaveLength(2);
        expect(rootStore.dataStore.variableStores.sample.currentVariables[0]).toBe('id1');
        expect(rootStore.dataStore.variableStores.sample.currentVariables[1]).toBe('id2');
    });
    // check if variables that are no longer referenced are removed
    it('removes variables that are no longer referenced', () => {
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable('id1', 'name1', 'datatype1', 'description1', [], [], {}, '', ''));
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable('id2', 'name2', 'datatype2', 'description2', [], [], {}, '', ''));
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new DerivedVariable('id3', 'name3', 'datatype1', 'description3', ['id1', 'id2'], {}, [], [], [], '', ''));
        expect(rootStore.dataStore.variableStores.sample.referencedVariables.id1.referenced)
            .toBe(2);
        expect(rootStore.dataStore.variableStores.sample.referencedVariables.id2.referenced)
            .toBe(2);
        expect(rootStore.dataStore.variableStores.sample.referencedVariables.id3.referenced)
            .toBe(1);
        rootStore.dataStore.variableStores.sample.removeVariable('id1');
        rootStore.dataStore.variableStores.sample.removeVariable('id2');
        expect(Object.keys(rootStore.dataStore.variableStores.sample.referencedVariables))
            .toHaveLength(3);
        rootStore.dataStore.variableStores.sample.removeVariable('id3');
        expect(Object.keys(rootStore.dataStore.variableStores.sample.referencedVariables))
            .toHaveLength(0);
    });
    // check if the number of heatmap rows equals the number of variables
    it('creates correct heatmap rows', () => {
        expect(rootStore.dataStore.timepoints).toHaveLength(5);
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable('id1', 'name1', 'datatype1', 'description1', [], [], {}, '', ''));
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new OriginalVariable('id2', 'name2', 'datatype2', 'description2', [], [], {}, '', ''));
        rootStore.dataStore.variableStores.sample.addVariableToBeDisplayed(new DerivedVariable('id3', 'name3', 'datatype1', 'description3', ['id1', 'id2'], {}, [], [], [], '', ''));
        expect(rootStore.dataStore.variableStores.sample.childStore.timepoints
            .every(timepoint => timepoint.heatmap.length === 3)).toBe(true);
        expect(rootStore.dataStore.variableStores.sample.childStore.timepoints
            .every(timepoint => timepoint.primaryVariableId === 'id1')).toBe(true);
        rootStore.dataStore.variableStores.sample.removeCurrentVariable('id1');
        expect(rootStore.dataStore.variableStores.sample.childStore.timepoints
            .every(timepoint => timepoint.heatmap.length === 2)).toBe(true);
        expect(rootStore.dataStore.variableStores.sample.childStore.timepoints
            .every(timepoint => timepoint.primaryVariableId === 'id2')).toBe(true);
    });
});
