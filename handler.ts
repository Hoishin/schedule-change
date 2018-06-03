type TrackerFetchedData = {[x: string]: any}[];

import axios from 'axios';
import {DynamoDB} from 'aws-sdk';
import _ from 'lodash';
import {Handler} from 'aws-lambda';

const docClient = new DynamoDB.DocumentClient();

const serverEndpoint = process.env.SERVER_ENDPOINT!;
const eventUuid = process.env.EVENT_UUID!;

const fetchNewSchedule = async () => {
	const [{data: runs}, {data: runners}] = await Promise.all([
		axios.get(process.env.TRACKER_ENDPOINT_RUN!),
		axios.get(process.env.TRACKER_ENDPOINT_RUNNERS!),
	]);
	return {runs, runners};
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

const putToDb = (runs: TrackerFetchedData, runners: TrackerFetchedData) => {
	return docClient
		.put({
			TableName: 'donation-tracker-crawler',
			Item: {
				eventUuid,
				runs: JSON.stringify(runs),
				runners: JSON.stringify(runners),
			},
		})
		.promise();
};

const mainPromise = async () => {
	const {runs, runners} = await fetchNewSchedule();
	const {Item} = await docClient
		.get({
			TableName: 'donation-tracker-crawler',
			Key: {eventUuid},
			AttributesToGet: ['runs', 'runners'],
		})
		.promise();
	if (!Item) {
		await putToDb(runs, runners);
		await axios.post(serverEndpoint, {runs, runners});
		return;
	}
	const runsDiff = takeDiff(JSON.parse(Item.runs), runs);
	const runnersDiff = takeDiff(JSON.parse(Item.runners), runners);
	if (!runsDiff && !runnersDiff) {
		return;
	}
	await putToDb(runs, runners);
	await axios.patch(serverEndpoint, {runs: runsDiff, runners: runnersDiff});
};

const main: Handler = () => {
	mainPromise().catch(console.error);
};

export {main};
