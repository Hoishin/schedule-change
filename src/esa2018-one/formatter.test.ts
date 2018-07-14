import * as m from './formatter';
import {OrderChange} from './types';

describe('formatter', () => {
	it('outputs nothing if no changes', () => {
		const r = m.formatter({
			deletedRuns: [],
			addedRuns: [],
			changedRuns: [],
		});
		expect(r).toEqual([]);
	});

	it('formats deleted run', () => {
		const r = m.formatter({
			deletedRuns: [
				{
					game: 'deleted game',
					runners: 'deleted runners',
					platform: 'deleted platform',
					category: 'deleted category',
				},
			],
			addedRuns: [],
			changedRuns: [],
		});
		const expected = `
**Deleted Runs**
deleted game
`;
		expect(r).toContain(expected);
	});

	it('formats added run', () => {
		const r = m.formatter({
			deletedRuns: [],
			addedRuns: [
				{
					game: 'added game',
					runners: 'added runners',
					platform: 'added platform',
					category: 'added category',
				},
			],
			changedRuns: [],
		});
		const expected = `
**Added Runs**
added game by added runners (added platform, added category)
`;
		expect(r).toContain(expected);
	});

	it('formats changed run', () => {
		const r = m.formatter({
			deletedRuns: [],
			addedRuns: [],
			changedRuns: [
				{
					game: 'changed game',
					orderChange: OrderChange.Up,
				},
			],
		});
		const expected = `
**Changed Runs**
changed game: ↑
`;
		expect(r).toContain(expected);
	});
});
