import {URL} from 'url';
import axios from 'axios';

import {DynamoClient} from './dynamo';
import {DiscordClient} from './discord';

export {DynamoClient, DiscordClient};

export const scheduleChange = async <O, I, D>(
	eventName: string,
	url: URL,
	parser: (data: O) => ScheduleData<I, D>,
	...comparers: Array<
		(before: ScheduleData<I, D>, after: ScheduleData<I, D>) => string | void
	>
) => {
	const dynamoClient = new DynamoClient<ScheduleData<I, D>>();
	const discordClient = new DiscordClient(eventName);

	try {
		// Fetch the latest schedule and get last-fetched schedule from DB
		const [before, fetchedSchedule] = await Promise.all([
			dynamoClient.get(eventName),
			axios.get<O>(url.toString()),
		]);
		const after = parser(fetchedSchedule.data);

		// If this is the first time (=== no relevent data in DB), initialize and exit
		if (typeof before === 'undefined') {
			await Promise.all([
				discordClient.system(`Data initialized for ${eventName}`),
				dynamoClient.put(eventName, after),
			]);
			return;
		}

		// Compare and get message strings. If it's empty, exit.
		const messages: string[] = [];
		for (const comparer of comparers) {
			const message = comparer(before, after);
			if (message !== undefined) {
				messages.push(message);
			}
		}
		if (messages.length === 0) {
			return;
		}

		// Send messages to Discord
		await Promise.all(
			messages.map(message => discordClient.output(message))
		);

		// Save new schedule
		await dynamoClient.put(eventName, after);
	} catch (err) {
		console.trace(err);
		discordClient.system(err.message).catch(console.trace);
	}
};

interface ScheduleData<I, D> {
	schedule: I[];
	data?: D;
}
