import faker from 'faker';
import _ from 'lodash';
import * as m from './comparer';
import {EsaSchedule, OrderChange} from './types';

const makeRun = (game = faker.lorem.word(), runners = faker.lorem.word()) => ({
	game,
	runners,
	platform: faker.lorem.word(),
	category: faker.lorem.word(),
});

const makeSchedule = () => ({
	runs: Array(5)
		.fill(null)
		.map((__, i) => makeRun(`game${i}`, `runner${i}`)),
	data: {
		updatedAt: faker.date.past().toISOString(),
	},
});

describe('comparer', () => {
	let beforeSchedule: EsaSchedule;
	let afterSchedule: EsaSchedule;

	beforeEach(() => {
		beforeSchedule = makeSchedule();
		afterSchedule = _.cloneDeep(beforeSchedule);
	});

	it('outputs nothing with same schedule', () => {
		const r = m.comparer(beforeSchedule, afterSchedule);
		expect(r).toEqual({
			deletedRuns: [],
			addedRuns: [],
			changedRuns: [],
		});
	});

	it('different game but same runner', () => {
		afterSchedule.runs[3] = makeRun('_game', 'runner3');
		expect(
			m.comparer(beforeSchedule, afterSchedule).addedRuns
		).toContainEqual(expect.objectContaining({game: '_game', runners: 'runner3'}));
	});

	it('different runner but same game', () => {
		afterSchedule.runs[3] = makeRun('game3', '_runner');
		expect(
			m.comparer(beforeSchedule, afterSchedule).addedRuns
		).toContainEqual(expect.objectContaining({game: 'game3', runners: '_runner'}));
	});

	it('add a run', () => {
		afterSchedule.runs.splice(2, 0, makeRun('_game', '_runners'));
		expect(m.comparer(beforeSchedule, afterSchedule).addedRuns[0]).toEqual(
			expect.objectContaining({
				game: '_game',
				runners: '_runners',
			})
		);
	});

	it('move a run down', () => {
		afterSchedule.runs.push(afterSchedule.runs.splice(2, 1)[0]);
		const r = m.comparer(beforeSchedule, afterSchedule).changedRuns[0];
		expect(r).toEqual(
			expect.objectContaining({
				game: 'game2',
				orderChange: OrderChange.Down,
			})
		);
	});
});
