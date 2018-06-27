import dotenv from 'dotenv';
dotenv.config();

import {URL} from 'url';
import axios from 'axios';
import {DynamoDB} from 'aws-sdk';
import _ from 'lodash';
import {Handler} from 'aws-lambda';
// @ts-ignore
import json from 'format-json';
import {Run, Type, RunFields} from './types';

const {
	EVENT_NAME,
	OUTPUT_WEBHOOK,
	SYSTEM_WEBHOOK,
	TRACKER_EVENT_ID,
	TRACKER_URL,
} = process.env;
const TABLE_NAME = 'donation-tracker-crawler';
const docClient = new DynamoDB.DocumentClient();

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

const compareFields = function*(
	beforeFields: RunFields,
	afterFields: RunFields
) {
	const fields = Object.keys({
		...beforeFields,
		...afterFields,
	}) as (keyof RunFields)[];

	for (const field of fields) {
		const before = beforeFields[field];
		const after = afterFields[field];
		if (_.isEqual(before, after)) {
			continue;
		}
		if (['starttime', 'endtime'].includes(field)) {
			continue;
		}
		yield {field, before, after};
	}
};

const takeDiff = (beforeRuns: Run[], afterRuns: Run[]) => {
	const pks = _
		.uniq([...beforeRuns.map(i => i.pk), ...afterRuns.map(i => i.pk)])
		.sort();

	const diff: string[] = [];

	for (const pk of pks) {
		const before = beforeRuns.find(i => i.pk === pk);
		const after = afterRuns.find(i => i.pk === pk);

		// exists in both
		if (before && after) {
			const fieldsDiff = [...compareFields(before.fields, after.fields)].map(
				m =>
					`${before.fields.name}'s ${m.field} has been changed: ${
						m.before
					} -> ${m.after}`
			);
			if (fieldsDiff) {
				diff.push(...fieldsDiff);
			}
			continue;
		}

		// exists in old, not in new
		if (before && !after) {
			diff.push(before.fields.name + 'has been deleted');
			continue;
		}

		// exists in new, not in old
		if (!before && after) {
			diff.push(after.fields.name + 'has been created');
			continue;
		}
	}
	return diff;
};

const dynamoPut = async (eventName: string, type: Type, data: Run[]) => {
	await docClient
		.put({
			TableName: TABLE_NAME,
			Item: {
				eventName,
				type,
				data: JSON.stringify(data),
			},
		})
		.promise();
};

const dynamoGet = async (eventName: string, type: Type) => {
	const res = await docClient
		.get({
			TableName: TABLE_NAME,
			Key: {eventName, type},
		})
		.promise();
	return res.Item;
};

const discordPost = async (url: string, username: string, content: string) => {
	const params = {
		username,
		content,
	};
	await axios.post(url, params);
};

const discordOutput = async (content: string) => {
	if (!OUTPUT_WEBHOOK) {
		throw new Error('Missing OUTPUT_WEBHOOK');
	}
	if (!EVENT_NAME) {
		throw new Error('Missing EVENT_NAME');
	}
	const webhookUrls = OUTPUT_WEBHOOK.split(',');
	await Promise.all(
		webhookUrls.map(url => discordPost(url, EVENT_NAME, content))
	);
};

const discordSystem = async (content: string) => {
	if (!SYSTEM_WEBHOOK) {
		throw new Error('Missing SYSTEM_WEBHOOK');
	}
	if (!EVENT_NAME) {
		throw new Error('Missing EVENT_NAME');
	}
	await discordPost(SYSTEM_WEBHOOK, EVENT_NAME, content);
};

const codeBlock = (content: string, language: string = '') => `
\`\`\`${language}
${content}
\`\`\`
`;

const refresh = async (type: Type) => {
	if (!EVENT_NAME) {
		throw new Error('Missing EVENT_NAME');
	}
	const [dbData, afterRuns] = await Promise.all([
		dynamoGet(EVENT_NAME, type),
		fetchSchedule(type),
	]);

	if (!afterRuns) {
		throw new Error('Failed to fetch latest runs');
	}

	if (!dbData) {
		await Promise.all([
			discordSystem('Data initialized'),
			dynamoPut(EVENT_NAME, type, afterRuns),
		]);
		return;
	}

	const beforeRuns = JSON.parse(dbData.data);
	const diff = takeDiff(beforeRuns, afterRuns);
	if (diff.length === 0) {
		return;
	}

	await Promise.all([
		discordOutput(diff.join('\n')),
		dynamoPut(EVENT_NAME, type, afterRuns),
	]);
};

export const run: Handler = () => {
	refresh('run')
		.then(() =>
			discordSystem(`Function succeeded at ${new Date().toISOString()}`)
		)
		.catch(err => {
			discordSystem(codeBlock(err.message));
			if (err.response) {
				console.log(err.response.data)
			}
			console.error(err);
		})
		.catch(err => {
			if (err.response) {
				console.log(err.response.data)
			}
			console.error(err);
		});
};
