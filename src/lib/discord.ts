import axios from 'axios';
import {Config} from '../types';

const stage = process.env.SLS_STAGE || 'development';
// tslint:disable:no-var-requires
const config: Config = require(`../../config/${stage}.json`);
const discordConfig = config.discord;

export class DiscordClient {
	constructor(private readonly eventName: string) {}

	public async output(content: string) {
		await Promise.all(
			discordConfig.output.map(async url =>
				this.post(url, this.eventName, content)
			)
		);
	}

	public async system(content: string) {
		await this.post(
			discordConfig.system,
			`${this.eventName} ${stage}`,
			content
		);
	}

	private async post(url: string, username: string, content: string) {
		const slicedContent = content.slice(0, 2000);
		const params = {
			username,
			content: slicedContent,
		};
		await axios.post(url, params);
	}
}
