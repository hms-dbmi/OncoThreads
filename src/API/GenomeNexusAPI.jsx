import axios from 'axios';
import StudyAPI from './studyAPI';
import ErrorHandler from '../modules/services/ErrorHandler';

class GenomeNexusAPI {
	/**
	 * maps a HUGO Symbol to a entrez gene id
	 * @param {string[]} hgncSymbols
	 * @returns {AxiosPromise<any>}
	 */
	static genomNexusMappingMultipleSymbols(hgncSymbols, token) {
		return StudyAPI.callPostAPI('https://www.genomenexus.org/ensembl/canonical-gene/hgnc', token, {}, hgncSymbols);
	}

	/**
	 * gets hugo symbols for entrezIds
	 * @param {number[]} entrezIds
	 * @param {returnDataCallback} callback
	 */
	getHugoSymbols(entrezIds, callback) {
		axios
			.post('https://www.genomenexus.org/ensembl/canonical-gene/entrez', entrezIds)
			.then(function (response) {
				const mapper = {};
				response.data.forEach((d) => {
					mapper[d.entrezGeneId] = d.hugoSymbol;
				});
				callback(mapper);
			})
			.catch(function (error) {
				ErrorHandler.handleAPIError(error, 'Failed to resolve gene symbols');
			});
	}

	/**
	 * gets entrez gene ids for hgnc symbols
	 * @param {string[]} hgncSymbols
	 * @param {returnDataCallback} callback
	 */
	getGeneIDs(hgncSymbols, callback, token) {
		GenomeNexusAPI.genomNexusMappingMultipleSymbols(hgncSymbols, token)
			.then(function (response) {
				if (response.data.length === 0) {
					ErrorHandler.showWarning('No valid gene symbols found');
				} else {
					const invalidSymbols = [];
					hgncSymbols.forEach(function (d, i) {
						if (!response.data.map((entry) => entry.hugoSymbol).includes(d)) {
							invalidSymbols.push(d);
						}
					});
					if (invalidSymbols.length !== 0) {
						ErrorHandler.showWarning(`The following gene symbols are not valid: ${invalidSymbols}`);
					}
				}
				const hasEntrez = response.data.every((d) => 'entrezGeneId' in d);
				if (hasEntrez) {
					callback(
						response.data.map((d) => ({
							hgncSymbol: d.hugoSymbol,
							entrezGeneId: parseInt(d.entrezGeneId, 10),
						}))
					);
				} else {
					ErrorHandler.showError('Gene symbols could not be translated. Please check your input.');
				}
			})
			.catch(function (error) {
				ErrorHandler.handleAPIError(error, 'Failed to look up gene IDs');
			});
	}
}

export default GenomeNexusAPI;
