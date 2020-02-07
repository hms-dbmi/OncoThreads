import axios from 'axios';
import StudyAPI from './studyAPI';


class GenomeNexusAPI {
    /**
     * maps a HUGO Symbol to a entrez gene id
     * @param {string[]} hgncSymbols
     * @returns {AxiosPromise<any>}
     */
    static genomNexusMappingMultipleSymbols(hgncSymbols, token) {
        console.log("token = "+token);
        return StudyAPI.callPostAPI("https://www.genomenexus.org/ensembl/canonical-gene/hgnc", token, {}, hgncSymbols);
    }


    /**
     * gets hugo symbols for entrezIds
     * @param {number[]} entrezIds
     * @param {returnDataCallback} callback
     */
    getHugoSymbols(entrezIds, callback) {
        axios.post("https://www.genomenexus.org/ensembl/canonical-gene/entrez", entrezIds).then(function (response) {
            let mapper = {};
            response.data.forEach(d => {
                mapper[d.entrezGeneId] = d.hugoSymbol;
            });
            callback(mapper);
        }).catch(function (error) {
            if (GenomeNexusAPI.verbose) {
                console.log(error);
            }
            else {
                alert("invalid symbol")
            }
        })
    }

    /**
     * gets entrez gene ids for hgnc symbols
     * @param {string[]} hgncSymbols
     * @param {returnDataCallback} callback
     */
    getGeneIDs(hgncSymbols, callback, token) {
        GenomeNexusAPI.genomNexusMappingMultipleSymbols(hgncSymbols, token).then(function (response) {
            if (response.data.length === 0) {
                alert("No valid symbols found")
            }
            else {
                let invalidSymbols = [];
                hgncSymbols.forEach(function (d, i) {
                    if (!(response.data.map(entry => entry.hugoSymbol).includes(d))) {
                        invalidSymbols.push(d);
                    }
                });
                if (invalidSymbols.length !== 0) {
                    alert('WARNING the following symbols are not valid: ' + invalidSymbols);
                }
            }
            let hasEntrez = response.data.every(d => d.hasOwnProperty("entrezGeneId"));
            if (hasEntrez) {
                callback(response.data.map(d => ({
                    hgncSymbol: d.hugoSymbol,
                    entrezGeneId: parseInt(d.entrezGeneId, 10)
                })));
            }
            else {
                alert("ERROR: Symbols could not be translated");
            }
        }).catch(function (error) {
            if (GenomeNexusAPI.verbose) {
                console.log(error);
            }
            else {
                alert("invalid symbol")
            }
        })
    }
}

GenomeNexusAPI.verbose = true;
export default GenomeNexusAPI;