import {Horaro} from '../types';

const searchColumnIndex = (columnName: string, columns: string[]) =>
	columns.findIndex(column => column.toLowerCase().includes(columnName));

/**
 * Removes markdown link: `[label](url)` to `label`
 * @param markdownLink string to remove markdown link
 */
const removeMarkdownLink = (markdownLink: string | null) =>
	typeof markdownLink === 'string'
		? markdownLink.replace(/\[([^\]]*)\]\(([^\)]*)\)/g, '$1')
		: null;

const convertRawDataToRun = (
	item: Horaro['data']['items'][0],
	columns: string[]
) => ({
	game: removeMarkdownLink(item.data[searchColumnIndex('game', columns)]),
	runners: removeMarkdownLink(
		item.data[searchColumnIndex('player', columns)]
	),
	platform: removeMarkdownLink(
		item.data[searchColumnIndex('platform', columns)]
	),
	category: removeMarkdownLink(
		item.data[searchColumnIndex('category', columns)]
	),
});

export const parser = (rawData: Horaro) => {
	const columns = rawData.data.columns;
	return {
		runs: rawData.data.items.map(item =>
			convertRawDataToRun(item, columns)
		),
		data: {
			updatedAt: rawData.data.updated,
		},
	};
};
