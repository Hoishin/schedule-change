import {comparator} from './comparator';
import {DiscordEmbed} from '../types';

type ComparatorResult = ReturnType<typeof comparator>;

const timestamp = new Date();

const makeEmbed = (
	title: string,
	color: number,
	fields: DiscordEmbed['fields']
): DiscordEmbed => ({
	author: {
		name: title,
		icon_url:
			'https://yt3.ggpht.com/a-/ACSszfFfgW4b3ws_SI8FqS2IU5QCCjjUTnLye_GScg=s900-mo-c-c0xffffffff-rj-k-no',
	},
	timestamp,
	color,
	fields,
	provider: {
		name: 'schedule-change',
		url: 'https://github.com/japaneserestream/schedule-change',
	},
});

export const formatter = (result: ComparatorResult) => {
	if (!result) {
		return;
	}

	const output: DiscordEmbed[] = [];

	for (const diff of result) {
		if (diff.added) {
			output.push(
				makeEmbed(
					'Run Added',
					0x4164f4,
					diff.value.map(run => ({
						name: `${run.game || '???'} (${run.index})`,
						value: [run.runners, run.category, run.platform].join(
							'\n'
						),
						inline: true,
					}))
				)
			);
		} else if (diff.removed) {
			output.push(
				makeEmbed(
					'Run Removed',
					0xf44141,
					diff.value.map(run => ({
						name: `${run.game || '???'} (${run.index})`,
						value: [run.runners, run.category, run.platform].join(
							'\n'
						),
						inline: true,
					}))
				)
			);
		}
	}

	return output;
};
