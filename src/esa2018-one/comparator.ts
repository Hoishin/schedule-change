import * as JsDiff from 'diff';
import {EsaSchedule, EsaRun} from './types';

const runKeys: (keyof EsaRun)[] = ['game', 'runners', 'platform', 'category']

export const comparator = (before: EsaSchedule, after: EsaSchedule) => {
	if (
		process.env.SLS_STAGE !== 'development' &&
		before.data.updatedAt === after.data.updatedAt
	) {
		return;
	}

	return JsDiff.diffArrays(before.runs, after.runs, {
		comparator: (a, b) => Number(runKeys.every(key => a[key] === b[key])),
		ignoreCase: false,
	});
};
