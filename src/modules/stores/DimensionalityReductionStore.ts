import { makeObservable, observable, computed, action } from 'mobx';
import { PCA } from 'ml-pca';
import { UMAP } from 'umap-js';
import { TSNE } from '@keckelt/tsne';
import type { IPoint, INormPoint, ReferencedVariables, DRMethodType } from '../Type/Store';
import { isNumericValue } from '../UtilityClasses';

interface IDRDataSource {
	points: IPoint[];
	currentNonPatientVariables: string[];
	referencedVariables: ReferencedVariables;
}

/**
 * Store for dimensionality reduction computations (PCA, UMAP, t-SNE).
 * Extracted from DataStore to separate concerns.
 */
class DimensionalityReductionStore {
	DRMethod: DRMethodType = 'pca';
	private dataSource: IDRDataSource;

	constructor(dataSource: IDRDataSource) {
		this.dataSource = dataSource;

		makeObservable(this, {
			DRMethod: observable,
			normValues: computed,
			normPoints: computed,
			importancePCAScores: computed,
			importanceScores: computed,
			changeDRMethod: action,
		});
	}

	/**
	 * Normalized values for all points across all non-patient variables.
	 * Numeric values are min-max normalized, categorical values are index-based.
	 */
	get normValues(): number[][] {
		const { points, referencedVariables, currentNonPatientVariables } = this.dataSource;
		if (points.length === 0) return [];
		return points.map((point) =>
			point.value.map((value, i) => {
				const ref = referencedVariables[currentNonPatientVariables[i]];
				if (isNumericValue(value)) {
					const domain = ref.domain as number[];
					return domain[1] === domain[0] ? 0 : (value - domain[0]) / (domain[1] - domain[0]);
				} else if (ref.domain.length === 1) {
					return 0;
				} else {
					const domain = ref.domain;
					return domain.findIndex((d) => d === value) / (domain.length - 1);
				}
			})
		);
	}

	/**
	 * Points with normalized values and 2D dimensionality reduction positions.
	 */
	get normPoints(): INormPoint[] {
		const { normValues } = this;
		if (normValues.length === 0) return [];

		let norm2dValues: number[][] = [];

		if (normValues[0].length > 2) {
			if (this.DRMethod === 'pca') {
				const pca = new PCA(normValues);
				norm2dValues = pca.predict(normValues, { nComponents: 2 }).to2DArray();
			} else if (this.DRMethod === 'umap') {
				const umap = new UMAP({
					nComponents: 2,
					nEpochs: 400,
					nNeighbors: 15,
				});
				norm2dValues = umap.fit(normValues);
			} else if (this.DRMethod === 'tsne') {
				const tsne = new TSNE({
					dim: 2,
					perplexity: 10,
					epsilon: 100.0,
					iter: 500,
				});
				tsne.initDataRaw(normValues);
				tsne.initSolution();
				for (let i = 0; i < 500; i++) {
					tsne.step();
				}
				norm2dValues = tsne.getSolution();
			}
		} else {
			norm2dValues = normValues;
		}

		return normValues.map((d, i) => ({
			...this.dataSource.points[i],
			normValue: d,
			pos: norm2dValues[i],
		}));
	}

	/**
	 * PCA-based feature importance scores (eigenvector magnitudes).
	 */
	get importancePCAScores(): Array<{ id: string; name: string; score: number }> {
		if (this.normValues.length === 0 || this.normValues[0].length <= 1) return [];
		const { currentNonPatientVariables, referencedVariables } = this.dataSource;
		const pca = new PCA(this.normValues);
		const egiVector = pca.getEigenvectors();
		const importanceScores = egiVector
			.getColumn(0)
			.map((d: number, i: number) => Math.abs(d) + Math.abs(egiVector.getColumn(1)[i]));
		return importanceScores.map((score: number, i: number) => {
			const id = currentNonPatientVariables[i];
			const { name } = referencedVariables[id];
			return { id, name, score };
		});
	}

	/**
	 * Feature importance scores. Uses PCA scores when method is PCA,
	 * otherwise returns uniform scores.
	 */
	get importanceScores(): Array<{ id: string; name: string; score: number }> {
		if (this.DRMethod === 'pca') return this.importancePCAScores;
		const { currentNonPatientVariables, referencedVariables } = this.dataSource;
		return currentNonPatientVariables.map((id) => {
			const { name } = referencedVariables[id];
			return { name, score: 0.5, id };
		});
	}

	changeDRMethod = (methodName: DRMethodType): void => {
		if (methodName !== this.DRMethod) {
			this.DRMethod = methodName;
		}
	};
}

export default DimensionalityReductionStore;
