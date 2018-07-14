import {EsaRun, OrderChange, EsaSchedule} from './types';

// tslint:disable:no-unnecessary-type-annotation
const runKeys: (keyof EsaRun)[] = ['game', 'runners', 'platform', 'category'];

const findSimilarRunIndex = (run: EsaRun, target: EsaRun[]) =>
	target.findIndex(
		targetRun => runKeys.every(key => targetRun[key] === run[key])
	);

const separateUniqueAndIntersection = (
	iteratee: EsaRun[],
	target: EsaRun[]
) => {
	const uniqueRuns: EsaRun[] = [];
	const intersection: EsaRun[] = [];
	for (const iterateeRun of iteratee) {
		const similarTargetRunIndex = findSimilarRunIndex(iterateeRun, target);
		if (similarTargetRunIndex === -1) {
			uniqueRuns.push(iterateeRun);
		} else {
			intersection.push(iterateeRun);
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

	let orderChange: OrderChange;
	if (beforeRunIndex < similarAfterRunIndex) {
		orderChange = OrderChange.Down;
	} else if (beforeRunIndex > similarAfterRunIndex) {
		orderChange = OrderChange.Up;
	} else {
		orderChange = OrderChange.Same;
	}

	if (orderChange === OrderChange.Same) {
		return;
	}

	return {
		game: beforeRun.game,
		orderChange,
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
