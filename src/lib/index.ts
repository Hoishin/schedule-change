import axios from 'axios';
import {URL} from 'url';
import {DynamoClient} from './dynamo';
import {DiscordClient} from './discord';

export class Fetcher<O, P> {
	constructor(
		private readonly url: URL,
		private readonly filterer: (
			item: O,
			index: number,
			array: O[]
		) => boolean = () => true,
		private readonly mapper: (item: O, index: number, array: O[]) => P
	) {}

	async fetch() {
		const res = await axios.get<O[]>(this.url.toString());
		return res.data.filter(this.filterer).map(this.mapper);
	}
}

export class Comparer<P, R> {
	constructor(
		private readonly comparers: ((
			beforeSchedule: P[],
			afterSchedule: P[]
		) => R[])[]
	) {}

	compare(beforeSchedule: P[], afterSchedule: P[]) {
		return this.comparers.map(comparer =>
			comparer(beforeSchedule, afterSchedule)
		);
	}
}

export class Formatter<R> {
	constructor(private readonly formatter: ((result: R[]) => string)[]) {}

	format(result: R[][]) {
		return result.map((r, i) => this.formatter[i](r));
	}
}

export class ScheduleChange<O, P, R> {
	private readonly dynamoClient: DynamoClient<P>;
	private readonly discordClient: DiscordClient;

	constructor(
		private readonly eventName: string,
		private readonly fetcher: Fetcher<O, P>,
		private readonly comparer: Comparer<P, R>,
		private readonly formatter: Formatter<R>
	) {
		this.dynamoClient = new DynamoClient();
		this.discordClient = new DiscordClient(eventName);
	}

	public run() {
		this.execute()
			.catch(err => {
				this.discordClient.system(err.message);
				console.error(String(err));
			})
			.catch(err => {
				if (err.response) {
					console.log(err.response.data);
				}
				console.error(err);
			});
	}

	private async execute() {
		const [beforeSchedule, afterSchedule] = await Promise.all([
			this.dynamoClient.get(this.eventName),
			this.fetcher.fetch(),
		]);
		if (!beforeSchedule) {
			await Promise.all([
				this.discordClient.system(
					`Data initialized for ${this.eventName}`
				),
				this.putSchedule(afterSchedule),
			]);
			return;
		}
		const results = this.comparer
			.compare(beforeSchedule, afterSchedule)
			.filter(result => result.length > 0);
		const formattedResult = this.formatter.format(results);
		await Promise.all(formattedResult.map(this.discordClient.output));
	}

	private async putSchedule(schedule: P[]) {
		await this.dynamoClient.put(this.eventName, schedule);
	}
}
