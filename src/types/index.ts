import config from './template.json';
import horaroData from './horaro.json';

export type Config = typeof config;

export type Horaro = typeof horaroData;

export interface Schedule<I, D> {
	runs: I[];
	data: D;
}

export interface DiscordEmbed {
	title?: string;
	type?: string;
	description?: string;
	url?: string;
	timestamp?: Date;
	color?: number;
	footer?: {
		text?: string;
		icon_url?: string;
		proxy_icon_url?: string;
	};
	image?: {
		url?: string;
		proxy_url?: string;
		height?: number;
		width?: number;
	};
	thumbnail?: {
		url?: string;
		proxy_url?: string;
		height?: number;
		width?: number;
	};
	video?: {
		url?: string;
		height?: number;
		width?: number;
	};
	provider?: {
		name?: string;
		url?: string;
	};
	author?: {
		name?: string;
		url?: string;
		icon_url?: string;
		proxy_icon_url?: string;
	};
	fields?: {
		name?: string;
		value?: string;
		inline?: boolean;
	}[];
}
