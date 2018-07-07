import {URL} from 'url';
import _ from 'lodash';

import {scheduleChange} from './lib';

const url = new URL('https://gamesdonequick.com/tracker/search');
url.searchParams.append('type', 'run');
url.searchParams.append('event', '23');

const takeFieldDiff = function*(
	beforeRuns: Run[],
	afterRuns: Run[]
): IterableIterator<string> {
	const allPks = (before: Run[], after: Run[]) =>
		_.uniq([...before.map(i => i.pk), ...after.map(i => i.pk)]).sort();

	const compareFields = function*(
		beforeFields: RunFields,
		afterFields: RunFields
	) {
		for (const field of fieldDiffKeys) {
			const before = beforeFields[field];
			const after = afterFields[field];
			if (!_.isEqual(before, after)) {
				yield {field, before, after};
			}
		}
	};

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

	for (const pk of allPks(beforeRuns, afterRuns)) {
		const before = beforeRuns.find(i => i.pk === pk);
		const after = afterRuns.find(i => i.pk === pk);

		// exists in both
		if (before && after) {
			yield* [...compareFields(before.fields, after.fields)].map(
				m =>
					`**${before.fields.name}**: ${m.field} has been changed: ${
						m.before
					} → ${m.after}`
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

const takeOrderDiff = function*(
	beforeRuns: Run[],
	afterRuns: Run[]
): IterableIterator<string> {
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

export default () => {
	scheduleChange(
		'SGDQ2018',
		url,
		(data: Run[]) => data,
		(before, after) => {
			const result = [...takeFieldDiff(before, after)]
			if (result.length === 0) {
				return
			}
			return '**Schedule changed!**\n' + result.join('\n')
		},
		(before, after) => {
			const result = [...takeOrderDiff(before, after)]
			if (result.length === 0) {
				return
			}
			return '**Order Changed!**\n' + result.join('\n')
		}
	);
};

interface Run {
	pk: number;
	model: 'tracker.speedrun';
	fields: RunFields;
}

const enum FieldKey {
	Category = 'category',
	GiantbombId = 'giantbomb_id',
	Coop = 'coop',
	Console = 'console',
	Name = 'name',
	SetupTime = 'setup_time',
	Event = 'event',
	Order = 'order',
	Public = 'public',
	ReleaseYear = 'release_year',
	RunTime = 'run_time',
	StartTime = 'starttime',
	DisplayName = 'display_name',
	Commentators = 'commentators',
	EndTime = 'endtime',
	DeprecatedRunners = 'deprecated_runners',
	Runners = 'runners',
	Description = 'description',
}

interface RunFields {
	[FieldKey.Category]: string;
	[FieldKey.GiantbombId]: null;
	[FieldKey.Coop]: boolean;
	[FieldKey.Console]: string;
	[FieldKey.Name]: string;
	[FieldKey.SetupTime]: string;
	[FieldKey.Event]: number;
	[FieldKey.Order]: number;
	[FieldKey.Public]: string;
	[FieldKey.ReleaseYear]: number | null;
	[FieldKey.RunTime]: string;
	[FieldKey.StartTime]: string;
	[FieldKey.DisplayName]: string;
	[FieldKey.Commentators]: string;
	[FieldKey.EndTime]: string;
	[FieldKey.DeprecatedRunners]: string;
	[FieldKey.Runners]: number[];
	[FieldKey.Description]: string;
}
