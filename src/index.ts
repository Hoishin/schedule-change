import dotenv from 'dotenv';
dotenv.config();

import {URL} from 'url';
import axios from 'axios';
import _ from 'lodash';
import {Handler} from 'aws-lambda';
import {Run, Type, RunFields, FieldKey} from './types';
import * as discord from './discord';
import * as dynamo from './dynamo';

const {EVENT_NAME, TRACKER_EVENT_ID, TRACKER_URL} = process.env;
const fieldDiffKeys = [
	FieldKey.Category,
	FieldKey.Coop,
	FieldKey.Console,
	FieldKey.Name,
	FieldKey.ReleaseYear,
	FieldKey.DisplayName,
	FieldKey.Commentators,
	FieldKey.DeprecatedRunners,
	FieldKey.Description,
];

//
/**
 * Merge all pks and take unique sorted list
 * @param before
 * @param after
 */
const allPks = (before: Run[], after: Run[]) => _.uniq([...before.map(i => i.pk), ...after.map(i => i.pk)]).sort();

const fetchSchedule = async (type: Type) => {
	if (!TRACKER_URL) {
		throw new Error('Missing TRACKER_URL');
	}
	if (!TRACKER_EVENT_ID) {
		throw new Error('Missing TRACKER_EVENT_ID');
	}
	const trackerUrl = new URL(TRACKER_URL);
	trackerUrl.searchParams.append('type', type);
	trackerUrl.searchParams.append('event', TRACKER_EVENT_ID);
	const res = await axios.get<Run[]>(trackerUrl.toString());
	return res.data;
};

const compareFields = function*(beforeFields: RunFields, afterFields: RunFields) {
	for (const field of fieldDiffKeys) {
		const before = beforeFields[field];
		const after = afterFields[field];
		if (!_.isEqual(before, after)) {
			yield {field, before, after};
		}
	}
};

const takeFieldDiff = function*(beforeRuns: Run[], afterRuns: Run[]): IterableIterator<string> {
	// merge all pks and take unique sorted list
	const pks = allPks(beforeRuns, afterRuns);

	for (const pk of pks) {
		const before = beforeRuns.find(i => i.pk === pk);
		const after = afterRuns.find(i => i.pk === pk);

		// exists in both
		if (before && after) {
			yield* [...compareFields(before.fields, after.fields)].map(
				m => `**${before.fields.name}** \`${m.field}\` has been changed: ${m.before} → ${m.after}`
			);
			continue;
		}

		// exists in old, not in new
		if (before && !after) {
			yield '`' + before.fields.name + '` has been deleted';
			continue;
		}

		// exists in new, not in old
		if (!before && after) {
			yield '`' + after.fields.name + '` has been created';
			continue;
		}
	}
};

const takeOrderDiff = function*(beforeRuns: Run[], afterRuns: Run[]): IterableIterator<string> {
	for (const afterRun of afterRuns) {
		const beforeRun = beforeRuns.find(run => run.pk === afterRun.pk);
		if (!beforeRun) {
			continue;
		}
		const beforeOrder = beforeRun.fields[FieldKey.Order];
		const afterOrder = afterRun.fields[FieldKey.Order];
		if (beforeOrder === afterOrder) {
			continue;
		}
		if (beforeOrder < afterOrder) {
			yield `**${afterRun.fields.name}**: ⬇`;
		}
		if (beforeOrder > afterOrder) {
			yield `**${afterRun.fields.name}**: ⬆`;
		}
	}
};

const refresh = async (type: Type) => {
	if (!EVENT_NAME) {
		throw new Error('Missing EVENT_NAME');
	}
	const [dbData, afterRuns] = await Promise.all([dynamo.get(EVENT_NAME, type), fetchSchedule(type)]);

	if (!afterRuns) {
		throw new Error('Failed to fetch latest runs');
	}

	if (!dbData) {
		await Promise.all([discord.system('Data initialized'), dynamo.put(EVENT_NAME, type, afterRuns)]);
		return;
	}

	const beforeRuns = JSON.parse(dbData.data);
	const fieldDiff = [...takeFieldDiff(beforeRuns, afterRuns)];
	const orderDiff = [...takeOrderDiff(beforeRuns, afterRuns)];

	const makePromises = () => {
		const promises: Promise<any>[] = [];
		if (fieldDiff.length > 0) {
			promises.push(discord.output(fieldDiff.join('\n')));
		}
		if (orderDiff.length > 0) {
			promises.push(discord.output('**Order has been changed!**\n' + orderDiff.join('\n')));
		}
		return promises;
	};

	await Promise.all([...makePromises(), dynamo.put(EVENT_NAME, type, afterRuns)]);
};

export const run: Handler = () => {
	refresh('run')
		.catch(err => {
			discord.system(err.message);
			console.error(String(err));
		})
		.catch(err => {
			if (err.response) {
				console.log(err.response.data);
			}
			console.error(err);
		});
};
