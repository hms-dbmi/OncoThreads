import { makeObservable, observable, computed, action } from 'mobx';
import { message } from 'antd';
import { getUniqueKeyName, PrefixSpan, clusterfck } from 'modules/UtilityClasses';
import NGram from '../UtilityClasses/ngram';
import type { IPoint, INormPoint, TPointGroups, EncodingMetricType } from '../Type/Store';

interface IGroupingDataSource {
	points: IPoint[];
	normPoints: INormPoint[];
	patients: string[];
	clinicalPatientCategories: Array<{ id: string }>;
	variableStores: {
		sample: {
			childStore: {
				timepoints: Array<{ applyCustomState(partitions: unknown[]): void }>;
			};
		};
		between: {
			childStore: {
				timepoints: Array<{ applyCustomState(partitions: unknown[]): void }>;
			};
		};
	};
}

/**
 * Store for patient grouping, state analysis, and custom group management.
 * Extracted from DataStore to separate concerns.
 */
class PatientGroupingStore {
	encodingMetric: EncodingMetricType = 'ngram';
	ngram: NGram = new NGram([], [], 1);
	numofStates: number = 3;
	pointGroups: TPointGroups = {};
	stateLabels: Record<string, string> = {};
	patientGroups: string[][] = [];
	hasEvent: boolean = false;

	private dataSource: IGroupingDataSource;

	constructor(dataSource: IGroupingDataSource) {
		this.dataSource = dataSource;

		makeObservable(this, {
			numofStates: observable,
			pointGroups: observable,
			stateLabels: observable,
			patientGroups: observable,
			hasEvent: observable,
			patientGroupNum: computed,
			patientStates: computed,
			maxTime: computed,
			medTime: computed,
			frequentPatterns: computed,
			ngramResults: computed,
			patientEncodings: computed,
			changePatientGroupNum: action,
			changeClusterNum: action,
			toggleHasEvent: action,
			setStateLabel: action,
			resetStateLabel: action,
			autoGroup: action,
			updatePointGroups: action,
			deletePointGroup: action,
			applyCustomGroups: action,
		});
	}

	get patientGroupNum(): number {
		return this.patientGroups.length;
	}

	/**
	 * The state sequence of each patient.
	 */
	get patientStates(): Record<string, string[]> {
		const { points } = this.dataSource;
		const { pointGroups } = this;
		const patientStates: Record<string, string[]> = {};

		const sortedPoints = [...points].sort((a, b) => a.timeIdx - b.timeIdx);
		sortedPoints.forEach((point) => {
			const { idx, patient } = point;
			const group = Object.values(pointGroups).find((pg) => pg.pointIdx.includes(idx));
			const stateKey = group?.stateKey;
			if (!patientStates[patient]) {
				patientStates[patient] = [];
			}
			if (!stateKey) return;
			patientStates[patient].push(stateKey);
		});

		return patientStates;
	}

	get maxTime(): number {
		const { points } = this.dataSource;
		return Math.max(...points.map((d) => d.timeIdx)) + 1;
	}

	get medTime(): number {
		const { points } = this.dataSource;
		const midIdx = Math.floor(points.length / 2);
		return [...points].map((d) => d.timeIdx + 1).sort((a, b) => a - b)[midIdx];
	}

	/**
	 * Frequent state transition patterns using PrefixSpan.
	 */
	get frequentPatterns(): Array<[string[], string[]]> {
		const { patientStates } = this;
		const sequences = Object.values(patientStates);
		const patients = Object.keys(patientStates);
		const minSupport = Math.max(patients.length * 0.2, 2);
		const maxLen = 2;
		const minLen = 2;
		const prefixSpan = new PrefixSpan();
		let results = prefixSpan.frequentPatterns(sequences, minSupport, minLen, maxLen);
		results = results.map((d: [number[], string[]]) => [d[0].map((i: number) => patients[i]), d[1]]);
		return results;
	}

	get ngramResults(): Array<[string[], string[]]> {
		const { patientStates } = this;
		const { patients } = this.dataSource;
		const ngram = new NGram(
			patients.map((p) => patientStates[p]),
			[2, 3],
			patients.length * 0.03
		);
		return ngram.getNGram().map((d: { seqCounts: number[]; ngram: string[] }) => {
			return [patients.filter((_: string, i: number) => d.seqCounts[i] > 0), d.ngram];
		});
	}

	get patientEncodings(): Array<{ patient: string; encoding: number[] }> {
		const { patients } = this.dataSource;
		let patientEncodings: Array<{ patient: string; encoding: number[] }>;

		if (this.encodingMetric === 'prefix') {
			patientEncodings = patients.map((p) => ({ patient: p, encoding: [] }));
			const { frequentPatterns } = this;
			if (frequentPatterns.length === 0) {
				message.error('Cannot group patients without frequent patterns!');
			}
			frequentPatterns.forEach((d) => {
				const [patientList] = d;
				patientEncodings.forEach((pe) => {
					pe.encoding.push(patientList.includes(pe.patient) ? 1 : 0);
				});
			});
		} else {
			// ngram encoding
			const { patientStates } = this;
			const ngram = new NGram(
				patients.map((p) => patientStates[p]),
				[2, 3],
				patients.length * 0.03
			);
			this.ngram = ngram;
			patientEncodings = patients.map((p, i) => ({
				patient: p,
				encoding: ngram.arrEncodings[i],
			}));
		}

		return patientEncodings;
	}

	changePatientGroupNum = (num: number): void => {
		if (typeof num !== 'number') return;
		if (num === 0) return;
		if (num === this.patientGroups.length) return;
		const { patients } = this.dataSource;
		if (num === 1) {
			this.patientGroups = [[...patients]];
			return;
		}

		const { patientEncodings } = this;
		const patientClusters = clusterfck.hcluster(
			patientEncodings.map((d) => d.encoding),
			'euclidean',
			'complete',
			Infinity,
			num
		);

		if (patientClusters.length < num) {
			message.error('Cannot further divide patients!');
			return;
		}

		this.patientGroups = patientClusters.map(
			(d: { itemIdx: number[] }) => d.itemIdx.map((i: number) => patients[i])
		);
	};

	changeClusterNum = (num: number): void => {
		if (typeof num !== 'number') return;
		this.numofStates = num;
		this.autoGroup();
		this.applyCustomGroups();
	};

	toggleHasEvent = (): void => {
		this.hasEvent = !this.hasEvent;
	};

	setStateLabel = (stateKey: string, stateLabel: string): void => {
		this.stateLabels[stateKey] = stateLabel;
	};

	resetStateLabel = (): void => {
		this.stateLabels = {};
	};

	autoGroup = (): void => {
		const normPoints = this.dataSource.normPoints;
		if (normPoints.length === 0) return;

		const { numofStates } = this;
		const clusters = clusterfck.hcluster(
			normPoints.map((d) => d.pos),
			'euclidean',
			'average',
			Infinity,
			numofStates
		);
		const pointGroups: TPointGroups = {};
		clusters.forEach((d: { itemIdx: number[] }, i: number) => {
			const stateKey = getUniqueKeyName(i, []);
			pointGroups[stateKey] = {
				stateKey,
				pointIdx: d.itemIdx,
			};
		});
		this.pointGroups = pointGroups;
	};

	updatePointGroups = (pointGroups: TPointGroups): void => {
		this.pointGroups = pointGroups;
		this.numofStates = Object.keys(pointGroups).length;
		this.applyCustomGroups();
	};

	deletePointGroup = (stateKey: string): void => {
		const NONAME = 'undefined';
		if (!this.pointGroups[NONAME]) {
			this.pointGroups[NONAME] = { ...this.pointGroups[stateKey], stateKey: NONAME };
		} else {
			const pointIdx1 = this.pointGroups[stateKey].pointIdx;
			const pointIdx2 = this.pointGroups[NONAME].pointIdx;
			this.pointGroups[NONAME] = {
				pointIdx: pointIdx1.concat(pointIdx2),
				stateKey: NONAME,
			};
		}
		delete this.pointGroups[stateKey];
		this.applyCustomGroups();
	};

	applyCustomGroups = (): void => {
		const { points } = this.dataSource;
		const { pointGroups } = this;

		// Check for unselected nodes
		const allSelected = Object.values(pointGroups)
			.map((d) => d.pointIdx)
			.flat();
		if (allSelected.length < points.length) {
			const leftNodes = points.map((_: IPoint, i: number) => i).filter((i: number) => !allSelected.includes(i));
			const newStateKey = getUniqueKeyName(Object.keys(pointGroups).length, Object.keys(pointGroups));
			pointGroups[newStateKey] = {
				stateKey: newStateKey,
				pointIdx: leftNodes,
			};
		}

		const timeStates: Array<{ timeIdx: number; partitions: Array<{ partition: string; patients: string[] }> }> = [];
		const uniqueTimeIds = [...new Set(points.map((p) => p.timeIdx))];

		uniqueTimeIds.forEach((timeIdx) => {
			timeStates.push({ timeIdx, partitions: [] });
		});

		// Push points to corresponding time state
		Object.values(pointGroups).forEach((state) => {
			const { stateKey } = state;
			state.pointIdx.forEach((id) => {
				const { patient, timeIdx } = points[id];
				const timeState = timeStates[timeIdx];
				const partitionIdx = timeState.partitions.map((d) => d.partition).indexOf(stateKey);
				if (partitionIdx > -1) {
					timeState.partitions[partitionIdx].patients.push(patient);
				} else {
					timeState.partitions.push({ partition: stateKey, patients: [patient] });
				}
			});
		});

		// Create event states
		const eventStates = [timeStates[0]];
		for (let i = 0; i < timeStates.length - 1; i++) {
			const eventState: { timeIdx: number; partitions: Array<{ partition: string; patients: string[] }> } = {
				timeIdx: i + 1,
				partitions: [],
			};
			const curr = timeStates[i];
			const next = timeStates[i + 1];

			curr.partitions.forEach((currPartition) => {
				const { partition: currName, patients: currPatients } = currPartition;
				let remainPatients = currPatients;

				next.partitions.forEach((nextPartition) => {
					const { partition: nextName, patients: nextPatients } = nextPartition;
					const intersection = currPatients.filter((d) => nextPatients.includes(d));
					remainPatients = remainPatients.filter((d) => !intersection.includes(d));
					if (intersection.length > 0) {
						eventState.partitions.push({
							partition: `${currName}-${nextName}`,
							patients: intersection,
						});
					}
				});

				if (remainPatients.length > 0) {
					eventState.partitions.push({
						partition: `${currName}->none`,
						patients: remainPatients,
					});
				}
			});

			eventStates.push(eventState);
		}

		eventStates.push({
			...timeStates[timeStates.length - 1],
			timeIdx: timeStates.length,
		});

		const { variableStores } = this.dataSource;
		const sampleTimepoints = variableStores.sample.childStore.timepoints;
		const eventTimepoints = variableStores.between.childStore.timepoints;

		sampleTimepoints.forEach((TP, i) => {
			TP.applyCustomState(timeStates[i].partitions);
		});

		eventTimepoints.forEach((TP, i) => {
			TP.applyCustomState(eventStates[i].partitions);
		});
	};

	/**
	 * Reset all grouping state.
	 */
	reset(): void {
		this.hasEvent = false;
		this.stateLabels = {};
		this.pointGroups = {};
		this.numofStates = 3;
		this.patientGroups = [];
	}
}

export default PatientGroupingStore;
