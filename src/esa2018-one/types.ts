import {Schedule} from '../types';

export interface EsaRun {
	game: string | null;
	runners: string | null;
	platform: string | null;
	category: string | null;
	index: number;
}

export interface EsaSchedule extends Schedule<EsaRun, {}> {
	runs: EsaRun[];
	data: {
		updatedAt: string;
	};
}
