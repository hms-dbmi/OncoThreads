import { makeObservable, observable, action } from 'mobx';
import data from './HgncEntrez.txt';

import * as d3 from 'd3';
import { message } from 'antd';

/**
 * Component for getting the mapping of hugoSymbols to entrezIDs for every possible gene (used before local files are loaded)
 */
class GeneNamesLocalAPI {
	geneListLoaded = false;

	constructor() {
		this.geneList = {};

		makeObservable(this, {
			geneListLoaded: observable,
			getAllGeneSymbols: action,
		});
	}

	getAllGeneSymbols = () => {
		d3.tsv(data).then(
			action((data) => {
				data.forEach((d) => {
					this.geneList[d['Approved symbol']] = parseInt(d['NCBI Gene ID(supplied by NCBI)'], 10);
				});
				this.geneListLoaded = true;
			})
		);
	};

	/**
	 * gets entrez gene ids for hgnc symbols
	 * @param {string[]} hgncSymbols
	 * @param {returnDataCallback} callback
	 */
	getGeneIDs(hgncSymbols, callback) {
		const returnArray = [];
		const invalidSymbols = [];
		hgncSymbols.forEach((d) => {
			if (d in this.geneList) {
				returnArray.push({
					hgncSymbol: d,
					entrezGeneId: this.geneList[d],
				});
			} else {
				invalidSymbols.push(d);
			}
		});
		if (invalidSymbols.length === hgncSymbols.length) {
			message.warning({ content: 'No valid gene symbols found', duration: 6 });
		} else {
			if (invalidSymbols.length > 0) {
				message.warning({
					content: `The following gene symbols are not valid: ${invalidSymbols}`,
					duration: 9,
				});
			}
			callback(returnArray);
		}
	}
}

export default GeneNamesLocalAPI;
