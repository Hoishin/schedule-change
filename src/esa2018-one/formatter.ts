import {comparer} from './comparer';

type ComparerResult = ReturnType<typeof comparer>;

const addedRunFormatter = (addedRuns: ComparerResult['addedRuns']) =>
	addedRuns
		.map(
			run =>
				`${run.game} by ${run.runners} (${run.platform}, ${
					run.category
				})`
		)
		.join('\n');

const deletedRunFormatter = (deletedRuns: ComparerResult['deletedRuns']) =>
	deletedRuns.map(run => run.game).join('\n');

const changedRunFormatter = (changedRuns: ComparerResult['changedRuns']) =>
	changedRuns
		.map(run => {
			if (!run) {
				return;
			}
			const fieldChanges = run.fieldChanges.map(
				({field, before, after}) => `${field}: ${before} -> ${after}`
			);
			return `
${run.game}: ${run.orderChange}
${fieldChanges.join('\t\n')}
`;
		})
		.join('\n');

const formatterGenerator = function*(result: ComparerResult) {
	if (result.addedRuns.length > 0) {
		yield `
**Added Runs**
${addedRunFormatter(result.addedRuns)}`;
	}

	if (result.deletedRuns.length > 0) {
		yield `
**Deleted Runs**
${deletedRunFormatter(result.deletedRuns)}
`;
	}

	if (result.changedRuns.filter(Boolean).length === 0) {
		return;
	}

	yield `
**Changed Runs**
${changedRunFormatter(result.changedRuns)}
`;
};

export const formatter = (compareResult: ComparerResult) => [...formatterGenerator(compareResult)];
