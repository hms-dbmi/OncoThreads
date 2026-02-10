import { makeObservable, observable, action, computed, observe } from 'mobx';
import VariableStore from './VariableStore';
import DimensionalityReductionStore from './DimensionalityReductionStore';
import PatientGroupingStore from './PatientGroupingStore';

/*
 stores information about timepoints. Combines betweenTimepoints and sampleTimepoints.
 Acts as a facade delegating DR and grouping logic to sub-stores.
 */
class DataStore {
	rootStore;
	numberOfPatients = 300;
	variableStores;

	timepoints = []; // all timepoints
	selectedPatients = []; // currently selected patients
	globalPrimary = ''; // global primary for sample timepoints of global timeline

	constructor(rootStore) {
		this.rootStore = rootStore;
		this.variableStores = {
			sample: new VariableStore(rootStore, 'sample'),
			between: new VariableStore(rootStore, 'between'),
		};

		// Create sub-stores with data source accessors pointing back to this DataStore
		const dataStore = this;
		const dataSource = {
			get points() {
				return dataStore.points;
			},
			get normPoints() {
				return dataStore.normPoints;
			},
			get currentNonPatientVariables() {
				return dataStore.currentNonPatientVariables;
			},
			get referencedVariables() {
				return dataStore.referencedVariables;
			},
			get patients() {
				return rootStore.patients;
			},
			get clinicalPatientCategories() {
				return rootStore.clinicalPatientCategories;
			},
			get variableStores() {
				return dataStore.variableStores;
			},
		};

		this.drStore = new DimensionalityReductionStore(dataSource);
		this.groupingStore = new PatientGroupingStore(dataSource);
		this.groupingStore.patientGroups = [[...rootStore.patients]];

		makeObservable(this, {
			timepoints: observable,
			selectedPatients: observable,
			globalPrimary: observable,
			maxPartitions: computed,
			transitionOn: computed,
			sampleOn: computed,
			points: computed,
			colorScales: computed,
			sampleFeatureDomains: computed,
			patientDomains: computed,
			currentVariables: computed,
			currentNonPatientVariables: computed,
			referencedVariables: computed,
			setGlobalPrimary: action,
			toggleRealtime: action,
			handlePatientSelection: action,
			handlePartitionSelection: action,
			resetSelection: action,
			reset: action,
			combineTimepoints: action,
			initialize: action,
			update: action,
			applyPatientOrderToAll: action,
			recombine: action,
		});

		observe(this.variableStores.between.currentVariables, () => {
			this.recombine();
		});
		observe(this.variableStores.sample.currentVariables, () => {
			this.recombine();
		});
	}

	// ===== Proxy getters for DimensionalityReductionStore =====

	get DRMethod() {
		return this.drStore.DRMethod;
	}

	get normValues() {
		return this.drStore.normValues;
	}

	get normPoints() {
		return this.drStore.normPoints;
	}

	get importancePCAScores() {
		return this.drStore.importancePCAScores;
	}

	get importanceScores() {
		return this.drStore.importanceScores;
	}

	get changeDRMethod() {
		return this.drStore.changeDRMethod;
	}

	// ===== Proxy getters for PatientGroupingStore =====

	get encodingMetric() {
		return this.groupingStore.encodingMetric;
	}

	get ngram() {
		return this.groupingStore.ngram;
	}

	get numofStates() {
		return this.groupingStore.numofStates;
	}

	get pointGroups() {
		return this.groupingStore.pointGroups;
	}

	set pointGroups(value) {
		this.groupingStore.pointGroups = value;
	}

	get stateLabels() {
		return this.groupingStore.stateLabels;
	}

	get patientGroups() {
		return this.groupingStore.patientGroups;
	}

	set patientGroups(value) {
		this.groupingStore.patientGroups = value;
	}

	get hasEvent() {
		return this.groupingStore.hasEvent;
	}

	get patientGroupNum() {
		return this.groupingStore.patientGroupNum;
	}

	get patientStates() {
		return this.groupingStore.patientStates;
	}

	get maxTime() {
		return this.groupingStore.maxTime;
	}

	get medTime() {
		return this.groupingStore.medTime;
	}

	get frequentPatterns() {
		return this.groupingStore.frequentPatterns;
	}

	get ngramResults() {
		return this.groupingStore.ngramResults;
	}

	get patientEncodings() {
		return this.groupingStore.patientEncodings;
	}

	get changePatientGroupNum() {
		return this.groupingStore.changePatientGroupNum;
	}

	get changeClusterNum() {
		return this.groupingStore.changeClusterNum;
	}

	get toggleHasEvent() {
		return this.groupingStore.toggleHasEvent;
	}

	get setStateLabel() {
		return this.groupingStore.setStateLabel;
	}

	get resetStateLabel() {
		return this.groupingStore.resetStateLabel;
	}

	get updatePointGroups() {
		return this.groupingStore.updatePointGroups;
	}

	get deletePointGroup() {
		return this.groupingStore.deletePointGroup;
	}

	// ===== Core computed properties =====

	get maxPartitions() {
		let maxPartitions = 0;
		const { patientGroups } = this.groupingStore;
		const groupedTP = this.timepoints.filter((d) => d.isGrouped);
		if (this.rootStore.uiStore.selectedTab === 'block') {
			maxPartitions = Math.max(...groupedTP.map((d) => d.grouped.length), 0);
		} else {
			patientGroups.forEach((patientGroup) => {
				const partitions = [];
				this.timepoints.forEach((tp) => {
					let count = 0;
					tp.customGrouped.forEach((customGroup) => {
						const numPatients = customGroup.patients.filter((p) => patientGroup.includes(p));
						if (numPatients.length > 0) count += 1;
					});
					partitions.push(count);
				});
				maxPartitions += Math.max(...partitions, 0) + 1;
			});
		}
		return maxPartitions;
	}

	get transitionOn() {
		return this.variableStores.between.currentVariables.length > 0;
	}

	get sampleOn() {
		return this.variableStores.sample.currentVariables.length > 0;
	}

	get points() {
		const samplePoints = this.variableStores.sample.points;
		const eventPoints = this.variableStores.between.points;
		if (this.groupingStore.hasEvent === false || eventPoints.length === 0) {
			return samplePoints;
		} else {
			return samplePoints.map((p, i) => {
				const newPoint = { ...p };
				newPoint.value = newPoint.value.concat(eventPoints[i].value);
				return newPoint;
			});
		}
	}

	get colorScales() {
		const sampleScales = this.variableStores.sample.fullCurrentVariables.map((d) => d.colorScale);
		const eventScales = this.variableStores.between.fullCurrentVariables.map((d) => d.colorScale);
		if (this.groupingStore.hasEvent === false) {
			return sampleScales;
		} else {
			return sampleScales.concat(eventScales);
		}
	}

	get sampleFeatureDomains() {
		const sampleDomains = this.currentNonPatientVariables.map((id) => {
			return this.variableStores.sample.referencedVariables[id].domain;
		});
		const eventDomains = this.variableStores.between.fullCurrentVariables.map((d) => d.domain);
		if (this.groupingStore.hasEvent === false) {
			return sampleDomains;
		} else {
			return sampleDomains.concat(eventDomains);
		}
	}

	get patientDomains() {
		const patientVars = this.rootStore.clinicalPatientCategories.map((d) => d.id);
		return this.currentVariables
			.filter((id) => patientVars.includes(id))
			.map((id) => this.variableStores.sample.referencedVariables[id].domain);
	}

	get currentVariables() {
		if (this.groupingStore.hasEvent === false) {
			return this.variableStores.sample.currentVariables;
		} else {
			return this.variableStores.sample.currentVariables.concat(this.variableStores.between.currentVariables);
		}
	}

	get currentNonPatientVariables() {
		const patientVars = this.rootStore.clinicalPatientCategories.map((d) => d.id);
		return this.currentVariables.filter(
			(id) =>
				!(
					patientVars.includes(id) ||
					this.referencedVariables[id].originalIds.every((d) => patientVars.includes(d))
				)
		);
	}

	get referencedVariables() {
		if (this.groupingStore.hasEvent === false) {
			return this.variableStores.sample.referencedVariables;
		} else {
			return {
				...this.variableStores.sample.referencedVariables,
				...this.variableStores.between.referencedVariables,
			};
		}
	}

	// ===== Actions =====

	setGlobalPrimary = (varId) => {
		this.globalPrimary = varId;
	};

	toggleRealtime = () => {
		this.realTime = !this.realTime;
	};

	handlePatientSelection = (patient) => {
		if (this.selectedPatients.includes(patient)) {
			this.selectedPatients.remove(patient);
		} else {
			this.selectedPatients.push(patient);
		}
	};

	handlePartitionSelection = (patients) => {
		let isContained = true;
		patients.forEach((d) => {
			if (!this.selectedPatients.includes(d)) {
				isContained = false;
			}
		});
		if (!isContained) {
			patients.forEach((d) => {
				if (!this.selectedPatients.includes(d)) {
					this.selectedPatients.push(d);
				}
			});
		} else {
			patients.forEach((d) => {
				this.selectedPatients.remove(d);
			});
		}
	};

	resetSelection = () => {
		this.selectedPatients.clear();
	};

	reset = () => {
		this.timepoints.replace([]);
		this.selectedPatients.clear();
		this.globalPrimary = '';
		this.groupingStore.reset();
		this.variableStores.sample.resetVariables();
		this.variableStores.between.resetVariables();
	};

	combineTimepoints = (sampleOn, transitionOn) => {
		const betweenTimepoints = this.variableStores.between.childStore.timepoints;
		const sampleTimepoints = this.variableStores.sample.childStore.timepoints;
		let timepoints = [];
		if (!transitionOn) {
			timepoints = sampleTimepoints;
		} else {
			if (sampleOn) {
				for (let i = 0; i < sampleTimepoints.length; i += 1) {
					timepoints.push(betweenTimepoints[i]);
					betweenTimepoints[i].setHeatmapOrder(sampleTimepoints[i].heatmapOrder);
					timepoints.push(sampleTimepoints[i]);
				}
				betweenTimepoints[betweenTimepoints.length - 1].setHeatmapOrder(
					sampleTimepoints[sampleTimepoints.length - 1].heatmapOrder
				);
				timepoints.push(betweenTimepoints[betweenTimepoints.length - 1]);
			} else {
				timepoints = betweenTimepoints;
			}
		}
		timepoints.forEach((timepoint, i) => {
			timepoints[i].globalIndex = i;
			const variableId = this.variableStores[timepoint.type].currentVariables[0];
			timepoints[i].setPrimaryVariable(variableId);
		});
		this.timepoints.replace(timepoints);
	};

	initialize = () => {
		this.numberOfPatients = this.rootStore.patients.length;
		this.variableStores.sample.resetVariables();
		this.variableStores.sample.update(this.rootStore.timepointStructure, this.rootStore.patients);
		this.variableStores.between.resetVariables();
		this.variableStores.between.update(this.rootStore.eventBlockStructure, this.rootStore.patients);
		this.combineTimepoints(true, false);
		this.rootStore.visStore.resetTransitionSpaces();
		this.groupingStore.patientGroups = [this.rootStore.patients];
	};

	update = (order) => {
		this.variableStores.sample.update(this.rootStore.timepointStructure, order);
		this.variableStores.between.update(this.rootStore.eventBlockStructure, order);
		this.combineTimepoints(this.sampleOn, this.transitionOn);
	};

	applyPatientOrderToAll = (timepointIndex) => {
		if (this.timepoints[timepointIndex].isGrouped) {
			this.timepoints[timepointIndex].sortHeatmapLikeGroup();
		}
		const sorting = this.timepoints[timepointIndex].heatmapOrder;
		this.timepoints.forEach((d) => {
			d.setHeatmapOrder(sorting);
		});
	};

	recombine = () => {
		const sampleOn = this.variableStores.sample.currentVariables.length > 0;
		const transOn = this.variableStores.between.currentVariables.length > 0;
		this.combineTimepoints(sampleOn, transOn);
		if (transOn) {
			this.rootStore.uiStore.setRealTime(false);
		}
		if (sampleOn || transOn) {
			this.rootStore.visStore.resetTransitionSpaces();
		}
	};

	// Delegate to grouping store
	autoGroup = () => {
		this.groupingStore.autoGroup();
	};

	applyCustomGroups = () => {
		this.groupingStore.applyCustomGroups();
	};

	// ===== Utility methods =====

	getNumTPPartitions(index) {
		if (this.timepoints[index].isGrouped) {
			return this.timepoints[index].grouped.length;
		}
		return 0;
	}

	getNumTPPatients(index) {
		return this.timepoints[index].patients.length;
	}

	getAllValues(mapper, type) {
		const allValues = [];
		const structure = type === 'sample' ? this.rootStore.timepointStructure : this.rootStore.eventBlockStructure;
		structure.forEach((d) => d.forEach((f) => allValues.push(mapper[f.sample])));
		return allValues;
	}

	removeVariable(variableID) {
		const sampleVariables = this.variableStores.sample.currentVariables;
		if (sampleVariables.includes(variableID)) {
			this.variableStores['sample'].removeVariable(variableID);
		} else {
			this.variableStores['between'].removeVariable(variableID);
		}
	}
}

export default DataStore;
