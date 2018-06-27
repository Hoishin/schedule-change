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

const compareFields = (beforeFields: RunFields, afterFields: RunFields) => {
	const fields = Object.keys({
		...beforeFields,
		...afterFields,
	}) as (keyof RunFields)[];

	return fields
		.map(field => {
			const before = beforeFields[field];
			const after = afterFields[field];

			if (!_.isEqual(before, after)) {
				return {field, before, after};
			}
			return;
		})
		.filter(Boolean);
};

const takeDiff = (beforeRuns: Run[], afterRuns: Run[]) => {
	const pks = _
		.uniq([...beforeRuns.map(i => i.pk), ...afterRuns.map(i => i.pk)])
		.sort();

	const changed = [];
	const added = [];
	const deleted = [];

	for (const pk of pks) {
		const before = beforeRuns.find(i => i.pk === pk);
		const after = afterRuns.find(i => i.pk === pk);

		// exists in both
		if (before && after) {
			const diff = compareFields(before.fields, after.fields);
			if (diff.length > 0) {
				changed.push({pk, diff});
			}
			continue;
		}

		// exists in old, not in new
		if (before && !after) {
			deleted.push(before);
			continue;
		}

		// exists in new, not in old
		if (!before && after) {
			added.push(after);
			continue;
		}
	}

	if (changed.length === 0 && added.length === 0 && deleted.length === 0) {
		return;
	}

	return {changed, added, deleted};
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
		webhookUrls.map(url =>
			discordPost(url, EVENT_NAME, content)
		)
	);
};

const discordSystem = async (content: string) => {
	if (!SYSTEM_WEBHOOK) {
		throw new Error('Missing SYSTEM_WEBHOOK');
	}
	if (!EVENT_NAME) {
		throw new Error('Missing EVENT_NAME');
	}
	await discordPost(
		SYSTEM_WEBHOOK,
		EVENT_NAME,
		content
	);
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
	if (!diff) {
		return;
	}

	const content = json.plain(diff);
	await Promise.all([
		discordOutput(codeBlock(content, 'json')),
		dynamoPut(EVENT_NAME, type, afterRuns),
	]);
};

export const run: Handler = () => {
	refresh('run')
		.then(() => discordSystem(`Function succeeded at ${new Date().toISOString()}`))
		.catch(err => {
			discordSystem(codeBlock(err.message));
			console.error(err);
		})
		.catch(err => {
			console.error(err);
		});
};
