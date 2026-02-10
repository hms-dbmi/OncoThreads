/**
 * class that gets data from LocalFileLoader. Imitates CBioAPI
 */
import ErrorHandler from '../modules/services/ErrorHandler';
import type {
	Gene,
	ClinicalData,
	MolecularProfile,
	Mutation,
	MolecularData,
	EventsMap,
	ProfiledDict,
	ReturnDataCallback,
	IStudyDataAPI,
	IGeneResolver,
} from './types';

/** Minimal interface for the properties/methods FileAPI uses from LocalFileLoader */
interface ILocalFileLoader {
	patients: string[];
	samples: string[];
	molecularProfiles: MolecularProfile[];
	mutations: Mutation[];
	mutationCounts: ClinicalData[];
	panelMatrixParsed: string;
	genePanelsParsed: string;
	panelMatrix: Record<string, Record<string, string>>;
	genePanels: Map<string, string[]>;
	profileData: Map<string, Map<number, MolecularData[]>>;
	loadEvents(callback: ReturnDataCallback<EventsMap>): void;
	loadClinicalFile(isSample: boolean, callback: ReturnDataCallback<ClinicalData[]>): void;
}

class FileAPI implements IStudyDataAPI {
	localFileLoader: ILocalFileLoader;
	geneNamesAPI: IGeneResolver & { geneListLoaded: boolean };

	constructor(localFileLoader: ILocalFileLoader, geneNamesAPI: IGeneResolver & { geneListLoaded: boolean }) {
		this.localFileLoader = localFileLoader;
		this.geneNamesAPI = geneNamesAPI;
	}

	getPatients(callback: ReturnDataCallback<string[]>): void {
		callback(this.localFileLoader.patients);
	}

	getEvents(patients: string[], callback: ReturnDataCallback<EventsMap>): void {
		this.localFileLoader.loadEvents(callback);
	}

	getClinicalPatientData(callback: ReturnDataCallback<ClinicalData[]>): void {
		this.localFileLoader.loadClinicalFile(false, callback);
	}

	getAvailableMolecularProfiles(callback: ReturnDataCallback<MolecularProfile[]>): void {
		callback(this.localFileLoader.molecularProfiles);
	}

	getClinicalSampleData(callback: ReturnDataCallback<ClinicalData[]>): void {
		this.localFileLoader.loadClinicalFile(true, (clinicalData: ClinicalData[]) => {
			callback(clinicalData.concat(this.localFileLoader.mutationCounts));
		});
	}

	getMutations(entrezIDs: Gene[], profileId: string, callback: ReturnDataCallback<Mutation[]>): void {
		callback(
			this.localFileLoader.mutations.filter((d) =>
				entrezIDs.map((e) => e.hgncSymbol).includes(d.gene.hugoGeneSymbol)
			)
		);
	}

	areProfiled(genes: Gene[], profileId: string, callback: ReturnDataCallback<ProfiledDict>): void {
		const profiledDict: ProfiledDict = {};
		const profile = this.localFileLoader.molecularProfiles.filter(
			(d) => d.molecularProfileId === profileId
		)[0];
		let key = '';
		if (
			this.localFileLoader.panelMatrixParsed === 'finished' &&
			this.localFileLoader.genePanelsParsed === 'finished' &&
			(profile.molecularAlterationType === 'MUTATION_EXTENDED' ||
				profile.molecularAlterationType === 'COPY_NUMBER_ALTERATION')
		) {
			if (profile.molecularAlterationType === 'MUTATION_EXTENDED') {
				key = 'mutations';
			} else {
				key = 'cna';
			}
			this.localFileLoader.samples.forEach((d) => {
				profiledDict[d] = [];
				const panel = this.localFileLoader.panelMatrix[d][key];
				if (panel !== 'NA') {
					const panelGenes = this.localFileLoader.genePanels.get(panel);
					if (panelGenes) {
						genes.forEach((gene) => {
							if (panelGenes.includes(gene.hgncSymbol)) {
								profiledDict[d].push(gene.entrezGeneId);
							}
						});
					}
				}
			});
		} else {
			this.localFileLoader.samples.forEach((sample) => {
				profiledDict[sample] = genes.map((d) => d.entrezGeneId);
			});
		}
		callback(profiledDict);
	}

	getMolecularValues(profileId: string, entrezIDs: Gene[], callback: ReturnDataCallback<MolecularData[]>): void {
		let returnArr: MolecularData[] = [];
		entrezIDs.forEach((d) => {
			const profileMap = this.localFileLoader.profileData.get(profileId);
			if (profileMap && profileMap.has(d.entrezGeneId)) {
				returnArr = returnArr.concat(profileMap.get(d.entrezGeneId)!);
			}
		});
		callback(returnArr);
	}

	getGeneIDs(hgncSymbols: string[], callback: ReturnDataCallback<Gene[]>): void {
		if (this.geneNamesAPI.geneListLoaded) {
			this.geneNamesAPI.getGeneIDs(hgncSymbols, callback);
		} else {
			ErrorHandler.showWarning('Could not load gene list yet. Please try again.');
		}
	}
}

export default FileAPI;
