import {EsaRun, OrderChange, EsaSchedule} from './types';

// tslint:disable:no-unnecessary-type-annotation
const runKeys: (keyof EsaRun)[] = ['game', 'runners', 'platform', 'category'];

const findSimilarRunIndex = (run: EsaRun, target: EsaRun[]) =>
	target.findIndex(
		targetRun =>
			targetRun.game === run.game || targetRun.runners === run.runners
	);

const separateUniqueAndIntersection = (
	iteratee: EsaRun[],
	target: EsaRun[]
) => {
	const uniqueRuns: EsaRun[] = [];
	const intersection: EsaRun[] = [];
	for (const afterRun of iteratee) {
		const similarTargetRunIndex = findSimilarRunIndex(afterRun, target);
		if (similarTargetRunIndex === -1) {
			uniqueRuns.push(afterRun);
		} else {
			intersection.push(afterRun);
		}
	}

	return {uniqueRuns, intersection};
};

const calcRunChange = (
	beforeRun: EsaRun,
	beforeRunIndex: number,
	afterRuns: EsaRun[]
) => {
	const similarAfterRunIndex = findSimilarRunIndex(beforeRun, afterRuns);
	const afterRun = afterRuns[similarAfterRunIndex];

	let orderChange: OrderChange;
	if (beforeRunIndex < similarAfterRunIndex) {
		orderChange = OrderChange.Down;
	} else if (beforeRunIndex > similarAfterRunIndex) {
		orderChange = OrderChange.Up;
	} else {
		orderChange = OrderChange.Same;
	}

	const fieldChanges = runKeys
		.filter(key => beforeRun[key] !== afterRun[key])
		.map(key => ({
			field: key,
			before: beforeRun[key],
			after: afterRun[key],
		}));

	if (orderChange === OrderChange.Same && fieldChanges.length === 0) {
		return;
	}

	return {
		game: beforeRun.game,
		orderChange,
		fieldChanges,
	};
};

export const comparer = (before: EsaSchedule, after: EsaSchedule) => {
	const {
		uniqueRuns: deletedRuns,
		intersection: beforeIntersection,
	} = separateUniqueAndIntersection(before.runs, after.runs);
	const {
		uniqueRuns: addedRuns,
		intersection: afterIntersection,
	} = separateUniqueAndIntersection(after.runs, before.runs);

	const filteredRunChanges: (ReturnType<typeof calcRunChange> & {})[] = [];
	beforeIntersection
		.map((beforeRun, beforeRunIndex) =>
			calcRunChange(beforeRun, beforeRunIndex, afterIntersection)
		)
		.forEach(change => {
			if (change) {
				filteredRunChanges.push(change);
			}
		});

	return {
		deletedRuns,
		addedRuns,
		changedRuns: filteredRunChanges,
	};
};
