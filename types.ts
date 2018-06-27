export interface RunFields {
	category: string;
	giantbomb_id: null;
	coop: boolean;
	console: string;
	name: string
	setup_time: string
	event: number
	order: number
	public: string
	release_year: number | null
	run_time: string
	starttime: string
	display_name: string
	commentators: string
	endtime: string
	deprecated_runners: string
	runners: number[]
	description: string
}

export interface Run {
	pk: number;
	model: 'tracker.speedrun';
	fields: RunFields;
}

export type Type = 'run' | 'runner';

export type FieldsDiff = {
	[x in keyof RunFields]?: {
		before: RunFields[x],
		after: RunFields[x],
	}
}
