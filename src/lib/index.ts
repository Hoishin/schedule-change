import {URL} from 'url';
import axios from 'axios';

import {DynamoClient} from './dynamo';
import {DiscordClient} from './discord';
import {Schedule} from '../types';

export {DynamoClient, DiscordClient};

export const scheduleChange = <O, I, D, T>(
	eventName: string,
	url: URL,
	parser: (data: O) => Schedule<I, D>,
	comparer: (before: Schedule<I, D>, after: Schedule<I, D>) => T,
	formatter: (compareResult: T) => string | string[] | void
) => {
	const dynamoClient = new DynamoClient<Schedule<I, D>>();
	const discordClient = new DiscordClient(eventName);

	(async () => {
		// Fetch the latest schedule and get last-fetched schedule from DB
		const [before, fetchedSchedule] = await Promise.all([
			dynamoClient.get(eventName),
			axios.get<O>(url.toString()),
		]);
		const after = parser(fetchedSchedule.data);

		// If this is the first time (=== no relevent data in DB), initialize and exit
		if (before === undefined) {
			await Promise.all([
				discordClient.system(`Data initialized for ${eventName}`),
				dynamoClient.put(eventName, after),
			]);
			return;
		}

		const compareResult = comparer(before, after);

		// Compare and get message strings. If it's empty, exit.
		const message = formatter(compareResult);

		// No messages output, exit.
		if (!message || message.length === 0) {
			return;
		}

		// Send messages to Discord. If it is array of strings, send them concurrently.
		if (Array.isArray(message)) {
			await Promise.all(
				message.map(async msg => discordClient.output(msg))
			);
		} else {
			await discordClient.output(message);
		}

		// Save new schedule
		await dynamoClient.put(eventName, after);
	})().catch(err => {
		console.trace(err);
		discordClient.system(err.message).catch(console.trace);
	});
};
