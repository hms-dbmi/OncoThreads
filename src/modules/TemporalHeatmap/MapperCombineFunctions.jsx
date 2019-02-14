class MapperCombine {
    static getModificationMapper(modificationType, modification, mappers) {
        let mapper;
        switch (modificationType) {
            case "binaryCombine":
                mapper = MapperCombine.createBinaryCombinedMapper(mappers, modification);
                break;
            case "modifyCategorical":
                mapper = MapperCombine.createModifyCategoriesMapper(mappers[0], modification);
                break;
            default:
                let intermedMapper = {};
                if (modification.logTransform) {
                    intermedMapper = MapperCombine.createContinuousTransformMapper(mappers[0], modification.logTransform);
                } else {
                    intermedMapper = mappers[0];
                }
                if (modification.binning) {
                    mapper = MapperCombine.createBinnedMapper(intermedMapper, modification.binning.bins, modification.binning.binNames);
                }
                else {
                    mapper = intermedMapper;
                }
        }
        return mapper;
    }

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

    static createBinaryCombinedMapper(mappers, modification, names) {
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
                                categories.push(names[i]);
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


    static createModifyCategoriesMapper(mapper, categoryMapping) {
        let newMapper = {};
        for (let entry in mapper) {
            newMapper[entry] = categoryMapping[mapper[entry]];
        }
        return newMapper;
    }

    static createContinuousTransformMapper(mapper, transformFunction) {
        let newMapper = {};
        for (let entry in mapper) {
            mapper[entry] === undefined ? newMapper[entry] = undefined : newMapper[entry] = transformFunction(mapper[entry]);
        }
        return newMapper;
    }

}

export default MapperCombine;