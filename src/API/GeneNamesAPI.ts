import axios from 'axios';
import { makeObservable, observable, action } from 'mobx';
import ErrorHandler from '../modules/services/ErrorHandler';
import type { Gene, ReturnDataCallback, IGeneResolver } from './types';

interface GeneNameDoc {
	symbol: string;
	entrez_id: string;
}

/**
 * Component for getting the mapping of hugoSymbols to entrezIDs for every possible gene (used before local files are loaded)
 */
class GeneNamesAPI implements IGeneResolver {
	geneListLoaded = false;
	geneList: Record<string, number>;

	constructor() {
		this.geneList = {};

		makeObservable(this, {
			geneListLoaded: observable,
			getAllGeneSymbols: action,
		});
	}

	getAllGeneSymbols = (): void => {
		axios
			.get<{ response: { docs: GeneNameDoc[] } }>('https://rest.genenames.org/fetch/status/Approved')
			.then((response) => {
				response.data.response.docs.forEach((d) => (this.geneList[d.symbol] = parseInt(d.entrez_id, 10)));
				this.geneListLoaded = true;
			})
			.catch((error: unknown) => {
				ErrorHandler.handleAPIError(error, 'Failed to load gene symbols');
			});
	};

	getGeneIDs(hgncSymbols: string[], callback: ReturnDataCallback<Gene[]>): void {
		const returnArray: Gene[] = [];
		const invalidSymbols: string[] = [];
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
			ErrorHandler.showWarning('No valid gene symbols found');
		} else {
			if (invalidSymbols.length > 0) {
				ErrorHandler.showWarning(`The following gene symbols are not valid: ${invalidSymbols}`);
			}
			callback(returnArray);
		}
	}
}

export default GeneNamesAPI;
