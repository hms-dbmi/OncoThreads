class DerivedMapperFunctions {
    /**
     * gets a mapper based on a modification an mappers of original variables
     * modification types: binaryCombine, modifyCategorical, convertBinary, continuousModification
     * @param modification
     * @param mappers
     * @returns {*}
     */
    static getModificationMapper(modification, mappers) {
        let mapper;
        switch (modification.type) {
            case "binaryCombine":
                mapper = DerivedMapperFunctions.createBinaryCombinedMapper(mappers, modification);
                break;
            case "modifyCategorical":
                mapper = DerivedMapperFunctions.createModifyCategoriesMapper(mappers[0], modification.mapping);
                break;
            case "convertBinary":
                mapper=DerivedMapperFunctions.createModifyCategoriesMapper(mappers[0],modification.mapping);
                break;
            default:
                let intermedMapper = {};
                if (modification.logTransform) {
                    intermedMapper = DerivedMapperFunctions.createContinuousTransformMapper(mappers[0], modification.logTransform);
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
     * @param mapper
     * @param bins
     * @param binNames
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
     * @param mappers
     * @param modification
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
                        else result ="none";
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
     * creates mapper for modifying categories
     * @param mapper
     * @param categoryMapping
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
     * @param mapper
     * @param transformFunction
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