import { AxiosResponse } from 'axios';

// ===== Core domain types =====

export interface Gene {
	hgncSymbol: string;
	entrezGeneId: number;
}

export interface EventAttribute {
	key: string;
	value: string;
}

export interface ClinicalEvent {
	eventType: string;
	startNumberOfDaysSinceDiagnosis: number;
	endNumberOfDaysSinceDiagnosis?: number;
	attributes: EventAttribute[];
}

export interface ClinicalAttribute {
	displayName: string;
	datatype: 'STRING' | 'NUMBER';
	description: string;
}

export interface ClinicalData {
	patientId: string;
	sampleId?: string;
	clinicalAttributeId: string;
	clinicalAttribute: ClinicalAttribute;
	value: string;
}

export interface MolecularProfile {
	molecularProfileId: string;
	name: string;
	molecularAlterationType: string;
	datatype?: 'DISCRETE' | 'CONTINUOUS';
}

export interface Mutation {
	gene: { hugoGeneSymbol: string; entrezGeneId: number };
	sampleId: string;
	mutationType: string;
	proteinChange?: string;
	tumorRefCount?: number;
	tumorAltCount?: number;
	VAF?: number;
}

export interface MolecularData {
	entrezGeneId: number;
	sampleId: string;
	value: string | number;
}

export interface Study {
	studyId: string;
	name: string;
	description: string;
	cancerTypeId: string;
	cancerType?: { name: string };
}

export interface GenomeNexusGene {
	hugoSymbol: string;
	entrezGeneId: number;
	geneId: string;
}

export interface SamplePanel {
	sampleId: string;
	genePanelId?: string;
	profiled: boolean;
}

export interface GenePanel {
	genePanelId: string;
	genes: { entrezGeneId: number }[];
}

// ===== Callback types =====
export type ReturnDataCallback<T> = (data: T) => void;

// ===== Composite return types =====
export type EventsMap = Record<string, ClinicalEvent[]>;
export type ProfiledDict = Record<string, number[]>;
export type GeneMapper = Record<number, string>;

// ===== Shared API interface (CBioAPI & FileAPI are interchangeable) =====
export interface IStudyDataAPI {
	getPatients(callback: ReturnDataCallback<string[]>, token?: string): void;
	getEvents(patients: string[], callback: ReturnDataCallback<EventsMap>, token?: string): void;
	getClinicalPatientData(callback: ReturnDataCallback<ClinicalData[]>, token?: string): void;
	getAvailableMolecularProfiles(callback: ReturnDataCallback<MolecularProfile[]>, token?: string): void;
	getClinicalSampleData(callback: ReturnDataCallback<ClinicalData[]>, token?: string): void;
	getMutations(entrezIDs: Gene[], profileId: string, callback: ReturnDataCallback<Mutation[]>, token?: string): void;
	areProfiled(genes: Gene[], profileId: string, callback: ReturnDataCallback<ProfiledDict>, token?: string): void;
	getMolecularValues(
		profileId: string,
		entrezIDs: Gene[],
		callback: ReturnDataCallback<MolecularData[]>,
		token?: string
	): void;
	getGeneIDs(hgncSymbols: string[], callback: ReturnDataCallback<Gene[]>, token?: string): void;
}

// ===== Gene name resolver interface (GeneNamesAPI, GeneNamesLocalAPI, GenomeNexusAPI) =====
export interface IGeneResolver {
	getGeneIDs(hgncSymbols: string[], callback: ReturnDataCallback<Gene[]>, token?: string): void;
}
