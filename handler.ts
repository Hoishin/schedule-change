type TrackerFetchedData = {[x: string]: any}[];
type Type = 'run' | 'runner';

import {URL} from 'url';
import axios from 'axios';
import {DynamoDB} from 'aws-sdk';
import _ from 'lodash';
import {Handler} from 'aws-lambda';

if (!process.env.SERVER_URL) {
	throw new TypeError('Server URL is not defined');
}
const serverUrl = new URL(process.env.SERVER_URL);
if (!process.env.EVENT_UUID) {
	throw new TypeError('Event UUID is not defined');
}
const eventUuid = process.env.EVENT_UUID;

const docClient = new DynamoDB.DocumentClient();

const fetchNewSchedule = async (type: Type) => {
	if (!process.env.TRACKER_URL) {
		throw new TypeError('Tracker URL is not defined');
	}
	const eventId = process.env.TRACKER_EVENT_ID;
	if (!eventId) {
		throw new TypeError('Tracker event ID is not defined');
	}
	const trackerUrl = new URL(process.env.TRACKER_URL);
	trackerUrl.searchParams.append('type', type);
	trackerUrl.searchParams.append('event', eventId);
	const res = await axios.get<TrackerFetchedData>(trackerUrl.toString());
	return res.data;
};

const takeDiff = (oldOne: TrackerFetchedData, newOne: TrackerFetchedData) => {
	const added = newOne.filter(newItem => {
		const oldItemIndex = oldOne.findIndex(oldItem =>
			_.isEqual(newItem, oldItem)
		);
		if (oldItemIndex !== -1) {
			oldOne.splice(oldItemIndex, 1);
		}
		return oldItemIndex === -1;
	});
	if (added.length === 0 && oldOne.length === 0) {
		return;
	}
	return {deleted: oldOne, added};
};

const dynamoPut = (eventUuid: string, type: Type, data: TrackerFetchedData) => {
	return docClient
		.put({
			TableName: 'donation-tracker-crawler',
			Item: {
				eventUuid,
				type,
				data,
			},
		})
		.promise();
};

const refresh = async (type: Type) => {
	const latest = await fetchNewSchedule(type);
	const {Item: last} = await docClient
		.get({
			TableName: 'donation-tracker-crawler',
			Key: {eventUuid, type},
		})
		.promise();
	if (!last) {
		await dynamoPut(eventUuid, type, latest);
		await axios.post(serverUrl.toString(), {
			type,
			data: latest,
		});
		return;
	}
	const diff = takeDiff(JSON.parse(last.data), latest);
	if (!diff) {
		return;
	}
	await dynamoPut(eventUuid, type, latest);
	await axios.patch(serverUrl.toString(), {
		type,
		data: diff,
	});
};

const runs: Handler = () => {
	refresh('run').catch(console.error);
};

const runners: Handler = () => {
	refresh('runner').catch(console.error);
};

export {runs, runners};
