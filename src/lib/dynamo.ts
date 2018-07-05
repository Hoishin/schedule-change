import {DynamoDB} from 'aws-sdk';

const docClient = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME!;

export class DynamoClient<P> {
	async get(eventName: string) {
		const res = await docClient
			.get({
				TableName: TABLE_NAME,
				Key: {eventName},
			})
			.promise();
		return res.Item && res.Item.data && JSON.parse(res.Item.data);
	}

	async put(eventName: string, data: P[]) {
		await docClient
			.put({
				TableName: TABLE_NAME,
				Item: {
					eventName,
					data: JSON.stringify(data),
				},
			})
			.promise();
	}
}
