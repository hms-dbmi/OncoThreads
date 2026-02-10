import axios, { AxiosResponse } from 'axios';
import StudyAPI from './studyAPI';
import ErrorHandler from '../modules/services/ErrorHandler';
import type { Gene, GenomeNexusGene, GeneMapper, ReturnDataCallback, IGeneResolver } from './types';

class GenomeNexusAPI implements IGeneResolver {
	/**
	 * maps HUGO Symbols to entrez gene ids via Genome Nexus
	 */
	static genomNexusMappingMultipleSymbols(
		hgncSymbols: string[],
		token?: string
	): Promise<AxiosResponse<GenomeNexusGene[]>> {
		return StudyAPI.callPostAPI('https://www.genomenexus.org/ensembl/canonical-gene/hgnc', token, {}, hgncSymbols);
	}

	/**
	 * gets hugo symbols for entrezIds
	 */
	getHugoSymbols(entrezIds: number[], callback: ReturnDataCallback<GeneMapper>): void {
		axios
			.post<GenomeNexusGene[]>('https://www.genomenexus.org/ensembl/canonical-gene/entrez', entrezIds)
			.then(function (response) {
				const mapper: GeneMapper = {};
				response.data.forEach((d) => {
					mapper[d.entrezGeneId] = d.hugoSymbol;
				});
				callback(mapper);
			})
			.catch(function (error: unknown) {
				ErrorHandler.handleAPIError(error, 'Failed to resolve gene symbols');
			});
	}

	/**
	 * gets entrez gene ids for hgnc symbols
	 */
	getGeneIDs(hgncSymbols: string[], callback: ReturnDataCallback<Gene[]>, token?: string): void {
		GenomeNexusAPI.genomNexusMappingMultipleSymbols(hgncSymbols, token)
			.then(function (response) {
				if (response.data.length === 0) {
					ErrorHandler.showWarning('No valid gene symbols found');
				} else {
					const invalidSymbols: string[] = [];
					hgncSymbols.forEach(function (d) {
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
							entrezGeneId: parseInt(String(d.entrezGeneId), 10),
						}))
					);
				} else {
					ErrorHandler.showError('Gene symbols could not be translated. Please check your input.');
				}
			})
			.catch(function (error: unknown) {
				ErrorHandler.handleAPIError(error, 'Failed to look up gene IDs');
			});
	}
}

export default GenomeNexusAPI;
