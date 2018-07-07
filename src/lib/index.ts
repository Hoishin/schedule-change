import {URL} from 'url';
import axios from 'axios';

import {DynamoClient} from './dynamo';
import {DiscordClient} from './discord';

export {DynamoClient, DiscordClient};

export const scheduleChange = async <T, U>(
	eventName: string,
	url: URL,
	parser: (data: T) => U[],
	...comparers: Array<(before: U[], after: U[]) => string | void>
) => {
	const dynamoClient = new DynamoClient<U>();
	const discordClient = new DiscordClient(eventName);

	try {
		// Fetch the latest schedule and get last-fetched schedule from DB
		const [beforeSchedule, fetchedSchedule] = await Promise.all([
			dynamoClient.get(eventName),
			axios.get<T>(url.toString()),
		]);
		const afterSchedule = parser(fetchedSchedule.data);

		// If this is the first time (=== no relevent data in DB), initialize and exit
		if (typeof beforeSchedule === 'undefined') {
			await Promise.all([
				discordClient.system(`Data initialized for ${eventName}`),
				dynamoClient.put(eventName, afterSchedule),
			]);
			return;
		}

		await Promise.all(
			comparers
				.map(comparer => comparer(beforeSchedule, afterSchedule))
				.filter(Boolean)
				.map(message => discordClient.output(message || ''))
		);
		await dynamoClient.put(eventName, afterSchedule);
	} catch (err) {
		console.trace(err);
		discordClient.system(err.message).catch(console.trace);
	}
};
