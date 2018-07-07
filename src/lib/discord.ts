import axios from 'axios';
import {Config} from '../types';

const config: Config = require(`../../config/${process.env.SLS_STAGE}.json`);
const discordConfig = config.discord;

export class DiscordClient {
	constructor(private readonly eventName: string) {}

	public async output(content: string) {
		await Promise.all(
			discordConfig.output.map(url =>
				this.post(url, this.eventName, content)
			)
		);
	}

	public async system(content: string) {
		await this.post(discordConfig.system, this.eventName, content);
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
