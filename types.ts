export const enum FieldKey {
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

export interface RunFields {
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

export interface Run {
	pk: number;
	model: 'tracker.speedrun';
	fields: RunFields;
}

export type Type = 'run' | 'runner';
