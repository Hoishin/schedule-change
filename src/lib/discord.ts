import axios from 'axios';
const {OUTPUT_WEBHOOK, SYSTEM_WEBHOOK} = process.env;

export class DiscordClient {
	constructor(private readonly eventName: string) {}

	public async output(content: string) {
		if (!OUTPUT_WEBHOOK) {
			throw new Error('Missing OUTPUT_WEBHOOK');
		}
		const webhookUrls = OUTPUT_WEBHOOK.split(',');
		await Promise.all(
			webhookUrls.map(url => this.post(url, this.eventName, content))
		);
	}

	public async system(content: string) {
		if (!SYSTEM_WEBHOOK) {
			throw new Error('Missing SYSTEM_WEBHOOK');
		}
		await this.post(SYSTEM_WEBHOOK, this.eventName, content);
	}

	private async post(url: string, username: string, content: string) {
		content = content.slice(0, 2000);
		const params = {
			username,
			content,
		};
		await axios.post(url, params);
	}
}
