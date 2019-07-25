import OriginalVariable from './OriginalVariable';
import ColorScales from '../UtilityClasses/ColorScales';

describe('OriginalVariable', () => {
    // check if the color scale setup works
    it('creates categorical colorScale correctly', () => {
        const mapper1 = {};
        const domain = ['x', 'y', 'z'];
        ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].forEach((patient, j) => {
            for (let i = 0; i < 5; i += 1) {
                mapper1[patient + i] = domain[j % domain.length];
            }
        });
        const variable = new OriginalVariable('id1', 'name1', 'STRING', 'description1', [], [], mapper1, '', '');
        expect(variable.domain).toHaveLength(3);
        expect(variable.domain).toContain('x');
        expect(variable.domain).toContain('y');
        expect(variable.domain).toContain('z');
        expect(variable.range.slice()).toEqual(ColorScales.defaultCategoricalRange);
    });
    it('creates ordinal colorScale correctly', () => {
        const mapper1 = {};
        const domain = ['x', 'y', 'z'];
        ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].forEach((patient, j) => {
            for (let i = 0; i < 5; i += 1) {
                mapper1[patient + i] = domain[j % domain.length];
            }
        });
        const variable = new OriginalVariable('id1', 'name1', 'ORDINAL', 'description1', [], [], mapper1, '', '');
        expect(variable.range.slice()).toEqual(ColorScales.defaultContinuousTwoColors);
        expect(variable.colorScale('x')).toBeDefined();
        expect(variable.colorScale('y')).toBeDefined();
        expect(variable.colorScale('z')).toBeDefined();
    });
    it('creates negative numerical colorScale correctly', () => {
        const mapper1 = {};
        const domain = [-1, 5, 10];
        ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].forEach((patient, j) => {
            for (let i = 0; i < 5; i += 1) {
                mapper1[patient + i] = domain[j % domain.length];
            }
        });
        const variable = new OriginalVariable('id1', 'name1', 'NUMBER', 'description1', [], [], mapper1, '', '');
        expect(variable.domain).toHaveLength(2);
        expect(variable.range).toHaveLength(3);
        expect(variable.range.slice()).toEqual(ColorScales.defaultContinuousThreeColors);
    });
    it('creates positive numerical colorScale correctly', () => {
        const mapper1 = {};
        const domain = [2, 5, 10];
        ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].forEach((patient, j) => {
            for (let i = 0; i < 5; i += 1) {
                mapper1[patient + i] = domain[j % domain.length];
            }
        });
        const variable = new OriginalVariable('id1', 'name1', 'NUMBER', 'description1', [], [], mapper1, '', '');
        expect(variable.domain).toHaveLength(2);
        expect(variable.range).toHaveLength(2);
        expect(variable.range.slice()).toEqual(ColorScales.defaultContinuousTwoColors);
    });
});
