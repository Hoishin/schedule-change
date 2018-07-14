import {Schedule} from '../types';

export interface EsaRun {
	game: string | null;
	runners: string | null;
	platform: string | null;
	category: string | null;
}

export interface EsaSchedule extends Schedule<EsaRun, {}> {
	runs: EsaRun[];
	data: {
		updatedAt: string;
	};
}
export const enum OrderChange {
	Up = '↑',
	Down = '↓',
	Same = '→',
}
