import {DynamoDB} from 'aws-sdk';

const docClient = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

export class DynamoClient<T> {
	private readonly TABLE_NAME: string;

	constructor() {
		if (!TABLE_NAME) {
			throw new Error('Missing TABLE_NAME');
		}
		this.TABLE_NAME = TABLE_NAME;
	}

	async get(eventName: string): Promise<T | undefined> {
		const res = await docClient
			.get({
				TableName: this.TABLE_NAME,
				Key: {eventName},
			})
			.promise();
		return res.Item && res.Item.data && JSON.parse(res.Item.data);
	}

	async put(eventName: string, data: T) {
		await docClient
			.put({
				TableName: this.TABLE_NAME,
				Item: {
					eventName,
					data: JSON.stringify(data),
					updatedAt: new Date().toISOString(),
				},
			})
			.promise();
	}
}
