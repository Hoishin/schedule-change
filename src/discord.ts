import axios from 'axios';
const {EVENT_NAME, OUTPUT_WEBHOOK, SYSTEM_WEBHOOK} = process.env;

const post = async (url: string, username: string, content: string) => {
	content = content.slice(0, 2000);
	const params = {
		username,
		content,
	};
	await axios.post(url, params);
};

export const output = async (content: string) => {
	if (!OUTPUT_WEBHOOK) {
		throw new Error('Missing OUTPUT_WEBHOOK');
	}
	if (!EVENT_NAME) {
		throw new Error('Missing EVENT_NAME');
	}
	const webhookUrls = OUTPUT_WEBHOOK.split(',');
	await Promise.all(webhookUrls.map(url => post(url, EVENT_NAME, content)));
};

export const system = async (content: string) => {
	if (!SYSTEM_WEBHOOK) {
		throw new Error('Missing SYSTEM_WEBHOOK');
	}
	if (!EVENT_NAME) {
		throw new Error('Missing EVENT_NAME');
	}
	await post(SYSTEM_WEBHOOK, EVENT_NAME, content);
};
