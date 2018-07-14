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
	iterateeRun: EsaRun,
	iterateeRunIndex: number,
	targetRuns: EsaRun[]
) => {
	const similarTargetRun = findSimilarRunIndex(iterateeRun, targetRuns);

	let orderChange: OrderChange;
	if (iterateeRunIndex < similarTargetRun) {
		orderChange = OrderChange.Up;
	} else if (iterateeRunIndex > similarTargetRun) {
		orderChange = OrderChange.Down;
	} else {
		orderChange = OrderChange.Same;
	}

	if (orderChange === OrderChange.Same) {
		return;
	}

	return {
		game: iterateeRun.game,
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
	afterIntersection
		.map((afterRun, afterRunIndex) =>
			calcRunChange(afterRun, afterRunIndex, beforeIntersection)
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
