import axios from 'axios';
import {chunk} from 'lodash';
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
		const params = {username};

		if (typeof content !== 'string') {
			const chunks = chunk(content, 5);
			for (const item of chunks) {
				await axios.post(url, {
					...params,
					embeds: item,
				});
			}
			return;
		}

		const splitContent = content.match(/{1,2000}/g);
		if (!splitContent) {
			return;
		}
		for (const item of splitContent) {
			await axios.post(url, {
				...params,
				content: item,
			});
		}
	}
}
