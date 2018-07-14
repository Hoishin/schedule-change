import axios from 'axios';
import {Config, DiscordEmbed} from '../types';

const stage = process.env.SLS_STAGE || 'development';
// tslint:disable:no-var-requires
const config: Config = require(`../../config/${stage}.json`);
const discordConfig = config.discord;

export class DiscordClient {
	constructor(private readonly eventName: string) {}

	public async output(content: string | DiscordEmbed[]) {
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

	private async post(
		url: string,
		username: string,
		content: string | DiscordEmbed[]
	) {
		const params: {
			username: string;
			content?: string;
			embeds?: DiscordEmbed[];
		} = {
			username,
		};
		if (typeof content === 'string') {
			params.content = content;
			await axios.post(url, params);
		} else {
			while (content.length > 0) {
				params.embeds = content.splice(0, 5);
				await axios.post(url, params);
			}
		}
	}
}
