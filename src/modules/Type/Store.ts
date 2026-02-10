import { TPattern } from 'modules/UtilityClasses/prefixSpan';

export type TPointGroups = { [stateKey: string]: { stateKey: string; pointIdx: number[] } };

export interface IPoint {
	idx: number;
	patient: string;
	timeIdx: number;
	value: (number | string | boolean)[];
}

export interface INormPoint extends IPoint {
	normValue: number[];
	pos: number[];
}

export interface TimePoint {
	heatmap: HeatMap[];
	heatmapOrder: string[];
	type: 'between' | 'sample';
	isGrouped: boolean;
	customGrouped: Array<{ patients: string[]; partition: string; [key: string]: unknown }>;
	globalIndex: number;
	name: string;
	patients: string[];
	primaryVariableId: string;
	grouped: Array<{ patients: string[] }>;
	setPrimaryVariable(variableId: string): void;
	setHeatmapOrder(order: string[]): void;
	setIsGrouped(isGrouped: boolean): void;
	sortHeatmapLikeGroup(): void;
	applyCustomState(partitions: Array<{ partition: string; patients: string[] }>): void;
}

export type VariableDataType = 'NUMBER' | 'STRING' | 'BINARY' | 'ORDINAL';

export interface ReferencedVariables {
	[variableName: string]: {
		name: string;
		datatype: VariableDataType;
		domain: Domain;
		originalIds: string[];
		colorScale: TColorScale;
	};
}

export type Domain = string[] | number[] | boolean[];

export interface HeatMap {
	data: { patient: string; sample: string; value: string }[];
	variable: string; // attribute name
	isUndef: boolean;
}

export type TColorScale = (value: string | number) => string;

export interface IVariableStore {
	currentVariables: string[];
	fullCurrentVariables: Array<{ id: string; name: string; domain: Domain; colorScale: TColorScale }>;
	referencedVariables: ReferencedVariables;
	points: IPoint[];
	childStore: {
		timepoints: TimePoint[];
		updateNames(names: string[]): void;
	};
	resetVariables(): void;
	update(structure: unknown[], order: string[]): void;
	addVariableToBeDisplayed(variable: unknown): void;
	removeVariable(variableId: string): void;
}

export interface IDataStore {
	currentVariables: string[];
	pointGroups: TPointGroups;
	points: IPoint[];
	normPoints: INormPoint[];
	timepoints: TimePoint[];
	frequentPatterns: Array<[string[], TPattern]>;
	ngramResults: Array<[string[], string[]]>;
	colorScales: Array<TColorScale>;
	patientGroups: string[][];
	variableStores: {
		sample: IVariableStore;
		between: IVariableStore;
	};
}

export interface IRootStore {
	dataStore: IDataStore;
	patients: string[];
	clinicalPatientCategories: Array<{ id: string }>;
	timepointStructure: unknown[][];
	eventBlockStructure: unknown[][];
	[key: string]: unknown;
}

export interface IUndoRedoStore {
	[key: string]: unknown;
}

export type DRMethodType = 'pca' | 'umap' | 'tsne';

export type EncodingMetricType = 'ngram' | 'prefix';
