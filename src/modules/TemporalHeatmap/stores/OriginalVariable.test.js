import OriginalVariable from "./OriginalVariable";
import ColorScales from "../UtilityClasses/ColorScales";

describe("OriginalVariable", () => {
    it("creates colorScale correctly", () => {
        let mapper1 = {};
        let domain = ["x", "y", "z"];
        ["a", "b", "c", "d", "e", "f", "g", "h"].forEach((patient, j) => {
            for (let i = 0; i < 5; i++) {
                mapper1[patient + i] = domain[j % domain.length]
            }
        });
        const variable = new OriginalVariable("id1", "name1", "STRING", "description1", [], [], mapper1, "", "");
        expect(variable.domain.length).toBe(3);
        expect(variable.domain).toContain("x");
        expect(variable.domain).toContain("y");
        expect(variable.domain).toContain("z");
        expect(variable.range.slice()).toEqual(ColorScales.defaultCategoricalRange);
    });
});