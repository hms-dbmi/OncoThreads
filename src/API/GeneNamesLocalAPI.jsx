import {action, extendObservable} from "mobx";
import data from "./HgncEntrez.txt";

import * as d3 from "d3";

/**
 * Component for getting the mapping of hugoSymbols to entrezIDs for every possible gene (used before local files are loaded)
 */
class GeneNamesLocalAPI {
    constructor() {
        this.geneList = {};
        extendObservable(this, {
            geneListLoaded: false,
            getAllGeneSymbols: action(() => {
                d3.tsv(data).then(data=>{
                    data.forEach(d=>{
                        this.geneList[d["Approved symbol"]]=parseInt(d["NCBI Gene ID(supplied by NCBI)"],10);
                    });
                    this.geneListLoaded=true;
                });
            })
        });
    }

    /**
     * gets entrez gene ids for hgnc symbols
     * @param {string[]} hgncSymbols
     * @param {returnDataCallback} callback
     */
    getGeneIDs(hgncSymbols, callback) {
        let returnArray = [];
        let invalidSymbols = [];
        hgncSymbols.forEach(d => {
            if (d in this.geneList) {
                returnArray.push({
                    hgncSymbol: d,
                    entrezGeneId: this.geneList[d]
                })
            }
            else {
                invalidSymbols.push(d);
            }
        });
        if (invalidSymbols.length === hgncSymbols.length) {
            alert("No valid symbols found");
        }
        else {
            if (invalidSymbols.length > 0) {
                alert('WARNING the following symbols are not valid: ' + invalidSymbols);
            }
            callback(returnArray);
        }
    }
}

export default GeneNamesLocalAPI;
