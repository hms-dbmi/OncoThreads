import OriginalVariable from "./TemporalHeatmap/OriginalVariable";


/*
gets the data with the cBioAPI and gives it to the other stores
 */
class MolProfileMapping {
    constructor(rootStore) {
        this.rootStore = rootStore;
         this.mutationOrder = ["Nonsense_Mutation", "Frame_Shift_Del", "Frame_Shift_Ins", "Splice_Site", "Splice_Region", "In_Frame_Del", "In_Frame_Ins", "De_novo_Start_InFrame", "Missense_Mutation", "Translation_Start_Site", "Nonstop_Mutation", "Targeted_Region", "De_novo_Start_OutOfFrame", "Unknown"];

    }

    /**
     * Gets all currently selected mutations
     * @param HUGOsymbols
     * @param mappingType
     */
    getMutationsProfile(HUGOsymbols, mappingType) {
        let datatype;
        if (mappingType === "binary") {
            datatype = "BINARY";
        }
        else if (mappingType === "vaf") {
            datatype = "NUMBER"
        }
        else {
            datatype = "STRING"
        }
        this.rootStore.cbioAPI.getGeneIDs(HUGOsymbols, entrezIDs => {
                if (entrezIDs.length !== 0) {
                    this.rootStore.cbioAPI.getAllMutations(this.rootStore.study.studyId, entrezIDs, response=> {
                        let geneDict = {};
                        let noMutationsFound = [];
                        entrezIDs.forEach(d => {
                            const containedIds = response.filter(entry => entry.entrezGeneId === d.entrezGeneId);
                            geneDict[d.entrezGeneId] = containedIds;
                            if (containedIds.length === 0) {
                                noMutationsFound.push({hgncSymbol: d.hgncSymbol, entrezGeneId: d.entrezGeneId});
                            }
                        });
                        let confirm = false;
                        if (noMutationsFound.length > 0) {
                            confirm = window.confirm("WARNING: No mutations found for " + noMutationsFound.map(entry => entry.hgncSymbol) + "\n Add anyway?");
                        }
                        if (!confirm) {
                            noMutationsFound.forEach(d => {
                                delete geneDict[d.entrezGeneId];
                            });
                        }
                        for (let entry in geneDict) {
                            if (!this.rootStore.timepointStore.variableStores.sample.isDisplayed(entry + mappingType)) {
                                const symbol = entrezIDs.filter(d => d.entrezGeneId === parseInt(entry, 10))[0].hgncSymbol;
                                let domain = [];
                                if (mappingType === "mutationType") {
                                    domain = this.rootStore.mutationOrder;
                                }
                                const variable = new OriginalVariable(entry + mappingType, symbol + "_" + mappingType, datatype, "mutation in" + symbol, [], domain, this.rootStore.createMutationMapping(geneDict[entry], mappingType), mappingType);
                                console.log(variable);
                                this.rootStore.timepointStore.variableStores.sample.addVariableToBeDisplayed(variable);
                            }
                        }
                        this.rootStore.undoRedoStore.saveVariableHistory("ADD mutation " + mappingType, HUGOsymbols, true)

                    })
                }
            }
        )
    }

    /**
     * gets data corresponding to selected HUGOsymbols in a molecular profile
     * @param profileId
     * @param HUGOsymbols
     */
    getMolecularProfile(profileId, HUGOsymbols) {
        const profile = this.rootStore.cbioAPI.molecularProfiles.filter(d => d.molecularProfileId === profileId)[0];
        this.rootStore.cbioAPI.getGeneIDs(HUGOsymbols, entrezIDs => {
            if (entrezIDs.length !== 0) {
                this.rootStore.cbioAPI.getAllMolecularValues(this.rootStore.study.studyId, profileId, entrezIDs, response => {
                    let geneDict = {};
                    let noMutationsFound = [];
                    entrezIDs.forEach(d => {
                        const containedIds = response.filter(entry => entry.entrezGeneId === d.entrezGeneId);
                        geneDict[d.entrezGeneId] = containedIds;
                        if (containedIds.length === 0) {
                            noMutationsFound.push({hgncSymbol: d.hgncSymbol, entrezGeneId: d.entrezGeneId});
                        }
                    });
                    let confirm = false;
                    if (noMutationsFound.length > 0) {
                        confirm = window.confirm("WARNING: No data found for " + noMutationsFound.map(entry => entry.hgncSymbol) + "\n Add anyway?");
                    }
                    if (!confirm) {
                        noMutationsFound.forEach(d=> {
                            delete geneDict[d.entrezGeneId];
                        });
                    }
                    for (let entry in geneDict) {
                        if (!this.rootStore.timepointStore.variableStores.sample.isDisplayed(entry)) {
                            const symbol = entrezIDs.filter(d => d.entrezGeneId === parseInt(entry, 10))[0].hgncSymbol;
                            let domain = [];
                            let datatype = "NUMBER";
                            if (profile.molecularAlterationType === "COPY_NUMBER_ALTERATION") {
                                domain = ["-2", "-1", "0", "1", "2"];
                                datatype = "ORDINAL";
                            }
                            const variable = new OriginalVariable(entry + "_" + profileId, symbol + "_" + profile.molecularAlterationType, datatype, profile.name + ": " + symbol, [], domain, this.createMolecularMapping(geneDict[entry], datatype), profileId);
                            this.rootStore.timepointStore.variableStores.sample.addVariableToBeDisplayed(variable);
                        }
                    }
                    this.rootStore.undoRedoStore.saveVariableHistory("ADD " + profile.name, HUGOsymbols, true)

                });
            }
        });
    }

    getMutations(profileId, HUGOsymbols, mappingType) {
        if (this.rootStore.cbioAPI.molecularProfiles.filter(d => d.molecularProfileId === profileId)[0].molecularAlterationType === "MUTATION_EXTENDED") {
            this.getMutationsProfile(HUGOsymbols, mappingType);
        }
        else {
            this.getMolecularProfile(profileId, HUGOsymbols);
        }

    }


    /**
     * creates sample id mapping for mutations
     * @param list
     * @param mappingType
     */
    createMutationMapping(list, mappingType) {
        let mappingFunction;
        if (mappingType === "binary") {
            mappingFunction = currentSample => (list.filter(d => d.sampleId === currentSample).length > 0)
        }
        else if (mappingType === "proteinChange") {
            mappingFunction = currentSample => {
                const entry = list.filter(d => d.sampleId === currentSample)[0];
                let proteinChange = undefined;
                if (entry !== undefined) {
                    proteinChange = entry.proteinChange;
                }
                return (proteinChange);
            }
        }
        else if (mappingType === "mutationType") {
            mappingFunction = currentSample => {
                const entries = list.filter(d => d.sampleId === currentSample);
                let mutationType = undefined;
                if (entries.length > 0) {
                    let indices = entries.map(d => this.mutationOrder.indexOf(d.mutationType));
                    mutationType = this.mutationOrder[Math.max(...indices)];
                }
                return mutationType;
            }
        }
        else {
            mappingFunction = currentSample => {
                const entry = list.filter(d => d.sampleId === currentSample && d.mutationType === "Missense_Mutation")[0];
                let vaf = undefined;
                if (entry !== undefined) {
                    vaf = entry.tumorAltCount / (entry.tumorAltCount + entry.tumorRefCount);
                }
                return (vaf);
            }
        }
        let mapper = {};
        this.rootStore.timepointStructure.forEach(d=> {
            d.forEach(f=> {
                if (list.length === 0) {
                    mapper[f.sample] = undefined;
                }
                else {
                    mapper[f.sample] = mappingFunction(f.sample);
                }
            });
        });
        return mapper;
    }

    static getMutationType(type) {
        let ret = "";
        type = (typeof type === "string") ? type.toLowerCase() : "";
        switch (type) {
            case "missense_mutation":
            case "missense":
            case "missense_variant":
                ret = "missense";
                break;
            case "frame_shift_ins":
            case "frame_shift_del":
            case "frameshift":
            case "frameshift_deletion":
            case "frameshift_insertion":
            case "de_novo_start_outofframe":
            case "frameshift_variant":
                ret = "frameshift";
                break;
            case "nonsense_mutation":
            case "nonsense":
            case "stopgain_snv":
                ret = "nonsense";
                break;
            case "splice_site":
            case "splice":
            case "splice site":
            case "splicing":
            case "splice_site_snp":
            case "splice_site_del":
            case "splice_site_indel":
            case "splice_region":
                ret = "splice";
                break;
            case "translation_start_site":
            case "start_codon_snp":
            case "start_codon_del":
                ret = "nonstart";
                break;
            case "nonstop_mutation":
                ret = "nonstop";
                break;
            case "fusion":
                ret = "fusion";
                break;
            case "in_frame_del":
            case "in_frame_ins":
            case "in_frame_deletion":
            case "in_frame_insertion":
            case "indel":
            case "nonframeshift_deletion":
            case "nonframeshift":
            case "nonframeshift insertion":
            case "nonframeshift_insertion":
                ret = "inframe";
                break;
            default:
                ret = "other";
                break;
        }
        switch (ret) {
            case "missense":
            case "inframe":
            case "fusion":
            case "other":
            default:
                ret = "trunc";
        }
        return ret;
    }

    createMolecularMapping(list, datatype) {
        let mapper = {};
        this.rootStore.timepointStructure.forEach(d=> {
            d.forEach(f=> {
                if (list.length === 0) {
                    mapper[f.sample] = undefined;
                }
                else {
                    let value = list.filter(d => d.sampleId === f.sample)[0].value;
                    if (datatype === "NUMBER") {
                        value = parseFloat(value);
                    }
                    mapper[f.sample] = value;
                }
            });
        });
        return mapper;
    }


}

export default MolProfileMapping