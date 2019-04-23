import OriginalVariable from "./TemporalHeatmap/stores/OriginalVariable";

/*
gets mutation and molecular data on demand and transforms the data to variables
 */
class MolProfileMapping {
    constructor(rootStore) {
        this.rootStore = rootStore;
        this.mutationOrder = ['trunc', 'inframe', 'promoter', 'missense', 'other']; // "importance" order of mutation types
        this.currentMutations = []; // current mutations
        this.currentPanels = {}; // current gene panel mapping
        this.currentMolecular = {}; // current molecular data (maps arrays of molecular data to profile ids
        this.currentIds = []; // current entrezIds
    }

    /**
     * Gets all currently selected mutations
     * @param {Object[]} filteredIds
     * @param {string} mappingType
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
                let containedIds = this.currentMutations.filter(mutation => mutation.gene.hugoGeneSymbol === d.hgncSymbol);
                let domain = [];
                if (mappingType === "Mutation type") {
                    domain = this.mutationOrder;
                }
                else if (mappingType === "Variant allele frequency") {
                    domain = [0, 1];
                }
                variables.push(new OriginalVariable(d.entrezGeneId + mappingType, d.hgncSymbol + "_" + mappingType, datatype, "Mutation in " + d.hgncSymbol, [], domain, this.createMutationMapping(containedIds, mappingType, d.entrezGeneId), mappingType, "gene"));
            }
        });
        return variables;
    }

    /**
     * gets data corresponding to selected HUGOsymbols in a molecular profile
     * @param {Object[]} filteredIds
     * @param {string} profileId
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
                    if (profile.datatype === "DISCRETE") {
                        if (profile.molecularAlterationType === "COPY_NUMBER_ALTERATION") {
                            datatype = "ORDINAL";
                            domain = ["-2", "-1", "0", "1", "2"];
                            range = ['#0571b0', '#f7f7f7', '#ca0020'];
                        }
                        else {
                            datatype = "STRING";
                        }
                    }
                    variables.push(new OriginalVariable(d.entrezGeneId + "_" + profileId, d.hgncSymbol + "_" + profile.name, datatype, profile.name + ": " + d.hgncSymbol, range, domain, this.createMolecularMapping(containedIds, datatype), profileId, "molecular"));
                }
            });
        }
        return variables;
    }

    /**
     * loads the entrezIDs corresponding to the HUGO Symbols
     * @param {string[]} HUGOsymbols
     * @param {loadFinishedCallback} callback
     */
    loadIds(HUGOsymbols, callback) {
        this.currentIds = [];
        this.currentMutations = [];
        this.currentMolecular = {};
        this.currentPanels = {};
        this.rootStore.api.getGeneIDs(HUGOsymbols, entrezIDs => {
            this.currentIds = entrezIDs;
            callback();
        });
    }

    /**
     * Gets the profiles that contain data for the currently selected ids
     * @param {string[]} HUGOsymbols
     * @param {returnDataCallback} callback
     */
    getDataContainingProfiles(HUGOsymbols, callback) {
        let loaded = new Array(this.rootStore.availableProfiles.length).fill(false);
        const setLoaded = (index) => {
            loaded[index] = true;
            if (loaded.every(d => d === true)) {
                callback(Object.keys(this.currentPanels));
            }
        };
        this.loadIds(HUGOsymbols, () => {
                this.rootStore.availableProfiles.forEach((profile, i) => {
                    this.rootStore.api.areProfiled(this.currentIds, profile.molecularProfileId, profileDict => {
                        if (profile.molecularAlterationType === "MUTATION_EXTENDED") {
                            if (Object.keys(profileDict).join().length > 0) {
                                this.loadMutations(profile.molecularProfileId, () => {
                                    if (this.currentMutations.length > 0) {
                                        this.currentPanels[profile.molecularProfileId] = profileDict;
                                    }
                                    setLoaded(i);
                                })
                            }
                            else setLoaded(i);
                        }
                        else {
                            if (Object.keys(profileDict).join().length > 0) {
                                this.loadMolecularData(profile.molecularProfileId, () => {
                                    if (this.currentMolecular[profile.molecularProfileId].length > 0) {
                                        this.currentPanels[profile.molecularProfileId] = profileDict;
                                    }
                                    setLoaded(i);
                                })
                            }
                            else setLoaded(i);
                        }
                    });
                });
            }
        );
    }

    /**
     * filters currentIDs to exclude not available data
     * @param {string} profileId
     * @returns {Object[]} filtered ids
     */
    filterMolecularData(profileId) {
        const profileName = this.rootStore.availableProfiles.filter(d => d.molecularProfileId === profileId)[0].name;
        // Is panel measured?
        let notInPanel = this.currentIds.filter(entry => !(Object.values(this.currentPanels[profileId]).join().includes(entry.entrezGeneId)));
        if (notInPanel.length > 0) {
            window.alert("Gene(s) " + notInPanel.map(d => d.hgncSymbol) + " not measured in profile " + profileName);
        }
        let availableIds = this.currentIds.filter(entry => Object.values(this.currentPanels[profileId]).join().includes(entry.entrezGeneId));
        let noMutationsFound = [];
        // Was there any data?
        availableIds.forEach(d => {
            const containedIds = this.currentMolecular[profileId].filter(entry => entry.entrezGeneId === d.entrezGeneId);
            if (containedIds.length === 0) {
                noMutationsFound.push({hgncSymbol: d.hgncSymbol, entrezGeneId: d.entrezGeneId});
            }
        });
        if (noMutationsFound.length > 0) {
            window.alert("WARNING: No data found for " + noMutationsFound.map(entry => entry.hgncSymbol) + " of profile " + profileName + "\n No track will be added");
        }
        return availableIds.filter(d => !(noMutationsFound.map(f => f.entrezGeneId).includes(d.entrezGeneId)));
    }

    /**
     * filters geneIDs based on if the genes were sequenced and if there are mutations
     * @return {Object[]} filtered ids
     */
    filterGeneIDs() {
        //Is gene panel sequenced?
        let profileId = this.rootStore.availableProfiles.filter(d => d.molecularAlterationType === "MUTATION_EXTENDED")[0].molecularProfileId;
        let notInPanel = this.currentIds.filter(entry => !(Object.values(this.currentPanels[profileId]).join().includes(entry.entrezGeneId)));
        if (notInPanel.length > 0) {
            window.alert("Gene(s) " + notInPanel.map(d => d.hgncSymbol) + " not sequenced");
        }
        let availableIds = this.currentIds.filter(entry => Object.values(this.currentPanels[profileId]).join().includes(entry.entrezGeneId));
        let noMutationsFound = [];
        //Are there mutations?
        availableIds.forEach(d => {
            if (!(this.currentMutations.map(d => d.gene.hugoGeneSymbol).includes(d.hgncSymbol))) {
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
     * @param {string} profileId
     * @param {loadFinishedCallback} callback
     */
    loadMutations(profileId, callback) {
        if (this.currentIds.length !== 0) {
            this.rootStore.api.getMutations(this.currentIds, profileId, mutations => {
                this.currentMutations = mutations;
                callback()
            });
        }
    }

    /**
     * loads data for molecular profiles
     * @param {string} profileId
     * @param {loadFinishedCallback} callback
     */
    loadMolecularData(profileId, callback) {
        if (this.currentIds.length !== 0) {
            this.rootStore.api.getMolecularValues(profileId, this.currentIds, response => {
                this.currentMolecular[profileId] = response;
                callback()
            })
        }
    }

    /**
     * gets data for one molecular profile/one mutation mapping type
     * @param {string} profileId
     * @param {string[]} HUGOsymbols
     * @param {string} mappingType
     * @param {returnDataCallback} callback
     */
    getProfileData(profileId, HUGOsymbols, mappingType, callback) {
        this.loadIds(HUGOsymbols, () => {
            this.rootStore.api.areProfiled(this.currentIds, profileId, profileDict => {
                this.currentPanels[profileId] = profileDict;
                if (this.rootStore.availableProfiles.filter(d => d.molecularProfileId === profileId)[0].molecularAlterationType === "MUTATION_EXTENDED") {
                    this.loadMutations(profileId, () => {
                        callback(this.getMutationsProfile(this.filterGeneIDs(), mappingType))
                    });
                }
                else {
                    this.loadMolecularData(profileId, () => {
                        callback(this.getMolecularProfile(this.filterMolecularData(profileId), profileId));
                    });
                }
            });
        });
    }

    /**
     * gets multiple profiles and mapping types at once
     * @param {string[]} profileIds
     * @param {string[]} mappingTypes
     * @returns {OriginalVariable[]} array of new variables
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
        return variables;
    }

    /**
     * creates sample id mapping for mutations
     * @param {Object[]} list - list of muatation data
     * @param {string} mappingType - current mapping type (Binary, Protein change, Mutation type, Variant Allele Frequency)
     * @param {number} entrezID - current entrezID
     * @return {Object} mapper sampleID - value
     */
    createMutationMapping(list, mappingType, entrezID) {
        let mappingFunction;
        let profileId = this.rootStore.availableProfiles.filter(d => d.molecularAlterationType === "MUTATION_EXTENDED")[0].molecularProfileId;
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
                                if (simplifiedMutationType !== "missense" && simplifiedMutationType !== "inframe" && simplifiedMutationType !== "other") {
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
                let vaf = undefined;
                let altCount = -1;
                let refCount = -1;
                if (missense.length > 0) {
                    altCount = missense[0].tumorAltCount;
                    refCount = missense[0].tumorRefCount;
                }
                else if (nonsense.length > 0) {
                    altCount = nonsense[0].tumorAltCount;
                    refCount = nonsense[0].tumorRefCount;
                }
                if (altCount !== -1 && refCount !== -1) {
                    vaf = altCount / (altCount + refCount);
                }
                return vaf;
            }
        }
        let mapper = {};
        this.rootStore.timepointStructure.forEach(d => {
            d.forEach(f => {
                if (this.currentPanels[profileId][f.sample].includes(entrezID)) {
                    mapper[f.sample] = mappingFunction(f.sample);
                }
                else mapper[f.sample] = undefined;
            });
        });
        return mapper;
    }

    /**
     * get simplified mutation type
     * @param {string} type - raw mutation type
     * @returns {string}
     */
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
     * @param {Object[]} list - array of molecular data
     * @param {string} datatype - current data type
     * @return {Object} mapper sampleId - molecular value
     */
    createMolecularMapping(list, datatype) {
        let mapper = {};
        this.rootStore.timepointStructure.forEach(row => {
            row.forEach(element => {
                if (list.filter(d => d.sampleId === element.sample) === 0) {
                    mapper[element.sample] = undefined;
                }
                else {
                    let value = list.filter(d => d.sampleId === element.sample)[0].value;
                    if (datatype === "NUMBER") {
                        if (value !== "NA") {
                            value = parseFloat(value);
                        }
                        else {
                            value = undefined;
                        }
                    }
                    mapper[element.sample] = value;
                }
            });
        });
        return mapper;
    }
}

export default MolProfileMapping