import {URL} from 'url';
import _ from 'lodash';
import {scheduleChange} from './lib';
import {Horaro} from './types';

const url = new URL(
	'https://horaro.org/-/api/v1/events/esa/schedules/2018-one'
);

const searchColumnIndex = (columnName: string, columns: string[]) =>
	columns.findIndex(column => column.toLowerCase().includes(columnName));

const removeMarkdownLink = (markdownLink: string | null) => markdownLink ? markdownLink.replace(/\[([^\]]*)\]\(([^\)]*)\)/g, '$1') : null;

export default () => {
	scheduleChange(
		'ESA2018-ONE',
		url,
		(rawData: Horaro) => {
			const columns = rawData.data.columns;
			return {
				schedule: rawData.data.items.map(item => ({
					game: removeMarkdownLink(item.data[searchColumnIndex('game', columns)]),
					runners: removeMarkdownLink(item.data[searchColumnIndex('player', columns)]),
					platform: removeMarkdownLink(item.data[searchColumnIndex('platform', columns)]),
					category: removeMarkdownLink(item.data[searchColumnIndex('category', columns)]),
				})),
				data: {
					updatedAt: rawData.data.updated,
				},
			};
		},
		(before, after) => {
			type RunWithIndex = typeof before.schedule[0] & {index: number};

			/**
			 * Step 1: Deep diff old and new runs with same index,
			 * and store every unique run with indices
			 */
			const beforeLength = before.schedule.length;
			const afterLength = after.schedule.length;
			const afterIsLonger = beforeLength < afterLength;

			const onlyInBefore: RunWithIndex[] = [];
			const onlyInAfter: RunWithIndex[] = [];

			for (let i = 0; i < before.schedule.length; i++) {
				const beforeRun = before.schedule[i];
				const afterRun = after.schedule[i];
				if (_.isEqual(beforeRun, afterRun)) {
					continue;
				}
				onlyInBefore.push({...beforeRun, index: i});
				onlyInAfter.push({...afterRun, index: i});
			}
			if (afterIsLonger === true) {
				const afterReminders = after.schedule
					.slice(beforeLength)
					.map((run, i) => ({
						...run,
						index: beforeLength + i,
					}));
				onlyInAfter.push(...afterReminders);
			}

			// If nothing has been changed, exit
			if (onlyInBefore.length === 0 && onlyInAfter.length === 0) {
				return;
			}

			console.table(onlyInBefore)
			console.table(onlyInAfter)

			/**
			 * Step 2: For each of the stored runs,
			 * find pairs of old and new runs with same game title and/or same runners' name
			 */
			const areSimilarRuns = (
				beforeRun: RunWithIndex,
				afterRun: RunWithIndex
			) => {
				if (beforeRun.game === afterRun.game) {
					return true;
				}
				if (beforeRun.runners === afterRun.runners) {
					return true;
				}
				return false;
			};

			const similarRunPairs: {
				before: RunWithIndex;
				after: RunWithIndex;
			}[] = [];
			const deletedRuns: RunWithIndex[] = [];
			for (const beforeRun of onlyInBefore) {
				const indexOfSimilarAfterRun = onlyInAfter.findIndex(afterRun =>
					areSimilarRuns(beforeRun, afterRun)
				);
				console.table(indexOfSimilarAfterRun)
				if (indexOfSimilarAfterRun >= 0) {
					similarRunPairs.push({
						before: beforeRun,
						after: onlyInAfter[indexOfSimilarAfterRun],
					});
					onlyInAfter.splice(indexOfSimilarAfterRun, 1);
				} else {
					deletedRuns.push(beforeRun);
				}
			}
			const addedRuns = onlyInAfter;

			/**
			 * Step 3: If any of the pairs have different indices, report it as "order change".
			 * If any of the pairs have different game title or player names, report it as "schedule change".
			 */
			const diffColumns: Array<keyof typeof before.schedule[0]> = [
				'game',
				'category',
				'platform',
				'runners',
			];
			const orderChange: {title: string; order: OrderMove}[] = [];
			const scheduleChange: {
				title: string;
				column: string;
				before: string | null;
				after: string | null;
			}[] = [];

			for (const pair of similarRunPairs) {
				if (pair.before.index !== pair.after.index) {
					const orderMove =
						pair.before.index < pair.after.index
							? OrderMove.Down
							: OrderMove.Up;
					orderChange.push({
						title:
							pair.before.game ||
							pair.after.game ||
							'(NOT FOUND)',
						order: orderMove,
					});
				}

				for (const column of diffColumns) {
					if (pair.before[column] !== pair.after[column]) {
						scheduleChange.push({
							title:
								pair.before.game ||
								pair.after.game ||
								'(NOT FOUND)',
							column,
							before: pair.before[column],
							after: pair.after[column],
						});
					}
				}
			}

			/**
			 * Step 4: Report
			 */
			let report = '';
			if (orderChange.length > 0) {
				report += '\nOrder changed!\n';
				report += orderChange.map(
					change => `${change.title}: ${change.order}`
				).join('\n');
			}
			if (scheduleChange.length > 0) {
				report += '\nRun info changed!\n';
				report += scheduleChange.map(
					change =>
						`${change.title}: ${change.column} is now ${
							change.after
						} (was ${change.before})`
				).join('\n');
			}
			if (addedRuns.length > 0) {
				report += '\nRun added!\n';
				report += addedRuns.map(run => {
					const previousRun = after.schedule[run.index - 1];
					const nextRun = after.schedule[run.index + 1];
					return `${run.game} (${run.category}) run by ${
						run.runners
					} (between ${
						previousRun ? previousRun.game : '(NOT FOUND)'
					} and ${nextRun ? nextRun.game : '(NOT FOUND)'}`;
				}).join('\n');
			}
			if (deletedRuns.length > 0) {
				report += '\nRun deleted!\n';
				report += deletedRuns.map(
					run =>
						`${run.game} (${run.category}) run by ${
							run.runners
						}`
				).join('\n');
			}

			return report;
		}
	);
};

const enum OrderMove {
	Up = '⬆',
	Down = '⬇',
}
