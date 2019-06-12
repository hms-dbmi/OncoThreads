/**
 * class for creating derived mappers
 */
class DerivedMapperFunctions {
    /**
     * gets a mapper based on a modification an mappers of original variables
     * modification types: binaryCombine, modifyCategorical, convertBinary, continuousModification
     * @param {Object} modification
     * @param {Object[]} mappers
     * @returns {Object}
     */
    static getModificationMapper(modification, mappers) {
        let mapper;
        switch (modification.type) {
            case "binaryCombine":
                mapper = DerivedMapperFunctions.createBinaryCombinedMapper(mappers, modification);
                break;
            case "categoricalTransform":
                mapper = DerivedMapperFunctions.createModifyCategoriesMapper(mappers[0], modification.mapping);
                break;
            default: // continuous transform
                let intermedMapper = {};
                if (modification.transformFunction) {
                    intermedMapper = DerivedMapperFunctions.createContinuousTransformMapper(mappers[0], modification.transformFunction);
                } else {
                    intermedMapper = mappers[0];
                }
                if (modification.binning) {
                    mapper = DerivedMapperFunctions.createBinnedMapper(intermedMapper, modification.binning.bins, modification.binning.binNames);
                }
                else {
                    mapper = intermedMapper;
                }
        }
        return mapper;
    }

    /**
     * creates mapper for binning a variable
     * @param {Object} mapper
     * @param {number[]} bins
     * @param {Object[]} binNames
     */
    static createBinnedMapper(mapper, bins, binNames) {
        let newMapper = {};
        for (let entry in mapper) {
            if (mapper[entry] === undefined) {
                newMapper[entry] = undefined;
            }
            else {
                for (let i = 1; i < bins.length; i++) {
                    if (i === 1 && mapper[entry] >= bins[0] && mapper[entry] <= bins[1]) {
                        newMapper[entry] = binNames[0].name;
                        break;
                    }
                    else {
                        if (mapper[entry] > bins[i - 1] && mapper[entry] <= bins[i]) {
                            newMapper[entry] = binNames[i - 1].name;
                            break;
                        }
                    }
                }
            }
        }
        return newMapper
    }

    /**
     * creates mapper for combining binary variables
     * @param {Object[]} mappers
     * @param {Object} modification
     */
    static createBinaryCombinedMapper(mappers, modification) {
        let newMapper = {};
        for (let entry in mappers[0]) {
            if (modification.operator === "or") {
                if (modification.datatype === "BINARY") {
                    let containedInOne = false;
                    for (let i = 0; i < mappers.length; i++) {
                        if (mappers[i][entry]) {
                            containedInOne = true;
                            break;
                        }
                    }
                    newMapper[entry] = containedInOne;
                }
                else {
                    for (let entry in mappers[0]) {
                        let categories = [];
                        for (let i = 0; i < mappers.length; i++) {
                            if (mappers[i][entry]) {
                                categories.push(modification.variableNames[i]);
                            }
                        }
                        let result = "";
                        if (categories.length > 0) {
                            categories.forEach((d, i) => {
                                if (i === categories.length - 1) {
                                    result += d;
                                }
                                else {
                                    result += (d + ",");
                                }
                            })
                        }
                        else result = "none";
                        newMapper[entry] = result;
                    }
                }
            }
            else if (modification.operator === "and") {
                let containedInAll = true;
                for (let i = 0; i < mappers.length; i++) {
                    if (!mappers[i][entry]) {
                        containedInAll = false;
                        break;
                    }
                }
                newMapper[entry] = containedInAll;
            }
        }
        return newMapper;
    }

    /**
     * creates mapper for combining binary variables
     * @param {Object[]} mappers
     */
    static createCategoryCombinedMapper(mappers) {
        let newMapper = {};
        for (let entry in mappers[0]) {
            let values = mappers.map(mapper => {
                if (mapper[entry] !== undefined) {
                    return mapper[entry]
                }
                else {
                    return "undefined";
                }
            });
            if (values.filter(d => d === undefined).length === values.length) {
                newMapper[entry] = undefined;
            }
            else {
                newMapper[entry] = values.toString();
            }
        }
        return newMapper;
    }

    static createContinuousCombinedMapper(mappers, operation) {
        let newMapper = {};
        switch (operation) {
            case "average":
                for (let entry in mappers[0]) {
                    let filteredValues = mappers.map(mapper=>mapper[entry]).filter(entry => entry !== undefined);
                    newMapper[entry] = filteredValues.reduce((a, b) => a + b) / filteredValues.length
                }
                break;
            case "median":
                for (let entry in mappers[0]) {
                    let sortedValues = mappers.map(mapper=>mapper[entry]).filter(entry => entry !== undefined).sort((a, b) => a - b);
                    if (sortedValues.length % 2) {
                        newMapper[entry] = sortedValues[(sortedValues.length - 1) / 2];
                    }
                    else {
                        newMapper[entry] = (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2;
                    }
                }
                break;
            case "sum":
                for (let entry in mappers[0]) {
                    let filteredValues = mappers.map(mapper=>mapper[entry]).filter(entry => entry !== undefined);
                    newMapper[entry] = filteredValues.reduce((a, b) => a+ b)
                }
                break;
            case "max":
                for (let entry in mappers[0]) {
                    let filteredValues = mappers.map(mapper=>mapper[entry]).filter(entry => entry !== undefined);
                    newMapper[entry] = Math.max(...filteredValues);
                }
                break;
            case "min":
                for (let entry in mappers[0]) {
                    let filteredValues = mappers.map(mapper=>mapper[entry]).filter(entry => entry !== undefined);
                    newMapper[entry] = Math.min(...filteredValues);
                }
                break;
            default:
                for (let entry in mappers[0]) {
                    let filteredValues = mappers.map(mapper=>mapper[entry]).filter(entry => entry !== undefined);
                    newMapper[entry] = filteredValues.reduce((a, b) => Math.abs(a - b));
                }

        }
        return newMapper;
    }

    /**
     * creates mapper for modifying categories
     * @param {Object} mapper
     * @param {Object} categoryMapping
     */
    static createModifyCategoriesMapper(mapper, categoryMapping) {
        let newMapper = {};
        for (let entry in mapper) {
            newMapper[entry] = categoryMapping[mapper[entry]];
        }
        return newMapper;
    }

    /**
     * creates mapper for transforming a continuous variable (e.g. log transform)
     * @param {Object} mapper
     * @param {function} transformFunction
     */
    static createContinuousTransformMapper(mapper, transformFunction) {
        let newMapper = {};
        for (let entry in mapper) {
            mapper[entry] === undefined ? newMapper[entry] = undefined : newMapper[entry] = transformFunction(mapper[entry]);
        }
        return newMapper;
    }

}

export default DerivedMapperFunctions;