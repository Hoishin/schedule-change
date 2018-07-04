import {DynamoDB} from 'aws-sdk';
import {Run, Type} from './types';

const docClient = new DynamoDB.DocumentClient();
const TABLE_NAME = 'donation-tracker-crawler';

export const put = async (eventName: string, type: Type, data: Run[]) => {
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

export const get = async (eventName: string, type: Type) => {
	const res = await docClient
		.get({
			TableName: TABLE_NAME,
			Key: {eventName, type},
		})
		.promise();
	return res.Item;
};
