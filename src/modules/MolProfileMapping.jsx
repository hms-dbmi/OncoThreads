import OriginalVariable from "./TemporalHeatmap/OriginalVariable";
import * as d3 from "d3";


/*
gets the data with the cBioAPI and gives it to the other stores
 */
class MolProfileMapping {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.mutationOrder = ['trunc', 'inframe', 'promoter', 'missense', 'other'];
        this.currentMutations = {};
        this.isInGenePanel = {};
        this.currentMolecular = {};
        this.currentIds = [];

    }

    /**
     * Gets all currently selected mutations
     * @param filteredIds
     * @param mappingType
     */
    getMutationsProfile(filteredIds, mappingType) {
        let variables = [];
        let datatype;
        if (mappingType === "Binary") {
            datatype = "BINARY";
        }
        else if (mappingType === "Variant allele frequency") {
            datatype = "NUMBER"
        }
        else {
            datatype = "STRING"
        }
        filteredIds.forEach(d => {
            if (!this.rootStore.dataStore.variableStores.sample.isDisplayed(d.entrezGeneId + mappingType)) {
                let containedIds=[];
                if(d.entrezGeneId in this.currentMutations) {
                    containedIds = this.currentMutations[d.entrezGeneId];
                }
                let domain = [];
                if (mappingType === "Mutation type") {
                    domain = this.mutationOrder;
                }
                else if (mappingType === "Variant allele frequency") {
                    domain = [0, 1];
                }
                variables.push(new OriginalVariable(d.entrezGeneId + mappingType, d.hgncSymbol + "_" + mappingType, datatype, "Mutation in " + d.hgncSymbol, [], domain, this.createMutationMapping(containedIds, mappingType, d.entrezGeneId), mappingType,"gene"));
            }
        });
        return variables;
    }

    /**
     * gets data corresponding to selected HUGOsymbols in a molecular profile
     * @param filteredIds
     * @param profileId
     */
    getMolecularProfile(filteredIds, profileId) {
        let variables = [];
        const profile = this.rootStore.availableProfiles.filter(d => d.molecularProfileId === profileId)[0];
        if (this.currentMolecular[profileId].length !== 0) {
            filteredIds.forEach(d => {
                if (!this.rootStore.dataStore.variableStores.sample.isDisplayed(d.entrezGeneId)) {
                    const containedIds = this.currentMolecular[profileId].filter(entry => entry.entrezGeneId === d.entrezGeneId);
                    let domain = [];
                    let range = [];
                    let datatype = "NUMBER";
                    if (profile.molecularAlterationType === "COPY_NUMBER_ALTERATION") {
                        let helper = d3.scaleLinear().domain([0, 0.5, 1]).range(['#0571b0', '#f7f7f7', '#ca0020']);
                        domain = ["-2", "-1", "0", "1", "2"];
                        range = domain.map((d, i) => {
                            return helper(i / (domain.length - 1));
                        });
                        datatype = "ORDINAL";
                    }
                    variables.push(new OriginalVariable(d.entrezGeneId + "_" + profileId, d.hgncSymbol + "_" + profile.name, datatype, profile.name + ": " + d.hgncSymbol, range, domain, this.createMolecularMapping(containedIds, datatype), profileId,"gene"));
                }
            });
        }
        return variables;
    }

    /**
     * loads the entrezIDs corresponding to the HUGO Symbols
     * @param HUGOsymbols
     * @param callback
     */
    loadIds(HUGOsymbols, callback) {
        this.currentIds = [];
        this.currentMutations = {};
        this.currentMolecular = {};
        this.isInGenePanel = {};
        this.rootStore.cbioAPI.getGeneIDs(HUGOsymbols, entrezIDs => {
            this.currentIds = entrezIDs;

            callback();
        });
    }

    /**
     * filters currentIDs to exclude not available data
     * @param profileId
     * @returns {T[]}
     */
    filterMolecularData(profileId) {
        let noMutationsFound = [];
        this.currentIds.forEach(d => {
            const containedIds = this.currentMolecular[profileId].filter(entry => entry.entrezGeneId === d.entrezGeneId);
            if (containedIds.length === 0) {
                noMutationsFound.push({hgncSymbol: d.hgncSymbol, entrezGeneId: d.entrezGeneId});
            }
        });
        if (noMutationsFound.length > 0) {
            window.alert("WARNING: No data found for " + noMutationsFound.map(entry => entry.hgncSymbol) + " of profile " + this.rootStore.molecularProfiles.filter(d => d.molecularProfileId === profileId).name + "\n No track will be added");
        }
        return this.currentIds.filter(d => !(noMutationsFound.map(f => f.entrezGeneId).includes(d.entrezGeneId)));
    }

    /**
     * filters geneIDs based on if the genes were sequenced and if there are mutations
     */
    filterGeneIDs() {
        //Is gene panel sequenced?
        let notInPanel = this.currentIds.filter(entry => !(Object.values(this.isInGenePanel).join().includes(entry.entrezGeneId)));
        if (notInPanel.length > 0) {
            window.alert("Gene(s) " + notInPanel.map(d => d.hgncSymbol) + " not sequenced");
        }
        let availableIds = this.currentIds.filter(entry => Object.values(this.isInGenePanel).join().includes(entry.entrezGeneId));
        let noMutationsFound = [];
        //Are there mutations?
        availableIds.forEach(d => {
            if (!(d.entrezGeneId in this.currentMutations)) {
                noMutationsFound.push({hgncSymbol: d.hgncSymbol, entrezGeneId: d.entrezGeneId});
            }
        });
        let confirm = false;
        if (noMutationsFound.length > 0) {
            confirm = window.confirm("WARNING: No mutations found for " + noMutationsFound.map(entry => entry.hgncSymbol) + "\n Add anyway?");
        }
        if (!confirm) {
            availableIds = availableIds.filter(d => !(noMutationsFound.map(f => f.entrezGeneId).includes(d.entrezGeneId)));
        }
        return availableIds;
    }

    /**
     * loads mutation data
     * @param callback
     */
    loadMutations(callback) {
        if (this.currentIds.length !== 0) {
            this.currentIds.forEach(d => {
                if(d.entrezGeneId in this.rootStore.mutations) {
                    this.currentMutations[d.entrezGeneId] = this.rootStore.mutations[d.entrezGeneId];
                }
            });
            this.rootStore.cbioAPI.areProfiled(this.rootStore.study.studyId, this.currentIds.map(d => d.entrezGeneId), profiledDict => {
                this.isInGenePanel = profiledDict;
                callback()
            });
        }
    }

    /**
     * loads data for molecular profiles
     * @param profileId
     * @param callback
     */
    loadMolecularData(profileId, callback) {
        if (this.currentIds.length !== 0) {
            this.rootStore.cbioAPI.getMolecularValues(this.rootStore.study.studyId, profileId, this.currentIds, response => {
                this.currentMolecular[profileId] = response;
                callback()
            })
        }
    }

    /**
     * gets data for one molecular profile/one mutation mapping type
     * @param profileId
     * @param HUGOsymbols
     * @param mappingType
     * @param callback
     */
    getProfileData(profileId, HUGOsymbols, mappingType, callback) {
        this.loadIds(HUGOsymbols, () => {
            if (this.rootStore.availableProfiles.filter(d => d.molecularProfileId === profileId)[0].molecularAlterationType === "MUTATION_EXTENDED") {
                this.loadMutations(() => {
                    callback(this.getMutationsProfile(this.filterGeneIDs(), mappingType))
                });
            }
            else {
                this.loadMolecularData(profileId, () => {
                    callback(this.getMolecularProfile(this.filterMolecularData(profileId), profileId));
                });
            }
        })
    }

    /**
     * gets multiple profiles and mapping types at once
     * @param profileIds
     * @param mappingTypes
     * @returns {Array}
     */
    getMultipleProfiles(profileIds, mappingTypes) {
        let variables = [];
        let filteredGeneIds = [];
        if (mappingTypes.length > 0) {
            filteredGeneIds = this.filterGeneIDs();
        }
        mappingTypes.forEach(d => variables = variables.concat(this.getMutationsProfile(filteredGeneIds, d)));
        profileIds.forEach(d => {
                variables = variables.concat(this.getMolecularProfile(this.filterMolecularData(d), d));
            }
        );
        return variables
    }

        /**
     * creates sample id mapping for mutations
     * @param list
     * @param mappingType
     * @param entrezID
     */
    createMutationMapping(list, mappingType, entrezID) {
        let mappingFunction;
        if (mappingType === "Binary") {
            mappingFunction = currentSample => {
                return (list.filter(d => d.sampleId === currentSample).length > 0)
            };
        }
        else if (mappingType === "Protein change") {
            mappingFunction = currentSample => {
                const missense = list.filter(d => d.sampleId === currentSample && MolProfileMapping.getMutationType(d.mutationType) === "missense");
                const nonsense = list.filter(d => d.sampleId === currentSample && MolProfileMapping.getMutationType(d.mutationType) === "nonsense");
                let proteinChange = "wild type";
                if (missense.length > 0) {
                    proteinChange = missense[0].proteinChange;
                }
                else if (nonsense.length > 0) {
                    proteinChange = nonsense[0].proteinChange;
                }
                return (proteinChange);
            }
        }
        else if (mappingType === "Mutation type") {
            mappingFunction = currentSample => {
                const entries = list.filter(d => d.sampleId === currentSample);
                let mutationType = undefined;
                if (entries.length > 0) {
                    let indices = [];
                    entries.forEach(d => {
                        if ((d.proteinChange || "").toLowerCase() === "promoter") {
                            // promoter mutations aren't labeled as such in mutationType, but in proteinChange, so we must detect it there
                            indices.push(this.mutationOrder.indexOf("promoter"));
                        }
                        else {
                            let simplifiedMutationType = MolProfileMapping.getMutationType(d.mutationType);
                            if (simplifiedMutationType !== "fusion") {
                                if (simplifiedMutationType !== "missense" && simplifiedMutationType !== "inframe" && simplifiedMutationType !== "fusion" && simplifiedMutationType !== "other") {
                                    simplifiedMutationType = "trunc"
                                }
                                indices.push(this.mutationOrder.indexOf(simplifiedMutationType));
                            }
                        }
                    });
                    if (indices.length > 0) {
                        mutationType = this.mutationOrder[Math.min(...indices)];
                    }
                }
                return mutationType;
            }
        }
        else {
            mappingFunction = currentSample => {
                const missense = list.filter(d => d.sampleId === currentSample && MolProfileMapping.getMutationType(d.mutationType) === "missense");
                const nonsense = list.filter(d => d.sampleId === currentSample && MolProfileMapping.getMutationType(d.mutationType) === "nonsense");
                let vaf = 1;
                if (missense.length > 0) {
                    vaf = missense[0].vaf;
                }
                else if (nonsense.length > 0) {
                    vaf = nonsense[0].vaf;

                }
                return vaf;
            }
        }
        let mapper = {};
        this.rootStore.timepointStructure.forEach(d => {
            d.forEach(f => {
                if (this.isInGenePanel[f.sample].includes(entrezID)) {
                    mapper[f.sample] = mappingFunction(f.sample);
                }
                else mapper[f.sample] = undefined;
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

        return ret;
    }

    /**
     * creates mapping for a molecular profile
     * @param list
     * @param datatype
     */
    createMolecularMapping(list, datatype) {
        let mapper = {};
        this.rootStore.timepointStructure.forEach(d => {
            d.forEach(f => {
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