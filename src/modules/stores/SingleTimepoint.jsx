import { makeObservable, observable, action, computed } from 'mobx';
import { isNumeric } from '../UtilityClasses';

/*
 stores information about a single timepoint
 */
class SingleTimepoint {
	constructor(rootStore, patients, type, localIndex, order) {
		this.rootStore = rootStore;
		this.type = type;
		this.patients = patients;
		this.globalIndex = localIndex;
		this.localIndex = localIndex;
		this.heatmapSorting = { variable: '', sortDir: 0 };

		this.heatmapOrder = order;
		this.groupSortDir = 1;
		this.heatmap = [];
		this.isGrouped = false;
		this.primaryVariableId = undefined;
		this.name = localIndex;
		this.customPartitions = [];

		makeObservable(this, {
			heatmapOrder: observable,
			groupSortDir: observable,
			heatmap: observable,
			isGrouped: observable,
			primaryVariableId: observable,
			name: observable,
			customPartitions: observable,
			grouped: computed,
			customGrouped: computed,
			setName: action,
			setIsGrouped: action,
			setGroupSortDir: action,
			setPrimaryVariable: action,
			setHeatmapOrder: action,
			reset: action,
			addRow: action,
			removeRow: action,
			updateRow: action,
			resortRows: action,
			sortHeatmapLikeGroup: action,
			sortHeatmap: action,
			sortGroup: action,
			magicSort: action,
			sort: action,
			group: action,
			promote: action,
			unGroup: action,
			applyCustomState: action,
		});
	}

	/**
	 * computes grouped layout based on current heatmap and order.
	 * @returns {object[]}
	 */
	get grouped() {
		const grouped = [];

		let variableDomain = this.rootStore.dataStore.variableStores[this.type]
			.getById(this.primaryVariableId)
			.domain.concat(undefined);
		if (this.groupSortDir === -1) {
			variableDomain = variableDomain.reverse();
		}
		variableDomain.forEach((partition) => {
			const currPatients = this.heatmap
				.filter((d) => d.variable === this.primaryVariableId)[0]
				.data.filter((d) => d.value === partition)
				.map((d) => d.patient);
			if (currPatients.length > 0) {
				const rows = [];
				this.heatmap.forEach((row) => {
					const counts = [];
					const { variable } = row;
					const isNumerical =
						isNumeric(this.rootStore.dataStore.variableStores[this.type].getById(variable).datatype);

					if (!isNumerical) {
						// Use the same logic as customGrouped for categorical variables
						row.data
							.filter((d) => currPatients.includes(d.patient))
							.forEach((d) => {
								const { value: key, patient } = d;
								const keyIdx = counts.map((c) => c.key).indexOf(key);

								if (keyIdx === -1) {
									counts.push({
										key,
										patients: [patient],
									});
								} else {
									counts[keyIdx].patients.push(patient);
								}
							});
					} else {
						// For numerical variables, each patient gets its own entry
						row.data
							.filter((d) => currPatients.includes(d.patient))
							.forEach((d) => {
								counts.push({ key: d.value, patients: [d.patient] });
							});
					}
					rows.push({ variable, counts });
				});
				grouped.push({ partition, patients: currPatients, rows });
			}
		});
		return grouped;
	}

	/**
	 * computes custom grouped layout based on current heatmap, order and time state
	 * @returns {object[]}
	 */
	get customGrouped() {
		const heatmap = this.heatmap;

		const result = this.customPartitions.map((partition) => {
			const { patients } = partition;

			const rows = heatmap.map((row) => {
				const counts = [];
				const { variable } = row;

				row.data
					.filter((d) => patients.includes(d.patient))
					.forEach((d) => {
						const { value: key, patient } = d;
						const keyIdx = counts.map((d) => d.key).indexOf(key);

						if (keyIdx === -1) {
							counts.push({
								key,
								patients: [patient],
							});
						} else {
							counts[keyIdx].patients.push(patient);
						}
					});

				return {
					variable,
					counts,
				};
			});

			const partitionRows = { ...partition, rows };

			// partitionRows.rows = currentVariables.map((variable, variableIdx) => {
			//     let counts = []
			//     patients.forEach(patient=>{

			//     })

			//     partitionPoints.forEach(point => {
			//         let key = points.value[variableIdx]
			//         let keyIdx = counts.map(d => d.key).indexOf(key)
			//         let patient = point.patient
			//         if (keyIdx === -1) {
			//             counts.push({
			//                 key,
			//                 patients: [patient]
			//             })
			//         } else {
			//             if (!(counts[keyIdx].patients.includes(patient))) {
			//                 counts[keyIdx].patients.push(patient)
			//             }
			//         }
			//     })

			//     return {
			//         variable,
			//         counts
			//     }
			// })

			return partitionRows;
		});

		return result;
	}

	/**
	 * sets timepoint name
	 * @param {string} name
	 */
	setName = (name) => {
		this.name = name;
	};

	/**
	 * sets isGrouped
	 * @param {boolean} isGrouped
	 */
	setIsGrouped = (isGrouped) => {
		this.isGrouped = isGrouped;
	};

	/**
	 * sets order in groups
	 * @param {number} newSortDir
	 */
	setGroupSortDir = (newSortDir) => {
		this.groupSortDir = newSortDir;
	};

	/**
	 * sets primary variable
	 * @param {string} id
	 */
	setPrimaryVariable = (id) => {
		this.primaryVariableId = id;
	};

	/**
	 * sets a new patient order for the heatmap
	 * @param {string[]} newOrder
	 */
	setHeatmapOrder = (newOrder) => {
		this.heatmapOrder.replace(newOrder);
	};

	/**
	 * resets the heatmap
	 */
	reset = () => {
		this.heatmap = [];
	};

	/**
	 * adds a row
	 * @param {string} variableId
	 * @param {object[]} variableData
	 */
	addRow = (variableId, variableData) => {
		this.heatmap.push({
			variable: variableId,
			data: variableData,
			isUndef: variableData.every((d) => d.value === undefined),
		});
		if (this.primaryVariableId === undefined) {
			this.setPrimaryVariable(variableId);
		}
	};

	/**
	 * removes a row
	 * @param {string} variableId
	 */
	removeRow = (variableId) => {
		let deleteIndex = -1;
		for (let i = 0; i < this.heatmap.length; i += 1) {
			if (this.heatmap[i].variable === variableId) {
				deleteIndex = i;
				break;
			}
		}
		this.heatmap.splice(deleteIndex, 1);
		if (this.heatmap.length < 1) {
			this.primaryVariableId = undefined;
		} else if (this.customPartitions.length === 0 && variableId === this.primaryVariableId) {
			const primaryIndex = this.rootStore.dataStore.variableStores[this.type].fullCurrentVariables
				.map((d) => isNumeric(d.datatype))
				.indexOf(false);
			if (this.isGrouped && primaryIndex !== -1) {
				this.setPrimaryVariable(this.heatmap[primaryIndex].variable);
			} else {
				this.setIsGrouped(false);
				this.setPrimaryVariable(this.heatmap[0].variable);
			}
		}
	};

	/**
	 * updates a row
	 * @param {number} index
	 * @param {string} variableId
	 * @param {object[]} variableData
	 */
	updateRow = (index, variableId, variableData) => {
		const isPrimary = this.heatmap[index].variable === this.primaryVariableId;
		this.heatmap[index].variable = variableId;
		this.heatmap[index].data = variableData;
		this.heatmap[index].isUndef = variableData.every((d) => d.value === undefined);
		if (isPrimary) {
			this.setPrimaryVariable(variableId);
		}
	};

	/**
	 * changes the order of the rows
	 * @param {string[]} newOrder
	 */
	resortRows = (newOrder) => {
		this.heatmap.replace(
			this.heatmap.slice().sort((a, b) => {
				if (newOrder.indexOf(a.variable) < newOrder.indexOf(b.variable)) {
					return -1;
				}
				if (newOrder.indexOf(a.variable) > newOrder.indexOf(b.variable)) {
					return 1;
				}
				return 0;
			})
		);
	};

	/**
	 * sorts the heatmap in the same way that the groups are sorted
	 */
	sortHeatmapLikeGroup = () => {
		this.sortHeatmap(this.primaryVariableId, this.groupSortDir);
	};

	/**
	 * sorts heatmap (sets new heatmap order)
	 * @param {string} variable
	 * @param {number} newSortDir
	 */
	sortHeatmap = (variableId, newSortDir) => {
		const varToSort = this.rootStore.dataStore.variableStores[this.type].getById(variableId);
		this.heatmapSorting = { variable: variableId, sortDir: newSortDir };
		const previousOrder = this.heatmapOrder.slice();
		const variableIndex = this.rootStore.dataStore.variableStores[this.type].currentVariables.indexOf(variableId);
		const helper = this.heatmapOrder.map((patient) => {
			const patientIndex = this.heatmap[variableIndex].data.map((d) => d.patient).indexOf(patient);
			if (patientIndex === -1) {
				return { patient, value: undefined };
			}
			return {
				patient,
				value: this.heatmap[variableIndex].data[patientIndex].value,
			};
		});
		// Treat undefined, null, and NaN as missing values
		const isMissing = (v) => v === undefined || v === null || (typeof v === 'number' && Number.isNaN(v));
		// first sort after primary variable values
		this.heatmapOrder.replace(
			helper
				.sort((a, b) => {
					const aMissing = isMissing(a.value);
					const bMissing = isMissing(b.value);

					// missing values accumulate on the right
					if (aMissing && !bMissing) return 1;
					if (!aMissing && bMissing) return -1;
					if (aMissing && bMissing) {
						return previousOrder.indexOf(a.patient) - previousOrder.indexOf(b.patient);
					}

					if (isNumeric(varToSort.datatype)) {
						if (a.value < b.value) return -newSortDir;
						if (a.value > b.value) return newSortDir;
					} else {
						if (varToSort.domain.indexOf(a.value) < varToSort.domain.indexOf(b.value)) {
							return -newSortDir;
						}
						if (varToSort.domain.indexOf(a.value) > varToSort.domain.indexOf(b.value)) {
							return newSortDir;
						}
					}

					return previousOrder.indexOf(a.patient) - previousOrder.indexOf(b.patient);
				})
				.map((d) => d.patient)
		);
	};

	/**
	 * sorts the groups of a timepoint
	 * @param {number} newSortDir
	 */
	sortGroup = (newSortDir) => {
		this.setGroupSortDir(newSortDir);
	};

	/**
	 * hierachical sorting of all rows plus realigning afterwards
	 * @param {string} variableId
	 */
	magicSort = (variableId) => {
		for (let i = 0; i < this.heatmap.length; i += 1) {
			this.sort(this.heatmap[i].variable);
			if (this.heatmap[i].variable === variableId) {
				break;
			}
		}
		this.rootStore.dataStore.applyPatientOrderToAll(this.globalIndex);
	};

	/**
	 * sorts the timepoint by a variable
	 * (handled differently for grouped and ungrouped timepoints)
	 * @param {string} variableId
	 */
	sort = (variableId) => {
		// case: the timepoint is grouped
		this.setPrimaryVariable(variableId);
		if (this.isGrouped) {
			this.sortGroup(-this.groupSortDir);
			// case: the timepoint is not grouped
		} else {
			// this.rootStore.uiStore.setRealTime(false);
			let currentSortDir = 1;
			if (this.heatmapSorting.variable === variableId) {
				currentSortDir = -this.heatmapSorting.sortDir;
			}
			this.sortHeatmap(variableId, currentSortDir);
		}
	};

	/**
	 * groups a timepoint
	 * @param {string} variableId
	 */
	group = (variableId) => {
		this.setPrimaryVariable(variableId);
		this.setIsGrouped(true);
	};

	/**
	 * promotes a timepoint
	 * @param {string} variableId
	 */
	promote = (variableId) => {
		this.setPrimaryVariable(variableId);
	};

	/**
	 * ungroupes a timepoint by swapping to the heatmap representation
	 * @param {string} variableId
	 */
	unGroup = (variableId) => {
		this.setPrimaryVariable(variableId);
		this.setIsGrouped(false);
	};

	/**
	 * group based customized grouping in the scatter plot
	 */
	applyCustomState = (customPartitions) => {
		this.customPartitions = customPartitions;
	};
}

export default SingleTimepoint;
