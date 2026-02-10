/* eslint-disable no-console */
import axios, { AxiosResponse } from 'axios';
import GenomeNexusAPI from './GenomeNexusAPI';
import StudyAPI from './studyAPI';
import ErrorHandler from '../modules/services/ErrorHandler';
import type {
	Gene,
	ClinicalEvent,
	ClinicalData,
	MolecularProfile,
	Mutation,
	MolecularData,
	EventsMap,
	ProfiledDict,
	SamplePanel,
	GenePanel,
	ReturnDataCallback,
	IStudyDataAPI,
} from './types';

interface PatientSummary {
	patientId: string;
}

/**
 * retrieves data using the cBio API
 */
class CBioAPI implements IStudyDataAPI {
	cBioLink: string;
	studyId: string;
	genomeNexusAPI: GenomeNexusAPI;
	allEvents: EventsMap | null;

	constructor(studyId: string, cBioLink: string) {
		this.cBioLink = cBioLink;
		this.studyId = studyId;
		this.genomeNexusAPI = new GenomeNexusAPI();
		this.allEvents = null;
	}

	getPatients(callback: ReturnDataCallback<string[]>, token?: string): void {
		StudyAPI.callGetAPI(
			`${this.cBioLink}/api/studies/${this.studyId}/patients?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC`,
			token,
			{}
		)
			.then((response: AxiosResponse<PatientSummary[]>) => {
				callback(response.data.map((patient) => patient.patientId));
			})
			.catch((error: unknown) => {
				ErrorHandler.handleAPIError(error, 'Failed to load patients');
			});
	}

	getEvents(patients: string[], callback: ReturnDataCallback<EventsMap>, token?: string): void {
		axios
			.all(
				patients.map((patient) =>
					StudyAPI.callGetAPI(
						`${this.cBioLink}/api/studies/${this.studyId}/patients/${patient}/clinical-events?projection=SUMMARY&pageSize=10000000&pageNumber=0&sortBy=startNumberOfDaysSinceDiagnosis&direction=ASC`,
						token,
						{}
					)
				)
			)
			.then((eventResults: AxiosResponse<ClinicalEvent[]>[]) => {
				const events: EventsMap = {};
				eventResults.forEach((response, i) => {
					events[patients[i]] = response.data;
				});

				this.allEvents = events;

				try {
					callback(events);
				} catch (callbackError) {
					console.error('Error in getEvents callback:', callbackError);
					const msg = callbackError instanceof Error ? callbackError.message : String(callbackError);
					ErrorHandler.showError(`Error processing clinical events: ${msg}`);
				}
			})
			.catch((error: unknown) => {
				ErrorHandler.handleAPIError(error, 'Failed to load clinical events');
			});
	}

	getClinicalPatientData(callback: ReturnDataCallback<ClinicalData[]>, token?: string): void {
		StudyAPI.callGetAPI(
			`${this.cBioLink}/api/studies/${this.studyId}/clinical-data?clinicalDataType=PATIENT&projection=DETAILED&pageSize=10000000&pageNumber=0&direction=ASC`,
			token,
			{}
		)
			.then((response: AxiosResponse<ClinicalData[]>) => {
				callback(response.data);
			})
			.catch((error: unknown) => {
				ErrorHandler.handleAPIError(error, 'Failed to load clinical patient data');
			});
	}

	getAvailableMolecularProfiles(callback: ReturnDataCallback<MolecularProfile[]>, token?: string): void {
		StudyAPI.callGetAPI(
			`${this.cBioLink}/api/studies/${this.studyId}/molecular-profiles?projection=SUMMARY&pageSize=10000000&pageNumber=0&direction=ASC`,
			token,
			{}
		)
			.then((response: AxiosResponse<MolecularProfile[]>) => {
				callback(response.data);
			})
			.catch((error: unknown) => {
				ErrorHandler.handleAPIError(error, 'Failed to load molecular profiles');
			});
	}

	getClinicalSampleData(callback: ReturnDataCallback<ClinicalData[]>, token?: string): void {
		StudyAPI.callGetAPI(
			`${this.cBioLink}/api/studies/${this.studyId}/clinical-data?clinicalDataType=SAMPLE&projection=DETAILED&pageSize=10000000&pageNumber=0&direction=ASC`,
			token,
			{}
		)
			.then((response: AxiosResponse<ClinicalData[]>) => {
				callback(response.data);
			})
			.catch((error: unknown) => {
				ErrorHandler.handleAPIError(error, 'Failed to load clinical sample data');
			});
	}

	getMutations(entrezIDs: Gene[], profileId: string, callback: ReturnDataCallback<Mutation[]>, token?: string): void {
		StudyAPI.callPostAPI(
			`${this.cBioLink}/api/molecular-profiles/${profileId}/mutations/fetch?projection=DETAILED&pageSize=10000000&pageNumber=0&direction=ASC`,
			token,
			{},
			{
				entrezGeneIds: entrezIDs.map((d) => d.entrezGeneId),
				sampleListId: `${this.studyId}_all`,
			}
		)
			.then((response: AxiosResponse<Mutation[]>) => {
				callback(response.data);
			})
			.catch((error: unknown) => {
				ErrorHandler.handleAPIError(error, 'Failed to load mutations');
			});
	}

	areProfiled(genes: Gene[], profileId: string, callback: ReturnDataCallback<ProfiledDict>, token?: string): void {
		const profiledDict: ProfiledDict = {};
		StudyAPI.callPostAPI(
			`${this.cBioLink}/api/molecular-profiles/${profileId}/gene-panel-data/fetch`,
			token,
			{},
			{
				sampleListId: `${this.studyId}_all`,
			}
		)
			.then((samplePanels: AxiosResponse<SamplePanel[]>) => {
				const differentPanels = [
					...new Set(samplePanels.data.filter((d) => 'genePanelId' in d).map((d) => d.genePanelId!)),
				];
				if (differentPanels.length > 0) {
					axios
						.all(differentPanels.map((d) => axios.get<GenePanel>(`${this.cBioLink}/api/gene-panels/${d}`)))
						.then((panelList: AxiosResponse<GenePanel>[]) => {
							samplePanels.data.forEach((samplePanel) => {
								profiledDict[samplePanel.sampleId] = [];
								genes.forEach((gene) => {
									if (samplePanel.genePanelId !== undefined) {
										const panelIndex = panelList
											.map((panel) => panel.data.genePanelId)
											.indexOf(samplePanel.genePanelId);
										if (
											panelIndex >= 0 &&
											panelList[panelIndex].data.genes
												.map((id) => id.entrezGeneId)
												.includes(gene.entrezGeneId)
										) {
											profiledDict[samplePanel.sampleId].push(gene.entrezGeneId);
										}
									} else {
										profiledDict[samplePanel.sampleId].push(gene.entrezGeneId);
									}
								});
							});
							callback(profiledDict);
						})
						.catch((error: unknown) => {
							ErrorHandler.handleAPIError(error, 'Failed to load gene panel data');
						});
				} else {
					samplePanels.data.forEach((samplePanel) => {
						if (samplePanel.profiled) {
							profiledDict[samplePanel.sampleId] = genes.map((d) => d.entrezGeneId);
						} else {
							profiledDict[samplePanel.sampleId] = [];
						}
					});
					callback(profiledDict);
				}
			})
			.catch((error: unknown) => {
				ErrorHandler.handleAPIError(error, 'Failed to check gene profiling status');
			});
	}

	getMolecularValues(
		profileId: string,
		entrezIDs: Gene[],
		callback: ReturnDataCallback<MolecularData[]>,
		token?: string
	): void {
		StudyAPI.callPostAPI(
			`${this.cBioLink}/api/molecular-profiles/${profileId}/molecular-data/fetch?projection=SUMMARY`,
			token,
			{},
			{
				entrezGeneIds: entrezIDs.map((d) => d.entrezGeneId),
				sampleListId: `${this.studyId}_all`,
			}
		)
			.then((response: AxiosResponse<MolecularData[]>) => {
				callback(response.data);
			})
			.catch((error: unknown) => {
				ErrorHandler.handleAPIError(error, 'Failed to load molecular data');
			});
	}

	getGeneIDs(hgncSymbols: string[], callback: ReturnDataCallback<Gene[]>, token?: string): void {
		this.genomeNexusAPI.getGeneIDs(hgncSymbols, callback, token);
	}
}

export default CBioAPI;
